import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import {
  DocumentChunker,
  EmbeddingService,
  FirestoreVectorService,
  RAGService,
  DocumentParser,
} from '@minewise-ai/rag-core';
import { getFirestore } from 'firebase-admin/firestore';
import { retrieveTopKChunks } from './retrieval.js';
import { generateGroundedResponse } from './generation.js';

// Logger - use console in dev, firebase-functions/logger in production
const logger = {
  error: (...args: any[]) => console.error(...args),
  warn: (...args: any[]) => console.warn(...args),
  info: (...args: any[]) => console.info(...args),
};

// This will be initialized by the caller
let db: ReturnType<typeof getFirestore>;

export function setFirestore(instance: ReturnType<typeof getFirestore>) {
  db = instance;
}

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
export const appRouter = t.router({
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

        if (content.match(/^[A-Za-z0-9+/=]+$/)) {
          const buffer = Buffer.from(content, 'base64');
          textContent = await parser.parseDocument(buffer, mimeType);
        } else {
          textContent = content;
        }

        const docRef = db.collection('documents').doc();
        const documentId = docRef.id;

        const chunker = new DocumentChunker(1000, 200);
        const chunks = await chunker.chunkText(textContent, documentId);

        // Generate embeddings and store in Firestore
        if (process.env.OPENAI_API_KEY) {
          const embeddingService = new EmbeddingService(process.env.OPENAI_API_KEY);
          const chunksWithEmbeddings = await embeddingService.embedChunks(chunks);

          const vectorService = new FirestoreVectorService(db);
          await vectorService.upsertChunks(chunksWithEmbeddings);
        }

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
        // Retrieve top K chunks using Firestore semantic search
        // This internally uses Vertex AI getQuestionVector() for embeddings
        const retrievedChunks = await retrieveTopKChunks(query, topK);

        if (retrievedChunks.length === 0) {
          return {
            answer: 'I apologize, but I could not find any relevant information in the available documents to answer your question. Please try rephrasing your query or ensure that relevant documents have been indexed.',
            citations: [],
          };
        }

        // Generate grounded response using Gemini 2.5 Pro
        const answer = await generateGroundedResponse(query, retrievedChunks);

        // Extract unique citations and prepare sources array
        const citations = Array.from(
          new Set(retrievedChunks.map((chunk) => chunk.source))
        ).sort();

        // Prepare sources array with detailed information for frontend display
        const sources = retrievedChunks.map((chunk) => ({
          documentId: chunk.documentId,
          chunkId: chunk.id,
          content: chunk.content,
          score: chunk.similarity,
          source: chunk.source,
          pageNumber: chunk.pageNumber,
        }));

        // Log the query
        await db.collection('queryLogs').add({
          userId,
          query,
          timestamp: new Date(),
          resultCount: retrievedChunks.length,
        });

        return {
          answer,
          citations,
          sources,
        };
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

      // Use Firestore Vector Service instead of Pinecone
      const vectorService = new FirestoreVectorService(db);
      await vectorService.deleteDocumentChunks(documentId);

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

export type AppRouter = typeof appRouter;

