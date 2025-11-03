/**
 * Helper functions for vector operations in the RAG system
 */

/**
 * Calculates the cosine similarity between two vectors.
 * Cosine similarity measures the cosine of the angle between two vectors,
 * ranging from -1 (completely opposite) to 1 (identical direction).
 * 
 * Formula: cos(θ) = (A · B) / (||A|| * ||B||)
 * 
 * @param vecA - First vector (number array)
 * @param vecB - Second vector (number array)
 * @returns Cosine similarity score between -1 and 1
 * @throws Error if vectors have different dimensions or are empty
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  // Validate input vectors
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    throw new Error('Vectors must be non-empty arrays');
  }

  if (vecA.length !== vecB.length) {
    throw new Error(
      `Vector dimension mismatch: vecA has ${vecA.length} dimensions, vecB has ${vecB.length} dimensions`
    );
  }

  // Calculate dot product (A · B)
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }

  // Calculate magnitude of vecA (||A||)
  let magnitudeA = 0;
  for (let i = 0; i < vecA.length; i++) {
    magnitudeA += vecA[i] * vecA[i];
  }
  magnitudeA = Math.sqrt(magnitudeA);

  // Calculate magnitude of vecB (||B||)
  let magnitudeB = 0;
  for (let i = 0; i < vecB.length; i++) {
    magnitudeB += vecB[i] * vecB[i];
  }
  magnitudeB = Math.sqrt(magnitudeB);

  // Handle edge case: if either magnitude is zero, return 0
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  // Return cosine similarity: (A · B) / (||A|| * ||B||)
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Generates a vector embedding for a query/question using Vertex AI.
 * This is a placeholder that should be implemented with your actual embedding service.
 * 
 * @param query - The user's question/query string
 * @returns Promise resolving to a vector array (number[])
 * @throws Error if vector generation fails
 */
export async function getQuestionVector(query: string): Promise<number[]> {
  // TODO: Replace with actual Vertex AI embedding implementation
  // Example implementation structure:
  
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }

  // Placeholder: This should call Vertex AI's text-embedding API
  // For now, throwing an error to indicate it needs implementation
  throw new Error(
    'getQuestionVector() not implemented. Please integrate with Vertex AI embedding service.\n' +
    `Query received: "${query}"`
  );

  // Example Vertex AI implementation (commented out for reference):
  /*
  import { VertexAI } from '@google-cloud/vertexai';
  
  const vertexAI = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT_ID,
    location: 'us-central1',
  });

  const model = vertexAI.preview.getGenerativeModel({
    model: 'text-embedding-004', // or your preferred model
  });

  const result = await model.embedContent(query);
  return result.embeddings[0].values; // Assuming this returns number[]
  */
}
