// Local development server wrapper for the tRPC API
// This allows running the API locally without Firebase emulators
import 'dotenv/config'; // Load environment variables from .env.local
import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { appRouter, setFirestore } from './router.js';

// Set Google Cloud Project ID for Vertex AI
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT_ID || 'minewise-ai-4a4da';
process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_CLOUD_PROJECT_ID = PROJECT_ID;
console.log(`📋 Using Google Cloud Project: ${PROJECT_ID}`);

// Initialize Firebase Admin (uses default credentials or environment variables)
try {
  initializeApp();
  console.log('✅ Firebase Admin initialized successfully');
} catch (error: any) {
  if (error.code === 'app/already-initialized') {
    console.log('ℹ️ Firebase Admin already initialized');
  } else {
    console.warn('⚠️ Firebase Admin initialization warning:', error.message);
    // Try to initialize anyway
    try {
      initializeApp();
    } catch (e) {
      console.error('❌ Failed to initialize Firebase Admin:', e);
    }
  }
}

const db = getFirestore();
const auth = getAuth();

// Initialize the router with Firestore instance
setFirestore(db);
console.log('✅ Router initialized with Firestore');

// Verify router structure at startup
console.log('🔍 Router structure check:');
console.log('  - Router type:', typeof appRouter);
console.log('  - Router keys:', Object.keys(appRouter));
console.log('  - Router has query?:', 'query' in appRouter);
const testCaller = appRouter.createCaller({ userId: 'test' });
console.log('  - Test caller keys:', Object.keys(testCaller));
console.log('  - Test caller has query?:', 'query' in testCaller);
console.log('  - Test caller.query type:', typeof testCaller.query);

const PORT = process.env.PORT || 5001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();

// CORS configuration - Allow all origins for local development
app.use(cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

app.use(express.json());

// Handle OPTIONS preflight requests
app.options('/api', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const result = await appRouter.createCaller({}).health();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Health check failed' });
  }
});

// Main API endpoint - handle both POST and proxy requests
app.post('/api', async (req: Request, res: Response) => {
  try {
    console.log('📥 Received API request:', req.method, req.url);
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📥 Headers:', JSON.stringify(req.headers, null, 2));
    const body = req.body;

    if (!body || typeof body !== 'object' || !body.procedure) {
      console.warn('Invalid request body received.');
      return res.status(400).json({ error: 'Invalid request format or missing procedure.' });
    }

    const { procedure } = body;
    let input = body.input;

    // Authentication and Context Setup
    const authHeader = req.headers.authorization;
    let userId: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (error) {
        console.warn('Invalid Auth Token received:', error);
        // Continue without userId for public endpoints
      }
    }
    
    // For local development, allow queries without auth (use a default userId)
    if (!userId && process.env.NODE_ENV !== 'production') {
      userId = 'dev-user-local';
      console.log('⚠️ Using default dev userId for local development');
    }

    const caller = appRouter.createCaller({ userId });
    console.log('🔧 Created tRPC caller for userId:', userId || 'anonymous');
    console.log('🔧 Available procedures:', Object.keys(caller));
    console.log('🔧 caller.query exists?:', 'query' in caller);
    console.log('🔧 typeof caller.query:', typeof caller.query);
    console.log('🔧 caller keys:', JSON.stringify(Object.keys(caller)));
    
    // Verify router structure
    console.log('🔧 Router type:', typeof appRouter);
    console.log('🔧 Router keys:', Object.keys(appRouter));

    // Execute the tRPC Procedure
    let result;
    console.log('🔍 Calling procedure:', procedure, 'with input:', JSON.stringify(input, null, 2));

    // Validate input exists
    if (input === undefined) {
      input = {};
    }

    try {
      switch (procedure) {
        case 'uploadDocument':
          result = await caller.uploadDocument(input);
          break;
        case 'query':
          console.log('📝 Calling query procedure with input:', JSON.stringify(input, null, 2));
          console.log('📝 Input type:', typeof input);
          console.log('📝 Caller object keys:', Object.keys(caller));
          console.log('📝 caller.query type:', typeof caller.query);
          
          if (!input || typeof input !== 'object') {
            throw new Error('Query input must be an object with query and optional topK');
          }
          
          // Ensure input has required fields
          if (!input.query) {
            throw new Error('Query input must include a "query" field');
          }
          
          // Verify caller.query exists before calling
          if (!('query' in caller)) {
            console.error('❌ caller.query does not exist!');
            console.error('Available caller methods:', Object.keys(caller));
            console.error('Caller object:', JSON.stringify(Object.keys(caller), null, 2));
            throw new Error(`Query procedure not available. Available procedures: ${Object.keys(caller).join(', ')}`);
          }
          
          if (typeof caller.query !== 'function') {
            console.error('❌ caller.query is not a function!');
            console.error('caller.query type:', typeof caller.query);
            console.error('caller.query value:', caller.query);
            throw new Error(`Query procedure is not callable. Type: ${typeof caller.query}`);
          }
          
          // Call the procedure
          console.log('📝 About to call caller.query()...');
          try {
            result = await caller.query(input);
            console.log('📝 Query procedure returned successfully');
          } catch (callError: any) {
            console.error('❌ Error calling caller.query():', callError);
            console.error('Call error name:', callError.name);
            console.error('Call error message:', callError.message);
            console.error('Call error code:', callError.code);
            throw callError;
          }
          break;
        case 'getDocuments':
          result = await caller.getDocuments();
          break;
        case 'deleteDocument':
          result = await caller.deleteDocument(input);
          break;
        case 'getDashboardStats':
          result = await caller.getDashboardStats();
          break;
        case 'health':
          result = await caller.health();
          break;
        default:
          console.warn(`⚠️ Unknown procedure: ${procedure}`);
          return res.status(404).json({ error: `Procedure '${procedure}' not found` });
      }

      console.log('✅ Procedure executed successfully');
      res.json(result);
    } catch (procedureError: any) {
      console.error('❌ Procedure execution error:', procedureError);
      throw procedureError; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    console.error('❌ API Error during execution:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    // Ensure we always send valid JSON
    try {
      const statusCode = error.code === 'UNAUTHORIZED' ? 401 : 500;
      const errorResponse = { 
        error: error.message || 'Internal API Error',
        errorName: error.name || 'Error',
        errorCode: error.code || 'INTERNAL_ERROR',
      };
      
      // Only include stack in development
      if (process.env.NODE_ENV === 'development' && error.stack) {
        (errorResponse as any).details = error.stack;
      }
      
      res.status(statusCode).json(errorResponse);
    } catch (jsonError) {
      // If JSON.stringify fails, send plain text
      console.error('Failed to send JSON error response:', jsonError);
      res.status(500).json({ error: 'Internal Server Error', message: String(error.message || error) });
    }
  }
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Minewise AI API Server',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      api: 'POST /api'
    }
  });
});

// Catch-all for undefined routes - log detailed info
app.use((req: Request, res: Response) => {
  console.warn(`⚠️ Route not found: ${req.method} ${req.url}`);
  console.warn(`⚠️ Request headers:`, req.headers);
  console.warn(`⚠️ Request body:`, req.body);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    url: req.url,
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    availableEndpoints: {
      health: 'GET /health',
      api: 'POST /api'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS origin: ${CORS_ORIGIN}`);
});

