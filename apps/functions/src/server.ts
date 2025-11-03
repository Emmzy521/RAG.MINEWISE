// Import Express and CORS middleware
import express, { Request, Response } from 'express';
import cors from 'cors';

// NOTE: Assuming the RAG logic is compiled and available here. 
// We should directly implement the function imports once available.
// For now, we stub the dependency on a combined RAG wrapper function:
/**
 * Placeholder for the final RAG pipeline function.
 * Must be implemented in a separate file (e.g., rag-logic.ts) 
 * to combine retrieval and generation.
 */
async function generateRAGResponse(query: string): Promise<any> {
    // This function must be defined elsewhere and implemented 
    // to call retrieveTopKChunks and generateGroundedResponse.
    // If running this file directly without the other files, 
    // this will throw an error when called.
    throw new Error("RAG logic function generateRAGResponse is not implemented.");
}


// --- Configuration using Environment Variables ---
const PORT = process.env.PORT || 8080;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'; // Default to '*' for development/testing
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'minewise-ai-4a4da';

// Critical: Set the project ID as an environment variable for the Google Cloud SDKs to use
process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;

// --- Express App Setup ---
const app = express();

// Configure CORS
const corsOptions = {
  origin: CORS_ORIGIN, // Allows requests from your Firebase Hosting URL
  methods: 'POST, GET', // Allow both GET (health check) and POST (query)
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.use(express.json()); // Middleware to parse incoming JSON bodies

// --- Health Check Endpoint (Cloud Run Requirement) ---
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('RAG API Service is operational.');
});

// --- RAG Query Endpoint ---
app.post('/api/query', async (req: Request, res: Response) => {
  const query: string = req.body.query;

  if (!query) {
    // Log the error before responding
    console.warn('Received query request with missing "query" field.');
    return res.status(400).json({ error: 'Missing "query" field in request body.' });
  }

  console.log(`Received query: "${query}"`);

  try {
    // Call the main RAG function that orchestrates Retrieval and Generation
    const result = await generateRAGResponse(query);

    // Respond with the grounded answer and citation data
    return res.status(200).json(result);
  } catch (error: unknown) { // Using 'unknown' is the modern, safe practice in TypeScript
    // Handle RAG pipeline failures (e.g., embedding error, Gemini failure)
    
    // Use type guards to safely extract the error message
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred in the RAG pipeline.';
    
    console.error('API Error during RAG process:', errorMessage);
    return res.status(500).json({
      error: 'Failed to generate a grounded response.',
      details: errorMessage,
    });
  }
});

// --- Server Startup ---
app.listen(Number(PORT), () => {
  console.log(`RAG API listening on port ${PORT}. Allowed CORS Origin: ${CORS_ORIGIN}`);
});
