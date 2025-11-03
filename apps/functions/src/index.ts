import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import {
  DocumentChunker,
  EmbeddingService,
  PineconeService,
  RAGService,
  DocumentParser,
} from '@minewise-ai/rag-core';
import * as logger from 'firebase-functions/logger';

// --- Initialization ---
initializeApp();
const db = getFirestore();
const auth = getAuth();

// --- tRPC Setup ---
const t = initTRPC.context<{ userId?: string }>().create();
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});
const protectedProcedure = t.procedure.use(authMiddleware);

// --- App Router Definition (Your existing RAG logic) ---
const appRouter = t.router({
  health: t.procedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })),

  uploadDocument: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        content: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { filename, content, mimeType } = input;
      // Safety check
      if (!ctx.userId) {
        throw new Error('Unauthorized access to uploadDocument.');
      }
      const userId = ctx.userId;

      try {
        const parser = new DocumentParser();
        let textContent: string;

        if (content.match(/^[A-Za-z0s-9+/=]+$/)) {
          const buffer = Buffer.from(content, 'base64');
          textContent = await parser.parseDocument(buffer, mimeType);
        } else {
          textContent = content;
        }

        const docRef = db.collection('documents').doc();
        const documentId = docRef.id;

        const chunker = new DocumentChunker(1000, 200);
        const chunks = await chunker.chunkText(textContent, documentId);

        // NOTE: Pinecone upsert remains commented out as embedding step is not in this file.

        await docRef.set({
          id: documentId,
          filename,
          uploadedAt: new Date(),
          userId,
          size: textContent.length,
          mimeType,
          chunkCount: chunks.length,
        });

        return {
          success: true,
          documentId,
          chunkCount: chunks.length,
        };
      } catch (error: any) {
        logger.error('Error uploading document:', error);
        throw new Error(`Failed to upload document: ${error.message}`);
      }
    }),

  query: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        topK: z.number().int().positive().default(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { query, topK } = input;
      if (!ctx.userId) {
        throw new Error('Unauthorized access to query.');
      }
      const userId = ctx.userId;

      try {
        const embeddingService = new EmbeddingService(process.env.OPENAI_API_KEY!);
        const queryEmbedding = await embeddingService.embedText(query);

        const pineconeService = new PineconeService(
          process.env.PINECONE_API_KEY!,
          process.env.PINECONE_INDEX_NAME || 'minewise-ai',
          process.env.PINECONE_ENVIRONMENT
        );

        const results = await pineconeService.querySimilar(queryEmbedding, topK);

        const ragService = new RAGService(
          process.env.OPENAI_API_KEY!,
          process.env.OPENAI_MODEL || 'gpt-4'
        );

        const response = await ragService.generateAnswer(query, results);

        await db.collection('queryLogs').add({
          userId,
          query,
          timestamp: new Date(),
          resultCount: results.length,
        });

        return response;
      } catch (error: any) {
        logger.error('Error querying:', error);
        throw new Error(`Failed to query: ${error.message}`);
      }
    }),

  getDocuments: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new Error('Unauthorized access to getDocuments.');
      }
      const userId = ctx.userId;

    const snapshot = await db
      .collection('documents')
      .where('userId', '==', userId)
      .orderBy('uploadedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data());
  }),

  deleteDocument: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { documentId } = input;
      if (!ctx.userId) {
        throw new Error('Unauthorized access to deleteDocument.');
      }
      const userId = ctx.userId;

      const docSnap = await db.collection('documents').doc(documentId).get();
      if (!docSnap.exists || docSnap.data()?.userId !== userId) {
        throw new Error('Document not found or unauthorized');
      }

      const pineconeService = new PineconeService(
        process.env.PINECONE_API_KEY!,
        process.env.PINECONE_INDEX_NAME || 'minewise-ai',
        process.env.PINECONE_ENVIRONMENT
      );
      await pineconeService.deleteDocumentChunks(documentId);

      await db.collection('documents').doc(documentId).delete();

      return { success: true };
    }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new Error('Unauthorized access to getDashboardStats.');
      }
      const userId = ctx.userId;

    const [documentsSnap, queriesSnap] = await Promise.all([
      db.collection('documents').where('userId', '==', userId).get(),
      db.collection('queryLogs').where('userId', '==', userId).get(),
    ]);

    return {
      documentCount: documentsSnap.size,
      queryCount: queriesSnap.size,
      totalChunks: documentsSnap.docs.reduce(
        (sum, doc) => sum + (doc.data()?.chunkCount || 0),
        0
      ),
    };
  }),
});

// --- CRITICAL FIX: Cloud Function Export Handler (Resolves TS2345 Promise Mismatch) ---
export const api = onRequest(
  {
    cors: true,
    region: 'us-central1',
  },
  async (request, response) => {
    try {
      const method = request.method;
      const path = request.path;

      // Handle Health Check (GET /health)
      if (method === 'GET' && path === '/health') {
        const result = await appRouter.createCaller({}).health();
        return response.json(result);
      }
      
      // Handle all tRPC Procedures (POST)
      if (method === 'POST') {
        const body = request.body;
        
        if (!body || typeof body !== 'object' || !body.procedure) {
          logger.warn('Invalid request body received.');
          return response.status(400).json({ error: 'Invalid request format or missing procedure.' });
        }

        const { procedure, input } = body;

        // 1. Authentication and Context Setup
        const authHeader = request.headers.authorization;
        let userId: string | undefined;

        if (authHeader?.startsWith('Bearer ')) {
          try {
            const token = authHeader.split('Bearer ')[1];
            // Verify the token to get the user ID
            const decodedToken = await auth.verifyIdToken(token);
            userId = decodedToken.uid;
          } catch (error) {
            logger.warn('Invalid Auth Token received:', error);
          }
        }

        const caller = appRouter.createCaller({ userId });

        // 2. Execute the tRPC Procedure
        let result;
        
        switch (procedure) {
          case 'uploadDocument':
            result = await caller.uploadDocument(input);
            break;
          case 'query':
            result = await caller.query(input);
            break;
          case 'getDocuments':
            result = await caller.getDocuments();
            break;
          case 'deleteDocument':
            result = await caller.deleteDocument(input);
            break;
          case 'getDashboardStats':
            result = await caller.getDashboardStats();
            break;
          case 'health':
            result = await caller.health();
            break;
          default:
            return response.status(404).json({ error: `Procedure '${procedure}' not found` });
        }

        // 3. Successful Response
        return response.json(result);
      }

      // 4. Error Handling (Explicitly catch and respond)
      catch (error: any) {
        logger.error('API Error during execution:', error);
        
        // Handle tRPC errors or internal execution errors
        const statusCode = error.code === 'UNAUTHORIZED' ? 401 : 500;
        return response.status(statusCode).json({ error: error.message || 'Internal API Error' });
      }
    }

    // Handle Method Not Allowed
    return response.status(405).json({ error: 'Method not allowed' });
  }
);

export type AppRouter = typeof appRouter;
