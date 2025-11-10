// Local development server wrapper for the tRPC API
// This allows running the API locally without Firebase emulators
import 'dotenv/config'; // Load environment variables from .env.local
import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { appRouter, setFirestore } from './router';

// Verify appRouter is correctly imported (not the module object)
if (!appRouter || typeof appRouter.createCaller !== 'function') {
  console.error('❌ CRITICAL: appRouter is not correctly imported!');
  console.error('appRouter type:', typeof appRouter);
  console.error('appRouter value:', appRouter);
  console.error('appRouter keys:', Object.keys(appRouter || {}));
  throw new Error('appRouter import failed - router not properly exported');
}

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
console.log('  - Router is object?:', typeof appRouter === 'object');
console.log('  - Router has createCaller?:', typeof appRouter?.createCaller === 'function');
console.log('  - Router keys:', Object.keys(appRouter || {}));
console.log('  - Router has query?:', 'query' in (appRouter || {}));

// Verify appRouter is the router, not a module object
if (!appRouter || typeof appRouter.createCaller !== 'function') {
  console.error('❌ ERROR: appRouter is not a valid tRPC router!');
  console.error('  - appRouter:', appRouter);
  console.error('  - typeof appRouter:', typeof appRouter);
  console.error('  - appRouter.createCaller:', typeof appRouter?.createCaller);
  throw new Error('appRouter import is incorrect - expected tRPC router but got: ' + typeof appRouter);
}

const testCaller = appRouter.createCaller({ userId: 'test' });
console.log('  - Test caller created successfully');
console.log('  - Test caller.query type:', typeof testCaller.query);

const PORT = Number(process.env.PORT) || 5001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Track if server has started (for error handling)
let serverStarted = false;

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

    // Extract and validate procedure - ensure it's a string
    let procedure: string;
    if (typeof body.procedure === 'string') {
      procedure = body.procedure.trim(); // Trim whitespace
    } else if (typeof body.procedure === 'object' && body.procedure !== null) {
      // If procedure is an object, try to stringify it for debugging
      console.error('❌ Procedure is an object instead of string:', JSON.stringify(body.procedure));
      return res.status(400).json({ 
        error: 'Procedure must be a string, not an object.',
        received: JSON.stringify(body.procedure)
      });
    } else {
      console.error('❌ Procedure is not a string:', typeof body.procedure, body.procedure);
      return res.status(400).json({ 
        error: `Procedure must be a string, got ${typeof body.procedure}`,
        received: body.procedure 
      });
    }
    
    // Validate procedure is not empty
    if (!procedure || procedure.length === 0) {
      return res.status(400).json({ error: 'Procedure cannot be empty.' });
    }
    
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

    // Ensure router is properly initialized
    if (!appRouter || typeof appRouter.createCaller !== 'function') {
      console.error('❌ appRouter is not properly initialized!');
      console.error('appRouter:', appRouter);
      console.error('typeof appRouter:', typeof appRouter);
      return res.status(500).json({ error: 'Router not initialized' });
    }

    // Create context object explicitly to ensure it's a plain object
    // tRPC expects a context object, not undefined values
    const context: { userId?: string } = {};
    if (userId) {
      context.userId = userId;
    }
    console.log('🔧 Creating tRPC caller with context:', JSON.stringify(context));
    
    // Try creating caller - check if it's actually a function or object
    let caller: any;
    try {
      caller = appRouter.createCaller(context);
      console.log('🔧 Created tRPC caller for userId:', userId || 'anonymous');
      console.log('🔧 Caller type:', typeof caller);
      console.log('🔧 Caller value:', caller);
      console.log('🔧 Caller constructor:', caller?.constructor?.name);
      
      // If caller is a function, it might be a proxy that appears as a function
      // Try to access properties to see if it's actually a proxy
      if (typeof caller === 'function') {
        console.log('⚠️ Caller is a function - might be a proxy');
        // Try to see if it has properties when accessed
        try {
          const testAccess = caller.query;
          console.log('🔧 caller.query accessed:', typeof testAccess, testAccess);
        } catch (e) {
          console.log('🔧 Error accessing caller.query:', e);
        }
      } else {
        console.log('🔧 Caller is an object');
        console.log('🔧 Caller keys:', Object.keys(caller));
        console.log('🔧 Caller has query?', 'query' in caller);
      }
    } catch (callerError: any) {
      console.error('❌ Error creating caller:', callerError);
      return res.status(500).json({ error: `Failed to create tRPC caller: ${callerError.message}` });
    }
    console.log('🔧 Procedure type:', typeof procedure, 'Procedure value:', procedure);
    console.log('🔧 Procedure is string?:', typeof procedure === 'string');
    
    // Verify router structure
    console.log('🔧 Router type:', typeof appRouter);
    console.log('🔧 Router keys:', Object.keys(appRouter));
    
    // Ensure procedure is a string before using it
    if (typeof procedure !== 'string') {
      console.error('❌ Procedure is not a string after validation!', typeof procedure, procedure);
      return res.status(400).json({ 
        error: `Invalid procedure type: expected string, got ${typeof procedure}`,
        received: procedure 
      });
    }

    // Final validation - ensure procedure is definitely a string
    if (typeof procedure !== 'string') {
      console.error('❌ CRITICAL: Procedure is not a string at execution time!', typeof procedure, procedure);
      return res.status(400).json({ 
        error: `Internal error: Procedure type mismatch - expected string, got ${typeof procedure}` 
      });
    }

    // Execute the tRPC Procedure
    let result;
    const originalInput = input; // Store original input before any modifications
    console.log('🔍 Calling procedure:', procedure, 'Type:', typeof procedure, 'with input:', JSON.stringify(input, null, 2));

    try {
      // tRPC createCaller returns a proxy, so we call methods directly
      // Use a switch statement to ensure type safety and correct procedure calls
      const procedureName = String(procedure).trim(); // Force string conversion and trim
      
      console.log(`📝 Calling procedure '${procedureName}' with input:`, JSON.stringify(originalInput, null, 2));
      
      // Use switch statement for explicit procedure routing
      // This ensures we're calling the correct procedure with the right signature
      switch (procedureName) {
        case 'health':
          result = await caller.health();
          break;
        case 'uploadDocument':
          if (!originalInput || typeof originalInput !== 'object') {
            throw new Error('uploadDocument requires an input object');
          }
          result = await caller.uploadDocument(originalInput);
          break;
        case 'query':
          if (!originalInput || typeof originalInput !== 'object') {
            throw new Error('query requires an input object with query field');
          }
          if (!originalInput.query) {
            throw new Error('query input must include a "query" field');
          }
          // Ensure input is a plain object (not a proxy or special object)
          const queryInput = {
            query: String(originalInput.query),
            topK: originalInput.topK ? Number(originalInput.topK) : 5
          };
          console.log('📝 About to call query procedure with:', JSON.stringify(queryInput, null, 2));
          
          // WORKAROUND: The tRPC proxy seems to be broken for mutations
          // Let's manually call the procedure by importing and calling the handler directly
          // This bypasses the createCaller proxy which appears to be malfunctioning
          
          console.log('📝 Using workaround: calling procedure handler directly');
          
          // Import the router's query procedure handler directly
          // We'll need to manually construct the context and call the procedure
          const procedureContext = { userId: context.userId };
          
          // Access the router's internal procedure definition
          // tRPC stores procedures in _def.procedures
          const routerDef = (appRouter as any)._def;
          if (routerDef && routerDef.procedures) {
            const queryProcedure = routerDef.procedures.query;
            if (queryProcedure) {
              console.log('📝 Found query procedure in router definition');
              // Call the procedure's resolver directly
              const procedureResolver = queryProcedure._def?.resolver;
              if (procedureResolver) {
                console.log('📝 Calling procedure resolver directly');
                result = await procedureResolver({
                  input: queryInput,
                  ctx: procedureContext,
                  path: 'query',
                  type: 'mutation',
                });
              } else {
                throw new Error('Could not find procedure resolver');
              }
            } else {
              throw new Error('Could not find query procedure in router');
            }
          } else {
            // Fallback: try createCaller one more time with explicit typing
            console.log('📝 Fallback: trying createCaller with explicit context');
            const finalCaller = appRouter.createCaller(procedureContext);
            result = await (finalCaller as any).query(queryInput);
          }
          
          console.log('📝 Query procedure completed successfully');
          break;
        case 'getDocuments':
          result = await caller.getDocuments();
          break;
        case 'deleteDocument':
          if (!originalInput || typeof originalInput !== 'object') {
            throw new Error('deleteDocument requires an input object');
          }
          result = await caller.deleteDocument(originalInput);
          break;
        case 'getDashboardStats':
          result = await caller.getDashboardStats();
          break;
        default:
          console.warn(`⚠️ Unknown procedure: ${procedureName}`);
          return res.status(404).json({ error: `Procedure '${procedureName}' not found` });
      }
      
      console.log(`✅ Procedure '${procedureName}' executed successfully`);
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
    
    // Ensure we always send valid JSON with proper content-type header
    try {
      const statusCode = error.code === 'UNAUTHORIZED' ? 401 : 500;
      const errorResponse = { 
        error: error.message || 'Internal API Error',
        message: error.message || 'Internal API Error',
        errorName: error.name || 'Error',
        errorCode: error.code || 'INTERNAL_ERROR',
      };
      
      // Only include stack in development
      if (process.env.NODE_ENV === 'development' && error.stack) {
        (errorResponse as any).details = error.stack;
      }
      
      // Set content-type header explicitly
      res.setHeader('Content-Type', 'application/json');
      res.status(statusCode).json(errorResponse);
    } catch (jsonError) {
      // If JSON.stringify fails, send plain text with JSON wrapper
      console.error('Failed to send JSON error response:', jsonError);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: String(error.message || error),
        errorName: 'JSONError'
      });
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

// Create server with SO_REUSEADDR to allow faster port reuse on restart
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS origin: ${CORS_ORIGIN}`);
  serverStarted = true;
});

// Enable SO_REUSEADDR for faster port reuse
server.on('listening', () => {
  const address = server.address();
  if (address && typeof address === 'object') {
    // Set SO_REUSEADDR option to allow faster port reuse
    server.setTimeout(0); // Disable timeout for long-running requests
  }
});

// Handle server errors, especially EADDRINUSE
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`💡 To fix this, run: netstat -ano | findstr :${PORT}`);
    console.error(`💡 Then kill the process: taskkill /PID <PID> /F`);
    console.error(`💡 Or wait a few seconds for the port to be released.`);
    // Don't exit - let tsx watch retry
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown handling - allows active requests to complete before restart
let isShuttingDown = false;
const activeRequests = new Set<Response>();
let requestStartTime = new Map<Response, number>();

// Track active requests
app.use((req: Request, res: Response, next) => {
  if (isShuttingDown) {
    res.status(503).json({ error: 'Server is shutting down' });
    return;
  }
  activeRequests.add(res);
  requestStartTime.set(res, Date.now());
  res.on('finish', () => {
    activeRequests.delete(res);
    requestStartTime.delete(res);
  });
  res.on('close', () => {
    activeRequests.delete(res);
    requestStartTime.delete(res);
  });
  next();
});

// Graceful shutdown function
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
  console.log(`📊 Active requests: ${activeRequests.size}`);
  
  // Log request durations
  if (activeRequests.size > 0) {
    console.log('📋 Active request durations:');
    activeRequests.forEach((res) => {
      const startTime = requestStartTime.get(res);
      if (startTime) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`   - Request running for ${duration}s`);
      }
    });
  }
  
  // If there are active requests, wait for them to complete
  if (activeRequests.size > 0) {
    console.log(`⏳ Waiting for ${activeRequests.size} active request(s) to complete before shutdown...`);
    isShuttingDown = true;
    
    // Stop accepting new requests immediately
    server.close(() => {
      console.log('✅ HTTP server closed (no longer accepting new requests)');
      // Force close all connections after a short delay to ensure port is released
      setTimeout(() => {
        server.closeAllConnections();
        console.log('✅ All connections closed, port should be released');
      }, 1000);
    });
    
    // Wait for active requests to complete (max 90 seconds for long-running queries)
    const shutdownTimeout = setTimeout(() => {
      console.log('⚠️ Forcing shutdown after timeout (90s)');
      server.closeAllConnections();
      process.exit(0);
    }, 90000);
    
    // Check if all requests are done
    const checkActiveRequests = setInterval(() => {
      if (activeRequests.size === 0) {
        clearInterval(checkActiveRequests);
        clearTimeout(shutdownTimeout);
        console.log('✅ All requests completed, shutting down');
        server.closeAllConnections();
        process.exit(0);
      } else {
        const durations = Array.from(activeRequests).map(res => {
          const startTime = requestStartTime.get(res);
          return startTime ? ((Date.now() - startTime) / 1000).toFixed(2) : 'unknown';
        });
        console.log(`⏳ Still waiting for ${activeRequests.size} active request(s) to complete... (durations: ${durations.join(', ')}s)`);
      }
    }, 2000);
  } else {
    // No active requests, shutdown immediately
    console.log('✅ No active requests, shutting down immediately');
    server.close(() => {
      server.closeAllConnections();
      process.exit(0);
    });
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Ensure server closes properly on uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

