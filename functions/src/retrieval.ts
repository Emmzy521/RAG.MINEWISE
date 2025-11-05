import { getFirestore } from 'firebase-admin/firestore';
import { getQuestionVector } from './helpers/vector-helpers.js';
import { cosineSimilarity } from './helpers/vector-helpers.js';
import * as logger from 'firebase-functions/logger'; // <--- FIX: Added necessary import

// Type definitions
interface ChunkDocument {
  id: string;
  content: string;
  embedding: number[];
  documentId: string;
  source: string;
  pageNumber: number;
  embeddingDim?: number;
  createdAt?: any;
}

interface RetrievedChunk {
  id: string;
  content: string;
  documentId: string;
  source: string;
  pageNumber: number;
  similarity: number;
}

/**
 * Retrieves the top K most semantically similar chunks from Firestore based on a query.
 * Performs cosine similarity search across all documents in the 'vectorChunks' collection.
 * @param query - The user's question/query string
 * @param k - Number of top results to return (default: 5)
 * @returns Promise resolving to an array of the top K most similar chunks with similarity scores
 */
export async function retrieveTopKChunks(
  query: string,
  k: number = 5
): Promise<RetrievedChunk[]> {
  try {
    // 1. Get Firestore database client (use Firebase Admin instance)
    const db = getFirestore();
    const collectionRef = db.collection('vectorChunks');

    logger.log(`🔍 Starting semantic search for query: "${query}" (k=${k}, min_similarity=0.7)`); // Uses logger

    // 2. Get the query vector
    const queryVector = await getQuestionVector(query);
    
    if (!queryVector || queryVector.length === 0) {
      throw new Error('Failed to generate query vector');
    }

    logger.log(`✅ Query vector generated (dimension: ${queryVector.length})`); // Uses logger

    // 3. Fetch ALL documents (chunks) from the 'vectorChunks' collection
    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) {
      logger.warn('⚠️  No documents found in vectorChunks collection'); // Uses logger
      return [];
    }

    logger.log(`📚 Retrieved ${snapshot.size} chunks from Firestore`); // Uses logger

    // 4. Filter and map the retrieved chunks
    const chunksWithScores: RetrievedChunk[] = [];

    snapshot.forEach((doc) => {
      // Ensure document data exists before proceeding
      const chunkData = doc.data() as ChunkDocument;

      if (!chunkData || !chunkData.embedding || !Array.isArray(chunkData.embedding) || !chunkData.content || !chunkData.source) {
        logger.warn(`⚠️  Chunk ${doc.id} missing required fields or invalid embedding, skipping.`); // Uses logger
        return;
      }

      // Calculate the similarity score
      const similarity = cosineSimilarity(queryVector, chunkData.embedding);

      // Keep only chunks where similarity score is greater than 0.7
      if (similarity > 0.7) {
        chunksWithScores.push({
          id: doc.id,
          content: chunkData.content,
          documentId: chunkData.documentId,
          source: chunkData.source,
          pageNumber: chunkData.pageNumber || 0, // Default to 0 if page number is missing
          similarity,
        });
      }
    });

    logger.log(`🔍 Filtered to ${chunksWithScores.length} chunks with similarity > 0.7`); // Uses logger

    // 5. Sort the filtered chunks by their similarity score in DESCENDING order
    chunksWithScores.sort((a, b) => b.similarity - a.similarity);

    // 6. Return an array containing only the top 'k' chunks
    const topKChunks: RetrievedChunk[] = chunksWithScores.slice(0, k);

    if (topKChunks.length > 0) {
      logger.log(
        `✅ Retrieved top ${topKChunks.length} chunks ` +
        `(similarity range: ${topKChunks[topKChunks.length - 1]?.similarity.toFixed(4)} - ${topKChunks[0]?.similarity.toFixed(4)})`
      );
    } else {
      logger.warn(`⚠️  No chunks found with similarity > 0.7 for query: "${query}"`); // Uses logger
    }

    return topKChunks;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during retrieval.';
    logger.error('❌ Error retrieving chunks:', errorMessage); // Uses logger
    throw new Error(`Failed to retrieve chunks: ${errorMessage}`);
  }
}
