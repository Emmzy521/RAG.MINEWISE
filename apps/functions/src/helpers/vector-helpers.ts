/**
 * Helper functions for vector operations in the RAG system
 */

import * as logger from 'firebase-functions/logger';

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
 * Generates a vector embedding for a query/question using Vertex AI text-embedding-004.
 * Uses the same embedding model as the ingestion pipeline for consistency.
 * 
 * @param query - The user's question/query string
 * @returns Promise resolving to a vector array (number[])
 * @throws Error if vector generation fails
 */
export async function getQuestionVector(query: string): Promise<number[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }

  try {
    const project = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT_ID;
    const location = 'us-central1';
    const model = 'text-embedding-004';
    
    if (!project) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID or GCP_PROJECT_ID environment variable must be set');
    }

    // Use Vertex AI REST API for embeddings
    // The endpoint format: https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/{model}:predict
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predict`;
    
    // Get access token for authentication using firebase-admin
    const admin = await import('firebase-admin/app');
    let app;
    try {
      app = admin.getApp();
    } catch {
      // If app not initialized, initialize it
      app = admin.initializeApp();
    }
    
    // Get credential and access token
    const credential = app.options.credential;
    if (!credential) {
      throw new Error('No credential available in Firebase Admin. Ensure Firebase Admin is properly initialized.');
    }
    
    // Get access token from credential
    const accessTokenResult = await credential.getAccessToken();
    if (!accessTokenResult || !accessTokenResult.access_token) {
      throw new Error('Failed to obtain access token for Vertex AI');
    }
    
    const accessToken = accessTokenResult.access_token;

    // Prepare the request payload for text-embedding-004
    const requestBody = {
      instances: [
        {
          content: query,
        },
      ],
    };

    logger.log(`🔍 Generating embedding for query: "${query.substring(0, 50)}..."`);

    // Make the API request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex AI API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json() as any;
    
    // Extract the embedding from the response
    // Response structure: { predictions: [{ embeddings: { values: number[] } }] }
    if (!result.predictions || !result.predictions[0] || !result.predictions[0].embeddings) {
      throw new Error('Invalid response format from Vertex AI embeddings API');
    }

    const embedding = result.predictions[0].embeddings.values || result.predictions[0].embeddings;
    
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Embedding vector is empty or invalid');
    }

    logger.log(`✅ Generated embedding vector (dimension: ${embedding.length})`);
    
    return embedding as number[];
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('❌ Error generating query embedding:', errorMessage);
    throw new Error(`Failed to generate query embedding: ${errorMessage}`);
  }
}
