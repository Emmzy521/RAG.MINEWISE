# Vector Helpers

This directory contains helper functions for vector operations in the RAG system.

## Functions

### `cosineSimilarity(vecA: number[], vecB: number[]): number`

Calculates the cosine similarity between two vectors. Returns a value between -1 and 1, where:
- `1` = vectors point in the same direction (identical)
- `0` = vectors are orthogonal (unrelated)
- `-1` = vectors point in opposite directions (opposite)

### `getQuestionVector(query: string): Promise<number[]>`

**⚠️ IMPLEMENTATION REQUIRED**

Generates a vector embedding for a query string. This function currently throws an error and needs to be implemented with your Vertex AI embedding service.

**To implement:**
1. Import Vertex AI SDK
2. Configure your Vertex AI project and location
3. Call the embedding model (e.g., `text-embedding-004`)
4. Return the embedding vector as `number[]`

See the commented example in `vector-helpers.ts` for reference.
