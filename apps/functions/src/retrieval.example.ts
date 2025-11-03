/**
 * Example usage of retrieveTopKChunks function
 * 
 * This demonstrates how to integrate the retrieval function into your RAG API endpoint.
 * 
 * Note: The function filters chunks with similarity > 0.7 and excludes embeddings from results.
 */

import { retrieveTopKChunks } from './retrieval';

async function exampleUsage() {
  // Example 1: Basic usage with default k=5
  const query1 = 'What are the environmental compliance requirements for mining operations?';
  const topChunks1 = await retrieveTopKChunks(query1);
  
  console.log(`Found ${topChunks1.length} relevant chunks (similarity > 0.7):`);
  topChunks1.forEach((chunk, index) => {
    console.log(`\n${index + 1}. Similarity: ${chunk.similarity.toFixed(4)}`);
    console.log(`   Source: ${chunk.source} (Page ${chunk.pageNumber})`);
    console.log(`   Document ID: ${chunk.documentId}`);
    console.log(`   Content: ${chunk.content.substring(0, 100)}...`);
    // Note: chunk.embedding is NOT included in the result (excluded for efficiency)
  });

  // Example 2: Custom k value
  const query2 = 'How do I apply for a mining license in Zambia?';
  const topChunks2 = await retrieveTopKChunks(query2, 10); // Get top 10 results
  
  // Example 3: Integration with RAG generation
  const query3 = 'What safety regulations must mining companies follow?';
  const topChunks3 = await retrieveTopKChunks(query3, 5);
  
  // Use retrieved chunks for RAG generation
  const context = topChunks3
    .map((chunk, idx) => `[Source ${idx + 1}]\n${chunk.content}`)
    .join('\n\n---\n\n');
  
  console.log('\nContext for LLM:');
  console.log(context);
}

// Uncomment to run:
// exampleUsage().catch(console.error);
