/**
 * RAG Logic Wrapper
 * 
 * This module orchestrates the complete RAG pipeline:
 * 1. Retrieval: Find relevant chunks from Firestore using semantic search
 * 2. Generation: Generate grounded response using Gemini 2.5 Pro
 * 
 * This function combines retrieveTopKChunks and generateGroundedResponse
 * into a single, easy-to-use wrapper.
 */

import { retrieveTopKChunks } from './retrieval';
import { generateGroundedResponse } from './generation';

/**
 * Main RAG wrapper function that orchestrates retrieval and generation.
 * 
 * @param query - The user's question/query string
 * @returns Promise resolving to answer and citations array
 */
export async function generateRAGResponse(
  query: string
): Promise<{ answer: string; citations: string[] }> {
  try {
    console.log(`🔄 Starting RAG pipeline for query: "${query}"`);

    // Step 1: Retrieve top K relevant chunks from Firestore
    // Default to 5 chunks, but you can adjust this based on your needs
    console.log('Step 1: Retrieving relevant chunks from Firestore...');
    const retrievedChunks = await retrieveTopKChunks(query, 5);

    if (retrievedChunks.length === 0) {
      // Handle case where no relevant chunks were found
      console.warn('⚠️  No relevant chunks found for query');
      return {
        answer:
          'I apologize, but I could not find any relevant information in the available documents to answer your question. Please try rephrasing your query or ensure that relevant documents have been indexed.',
        citations: [],
      };
    }

    console.log(`✅ Retrieved ${retrievedChunks.length} relevant chunks`);

    // Step 2: Generate grounded response using retrieved chunks
    console.log('Step 2: Generating grounded response using Gemini 2.5 Pro...');
    const answer = await generateGroundedResponse(query, retrievedChunks);

    // Extract unique citations from retrieved chunks
    // Citations are based on the 'source' field from each chunk
    const citations = Array.from(
      new Set(retrievedChunks.map((chunk) => chunk.source))
    ).sort();

    console.log(`✅ RAG pipeline completed successfully`);
    console.log(`📚 Generated answer with ${citations.length} unique citations`);

    return {
      answer,
      citations,
    };
  } catch (error: any) {
    console.error('❌ Error in RAG pipeline:', error);
    throw new Error(`RAG pipeline failed: ${error.message}`);
  }
}
