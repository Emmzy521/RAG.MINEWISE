import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { DocumentChunk } from './types';

/**
 * Cosine similarity function
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Firestore-based vector storage service
 * Stores embeddings in Firestore and performs server-side similarity search
 */
export class FirestoreVectorService {
  private db: ReturnType<typeof getFirestore>;
  private collectionName: string;

  constructor(db: ReturnType<typeof getFirestore>, collectionName: string = 'chunks') {
    this.db = db;
    this.collectionName = collectionName;
  }

  /**
   * Upsert document chunks with embeddings to Firestore
   */
  async upsertChunks(
    chunks: Array<{
      chunk: DocumentChunk;
      embedding: number[];
    }>
  ): Promise<void> {
    const batchLimit = 500; // Firestore batch limit

    for (let i = 0; i < chunks.length; i += batchLimit) {
      const batch = this.db.batch();
      const batchChunks = chunks.slice(i, i + batchLimit);

      for (const { chunk, embedding } of batchChunks) {
        const chunkRef = this.db.collection(this.collectionName).doc(chunk.id);

        const { chunkIndex, ...restMetadata } = chunk.metadata || {};
        batch.set(chunkRef, {
          id: chunk.id,
          documentId: chunk.documentId,
          content: chunk.content,
          embedding: embedding,
          chunkIndex: chunkIndex || 0,
          createdAt: FieldValue.serverTimestamp(),
          ...restMetadata,
        });
      }

      await batch.commit();
    }
  }

  /**
   * Delete all chunks for a document
   */
  async deleteDocumentChunks(documentId: string): Promise<void> {
    const chunksRef = this.db.collection(this.collectionName);
    const snapshot = await chunksRef.where('documentId', '==', documentId).get();

    if (snapshot.empty) {
      return;
    }

    // Delete in batches of 500
    const batchLimit = 500;
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += batchLimit) {
      const batch = this.db.batch();
      const batchDocs = docs.slice(i, i + batchLimit);

      batchDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    }
  }

  /**
   * Query similar chunks using cosine similarity
   * Loads all candidate vectors and computes similarity server-side
   */
  async querySimilar(
    embedding: number[],
    topK: number = 5,
    filter?: Record<string, any>
  ): Promise<Array<{ chunk: DocumentChunk; score: number }>> {
    let query = this.db.collection(this.collectionName) as FirebaseFirestore.Query;

    // Apply filters if provided
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Handle operators like $eq, $gt, etc.
          if (value.$eq !== undefined) {
            query = query.where(key, '==', value.$eq);
          } else if (value.$gt !== undefined) {
            query = query.where(key, '>', value.$gt);
          } else if (value.$lt !== undefined) {
            query = query.where(key, '<', value.$lt);
          }
        } else {
          query = query.where(key, '==', value);
        }
      });
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return [];
    }

    // Compute cosine similarity for all chunks
    const similarities = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const chunkEmbedding = data.embedding as number[];

        if (!chunkEmbedding || !Array.isArray(chunkEmbedding)) {
          return null;
        }

        const score = cosineSimilarity(embedding, chunkEmbedding);

        return {
          chunk: {
            id: data.id || doc.id,
            documentId: data.documentId as string,
            content: data.content as string,
            metadata: {
              chunkIndex: data.chunkIndex as number,
              ...data,
            },
          },
          score,
        };
      })
      .filter((item): item is { chunk: DocumentChunk; score: number } => item !== null)
      .sort((a, b) => b.score - a.score) // Sort by similarity (descending)
      .slice(0, topK); // Take top K results

    return similarities;
  }
}

