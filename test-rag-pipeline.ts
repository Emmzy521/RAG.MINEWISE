/**
 * Test Script for RAG Pipeline End-to-End
 * =========================================
 * This script tests the complete RAG pipeline:
 * 1. Query embedding generation using Vertex AI
 * 2. Semantic search in Firestore
 * 3. Response generation using Gemini 2.5 Pro
 * 
 * Usage:
 *   tsx test-rag-pipeline.ts "your question here"
 *   or
 *   tsx test-rag-pipeline.ts
 */

import 'dotenv/config';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { retrieveTopKChunks } from './functions/src/retrieval';
import { generateGroundedResponse } from './functions/src/generation';

// Set Google Cloud Project ID
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT_ID || 'minewise-ai-4a4da';
process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_CLOUD_PROJECT_ID = PROJECT_ID;

// Initialize Firebase Admin
try {
  initializeApp();
  console.log('✅ Firebase Admin initialized');
  console.log(`📋 Using Google Cloud Project: ${PROJECT_ID}\n`);
} catch (error: any) {
  if (error.code === 'app/already-initialized') {
    console.log('ℹ️ Firebase Admin already initialized');
  } else {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

async function testRAGPipeline(query: string) {
  console.log('='.repeat(70));
  console.log('🧪 Testing RAG Pipeline');
  console.log('='.repeat(70));
  console.log(`\n📝 Query: "${query}"\n`);

  try {
    // Step 1: Retrieve relevant chunks
    console.log('Step 1: Retrieving relevant chunks from Firestore...');
    console.log('-'.repeat(70));
    const startRetrieval = Date.now();
    const retrievedChunks = await retrieveTopKChunks(query, 5);
    const retrievalTime = Date.now() - startRetrieval;

    if (retrievedChunks.length === 0) {
      console.log('⚠️  No relevant chunks found for query');
      console.log('\n💡 Suggestions:');
      console.log('   - Try rephrasing your query');
      console.log('   - Ensure documents have been ingested and synced to Firestore');
      console.log('   - Check that vectorChunks collection has data');
      return;
    }

    console.log(`✅ Retrieved ${retrievedChunks.length} chunks (${retrievalTime}ms)`);
    console.log('\n📚 Retrieved Chunks:');
    retrievedChunks.forEach((chunk, index) => {
      console.log(`\n   Chunk ${index + 1}:`);
      console.log(`   - Source: ${chunk.source}`);
      console.log(`   - Similarity: ${chunk.similarity.toFixed(4)}`);
      console.log(`   - Content (first 150 chars): ${chunk.content.substring(0, 150)}...`);
    });

    // Step 2: Generate grounded response
    console.log('\n\nStep 2: Generating grounded response using Gemini 2.5 Pro...');
    console.log('-'.repeat(70));
    const startGeneration = Date.now();
    const answer = await generateGroundedResponse(query, retrievedChunks);
    const generationTime = Date.now() - startGeneration;

    console.log(`✅ Generated response (${generationTime}ms)`);
    console.log('\n💬 Generated Answer:');
    console.log('─'.repeat(70));
    console.log(answer);
    console.log('─'.repeat(70));

    // Step 3: Citations
    const citations = Array.from(new Set(retrievedChunks.map((chunk) => chunk.source))).sort();
    console.log('\n📖 Citations:');
    citations.forEach((source, index) => {
      console.log(`   ${index + 1}. ${source}`);
    });

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ RAG Pipeline Test Completed Successfully!');
    console.log('='.repeat(70));
    console.log(`\n📊 Performance Metrics:`);
    console.log(`   - Retrieval time: ${retrievalTime}ms`);
    console.log(`   - Generation time: ${generationTime}ms`);
    console.log(`   - Total time: ${retrievalTime + generationTime}ms`);
    console.log(`   - Chunks retrieved: ${retrievedChunks.length}`);
    console.log(`   - Citations: ${citations.length}\n`);

  } catch (error: any) {
    console.error('\n❌ Error during RAG pipeline test:');
    console.error('   ', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Main execution
const query = process.argv[2] || 'What are the requirements for obtaining a mineral trading permit in Zambia?';

if (!query || query.trim().length === 0) {
  console.error('❌ Error: Query cannot be empty');
  console.log('\nUsage:');
  console.log('  tsx test-rag-pipeline.ts "your question here"');
  console.log('\nExample:');
  console.log('  tsx test-rag-pipeline.ts "What are the mining regulations in Zambia?"');
  process.exit(1);
}

testRAGPipeline(query)
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

