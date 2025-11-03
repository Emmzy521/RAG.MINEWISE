/**
 * Example usage of saveChunksToFirestore function
 */

import { saveChunksToFirestore } from './firestore';

async function example() {
  // Example chunk data
  const chunks = [
    {
      content: 'This is the first chunk of text from the document.',
      embedding: [0.1, 0.2, 0.3, /* ... vector of 768 or 3072 dimensions */],
      documentId: 'doc-123',
      source: 'mining-regulation-2024.pdf',
      pageNumber: 1,
    },
    {
      content: 'This is the second chunk of text.',
      embedding: [0.4, 0.5, 0.6, /* ... vector */],
      documentId: 'doc-123',
      source: 'mining-regulation-2024.pdf',
      pageNumber: 1,
    },
    // ... more chunks
  ];

  // Save chunks to Firestore
  const result = await saveChunksToFirestore(chunks);

  if (result.success) {
    console.log(`✅ Successfully saved ${result.count} chunks to Firestore`);
  } else {
    console.error(`❌ Failed to save chunks: ${result.error}`);
  }
}

// Uncomment to run example:
// example().catch(console.error);
