/**
 * Example usage of generateGroundedResponse function
 * 
 * This demonstrates how to integrate the generation function into your RAG pipeline.
 */

import { generateGroundedResponse } from './generation';
import { retrieveTopKChunks } from './retrieval';

async function exampleUsage() {
  // Example: Complete RAG pipeline
  const query = 'What are the environmental compliance requirements for mining operations in Zambia?';

  try {
    // Step 1: Retrieve relevant chunks
    console.log('Step 1: Retrieving relevant chunks...');
    const chunks = await retrieveTopKChunks(query, 5);
    
    if (chunks.length === 0) {
      console.log('No relevant chunks found. Cannot generate response.');
      return;
    }

    console.log(`Retrieved ${chunks.length} relevant chunks\n`);

    // Step 2: Generate grounded response
    console.log('Step 2: Generating response...');
    const response = await generateGroundedResponse(query, chunks);

    console.log('\n=== GENERATED RESPONSE ===\n');
    console.log(response);
    console.log('\n==========================\n');

    // Example output structure:
    // The response will include:
    // - Answer based on the retrieved chunks
    // - Source citations in [Source: filename.pdf] format
    // - Professional formatting suitable for legal context
    // - Disclaimer about consulting legal professionals

  } catch (error) {
    console.error('Error in RAG pipeline:', error);
  }
}

// Uncomment to run:
// exampleUsage().catch(console.error);
