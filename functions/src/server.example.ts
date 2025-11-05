/**
 * Example usage of the RAG API server
 *  * This demonstrates how to make requests to the API endpoints.
 */

// Example 1: Health check
// GET http://localhost:8080/health
// Response: { status: 'ok', timestamp: '...', service: 'Minewise AI RAG API' }

// Example 2: Query endpoint
// POST http://localhost:8080/api/query
// Headers: { 'Content-Type': 'application/json' }
// Body:
// {
//   "query": "What are the environmental compliance requirements for mining operations in Zambia?"
// }
//
// Response (200):
// {
//   "answer": "Based on the provided documents, mining operations in Zambia must comply with... [Source: zambia-mining-regulations-2024.pdf]",
//   "citations": ["zambia-mining-regulations-2024.pdf", "environmental-compliance-guide.pdf"]
// }

// Example using fetch (JavaScript/TypeScript):
async function exampleQuery() {
    const response = await fetch('http://localhost:8080/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'What are the environmental compliance requirements for mining operations?',
      }),
    });
  
    if (response.ok) {
      const data: unknown = await response.json(); 
      
      // --- FIX for TS18046: Add runtime check before accessing properties ---
      // Check if data is an object, not null, and has the required properties
      if (
        typeof data === 'object' && 
        data !== null && 
        'answer' in data && 
        'citations' in data
      ) {
        // Type assertion is now safe after the runtime check
        const typedData = data as { answer: string; citations: string[] };
  
        console.log('Answer:', typedData.answer); // Line 39 (Now safe)
        console.log('Citations:', typedData.citations); // Line 40 (Now safe)
      } else {
        console.error('Error: Received unexpected data structure:', data);
      }
    } else {
      const error: unknown = await response.json();
      console.error('Error:', error);
    }
  }
  
  // Example using curl:
  // curl -X POST http://localhost:8080/api/query \
  //   -H "Content-Type: application/json" \
  //   -d '{"query": "What are the mining regulations?"}'
  