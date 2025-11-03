import { retrieveTopKChunks } from './retrieval';
import { generateGroundedResponse } from './generation';

/**
 * Wrapper function that orchestrates the complete RAG pipeline:
 * 1. Retrieval: Find relevant chunks from Firestore
 * 2. Generation: Generate grounded response using Gemini
 * 
 * @param query - The user's question/query string
 * @returns Promise resolving to answer and citations array
 */
export async function generateRAGResponse(
  query: string
): Promise<{ answer: string; citations: string[] }> {
  try {
    console.log(`🔄 Starting RAG pipeline for query: "${query}"`);

    // Step 1: Retrieve top K relevant chunks (default k=5)
    console.log('Step 1: Retrieving relevant chunks...');
    const retrievedChunks = await retrieveTopKChunks(query, 5);

    if (retrievedChunks.length === 0) {
      return {
        answer: 'I apologize, but I could not find any relevant information in the available documents to answer your question. Please try rephrasing your query or ensure that relevant documents have been indexed.',
        citations: [],
      };
    }

    console.log(`✅ Retrieved ${retrievedChunks.length} relevant chunks`);

    // Step 2: Generate grounded response using retrieved chunks
    console.log('Step 2: Generating response...');
    const answer = await generateGroundedResponse(query, retrievedChunks);

    // Extract unique citations from retrieved chunks
    const citations = Array.from(
      new Set(retrievedChunks.map((chunk) => chunk.source))
    ).sort();

    console.log(`✅ RAG pipeline completed successfully`);

    return {
      answer,
      citations,
    };
  } catch (error: any) {
    console.error('❌ Error in RAG pipeline:', error);
    throw new Error(`RAG pipeline failed: ${error.message}`);
  }
}
