/**
 * Test example with mock data for generateGroundedResponse
 * Useful for testing without actual API calls
 */

import { generateGroundedResponse } from './generation';

async function testWithMockChunks() {
  // Mock retrieved chunks for testing
  const mockChunks = [
    {
      id: 'chunk-1',
      content: 'Mining operations in Zambia must comply with the Environmental Management Act of 2011. All mining companies are required to submit an Environmental Impact Assessment (EIA) before commencing operations.',
      documentId: 'doc-123',
      source: 'zambia-mining-regulations-2024.pdf',
      pageNumber: 15,
      similarity: 0.89,
    },
    {
      id: 'chunk-2',
      content: 'The Environmental Management Agency (EMA) oversees compliance monitoring. Regular environmental audits must be conducted annually, and results submitted to the EMA within 30 days of completion.',
      documentId: 'doc-123',
      source: 'zambia-mining-regulations-2024.pdf',
      pageNumber: 16,
      similarity: 0.85,
    },
    {
      id: 'chunk-3',
      content: 'Water quality monitoring is mandatory for all mining sites. Companies must test surface and groundwater monthly and maintain records of all test results for inspection by regulatory authorities.',
      documentId: 'doc-456',
      source: 'environmental-compliance-guide.pdf',
      pageNumber: 42,
      similarity: 0.82,
    },
  ];

  const query = 'What environmental compliance requirements must mining companies follow?';

  try {
    console.log('Testing generateGroundedResponse with mock chunks...\n');
    const response = await generateGroundedResponse(query, mockChunks);
    
    console.log('=== GENERATED RESPONSE ===\n');
    console.log(response);
    console.log('\n==========================\n');
    
    // Expected: Response should include:
    // - Information from the mock chunks
    // - Citations like [Source: zambia-mining-regulations-2024.pdf]
    // - Proper formatting and disclaimers
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Uncomment to run test:
// testWithMockChunks().catch(console.error);
