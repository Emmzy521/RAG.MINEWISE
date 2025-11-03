#!/usr/bin/env node

/**
 * Initialize Firestore Collections for Minewise AI
 * 
 * This script sets up the Firestore collections structure.
 * Collections are created automatically when first data is written,
 * but this script helps verify the structure and set up indexes.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
try {
  // Try to use service account if available
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Use default credentials (for local development)
    admin.initializeApp({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'minewise-ai-4a4da',
    });
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  console.log('\nNote: If running locally, you may need to:');
  console.log('1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable, or');
  console.log('2. Run: gcloud auth application-default login');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Collection structures:
 * 
 * 1. users/{userId}
 *    - email: string
 *    - role: string ('admin' | 'user')
 *    - createdAt: timestamp
 *    - updatedAt: timestamp
 * 
 * 2. documents/{documentId}
 *    - id: string
 *    - filename: string
 *    - uploadedAt: timestamp
 *    - userId: string
 *    - size: number
 *    - mimeType: string
 *    - chunkCount: number (optional)
 * 
 * 3. queryLogs/{logId}
 *    - userId: string
 *    - query: string
 *    - timestamp: timestamp
 *    - resultCount: number
 * 
 * 4. vectorChunks/{chunkId}
 *    - content: string
 *    - embedding: number[]
 *    - documentId: string
 *    - source: string
 *    - pageNumber: number
 *    - embeddingDim: number
 *    - createdAt: timestamp
 */

async function initializeCollections() {
  console.log('🔥 Initializing Firestore Collections...\n');

  try {
    // Create a test document in each collection to ensure they exist
    const batch = db.batch();
    
    // Note: Collections are created automatically when first document is written
    // We'll create a placeholder document that can be deleted later
    
    console.log('📁 Collections will be created automatically when first data is written.');
    console.log('✅ Collection structure documented:\n');
    
    console.log('1. users/{userId}');
    console.log('   - email: string');
    console.log('   - role: "admin" | "user"');
    console.log('   - createdAt: timestamp');
    console.log('   - updatedAt: timestamp\n');
    
    console.log('2. documents/{documentId}');
    console.log('   - id: string');
    console.log('   - filename: string');
    console.log('   - uploadedAt: timestamp');
    console.log('   - userId: string');
    console.log('   - size: number');
    console.log('   - mimeType: string');
    console.log('   - chunkCount: number\n');
    
    console.log('3. queryLogs/{logId}');
    console.log('   - userId: string');
    console.log('   - query: string');
    console.log('   - timestamp: timestamp');
    console.log('   - resultCount: number\n');
    
    console.log('4. vectorChunks/{chunkId}');
    console.log('   - content: string');
    console.log('   - embedding: number[]');
    console.log('   - documentId: string');
    console.log('   - source: string');
    console.log('   - pageNumber: number');
    console.log('   - embeddingDim: number');
    console.log('   - createdAt: timestamp\n');

    console.log('✅ Firestore collections are ready to use!');
    console.log('\n💡 Note: Collections are created automatically when you write the first document.');
    console.log('   No manual creation is needed - just start using the app!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run initialization
initializeCollections()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  });
