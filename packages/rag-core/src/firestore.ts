import { Firestore } from '@google-cloud/firestore';

export interface ChunkData {
  content: string;
  embedding: number[];
  documentId: string;
  source: string;
  pageNumber: number;
}

/**
 * Save vectorized document chunks to Firestore
 * @param chunks Array of chunk objects containing content, embedding, and metadata
 * @returns Promise resolving to success status with count
 */
export async function saveChunksToFirestore(
  chunks: ChunkData[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Initialize Firestore client
    const firestore = new Firestore();

    // Define target collection
    const collectionRef = firestore.collection('vectorChunks');

    // Use batch writes for efficiency (Firestore allows up to 500 operations per batch)
    const batchSize = 500;
    let totalWritten = 0;

    // Process chunks in batches
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = firestore.batch();
      const batchChunks = chunks.slice(i, i + batchSize);

      // Add each chunk to the batch
      batchChunks.forEach((chunk) => {
        const docRef = collectionRef.doc(); // Auto-generate document ID
        
        batch.set(docRef, {
          content: chunk.content,
          embedding: chunk.embedding,
          documentId: chunk.documentId,
          source: chunk.source,
          pageNumber: chunk.pageNumber,
          createdAt: Firestore.FieldValue.serverTimestamp(),
        });
      });

      // Commit the batch
      await batch.commit();
      totalWritten += batchChunks.length;
    }

    // Log success
    console.log(`Successfully wrote ${totalWritten} chunks to Firestore collection 'vectorChunks'`);

    return {
      success: true,
      count: totalWritten,
    };
  } catch (error: any) {
    console.error('Error saving chunks to Firestore:', error);
    return {
      success: false,
      count: 0,
      error: error.message || 'Unknown error occurred',
    };
  }
}
