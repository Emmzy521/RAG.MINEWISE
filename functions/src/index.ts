import { onRequest } from 'firebase-functions/v2/https';
import { onInit } from 'firebase-functions/v2/core';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as logger from 'firebase-functions/logger';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

// Set Google Cloud Project ID for Vertex AI (from Firebase project)
// Firebase Functions v2 automatically provides GCLOUD_PROJECT
function getProjectId(): string {
  // Try multiple sources in order of preference
  const projectId = 
    process.env.GOOGLE_CLOUD_PROJECT_ID || 
    process.env.GCP_PROJECT_ID || 
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    'minewise-ai-4a4da'; // Fallback (should not be needed in production)
  
  // Set both environment variables for consistency
  process.env.GOOGLE_CLOUD_PROJECT = projectId;
  process.env.GOOGLE_CLOUD_PROJECT_ID = projectId;
  
  return projectId;
}

const PROJECT_ID = getProjectId();

// Lazy-loaded router to avoid heavy imports during deployment analysis
let appRouter: any = null;
let routerModule: any = null;
let setFirestoreFn: ((instance: any) => void) | null = null;

// Initialize router lazily (only when first needed)
async function getRouter() {
  if (!routerModule) {
    routerModule = await import('./router.js');
    appRouter = routerModule.appRouter;
    setFirestoreFn = routerModule.setFirestore;
  }
  return appRouter;
}

// --- Lazy Initialization Helper ---
// This ensures Firebase Admin is initialized only once, but lazily (not during deploy analysis)
function ensureInitialized() {
  if (getApps().length === 0) {
    initializeApp();
  }
  const db = getFirestore();
  const auth = getAuth();
  
  return { db, auth };
}

// Use onInit to defer any initialization that might be needed
// Note: We don't import the router here to avoid timeout during deployment
onInit(async () => {
  // Pre-initialize Firebase Admin only
  // Router will be loaded lazily on first request
  try {
    ensureInitialized();
    logger.info('Firebase Functions initialized successfully');
  } catch (error) {
    logger.error('Error during onInit:', error);
    // Don't throw - allow lazy initialization on first request
  }
});

// Allowed origins for CORS
const allowedOrigins = [
  'https://minewise-ai-4a4da.web.app',
  'https://minewise-ai-4a4da.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

// Helper function to set CORS headers
function setCorsHeaders(request: any, response: any): boolean {
  const origin = request.headers.origin;
  
  // Check if origin is allowed (exact match or starts with for localhost)
  if (origin) {
    const isAllowed = allowedOrigins.some(allowed => {
      // Exact match
      if (origin === allowed) return true;
      // For localhost, allow any port
      if (allowed.startsWith('http://localhost') && origin.startsWith('http://localhost')) {
        return true;
      }
      return false;
    });
    
    if (isAllowed) {
      // Set CORS headers explicitly - use set() for Firebase Functions
      response.set('Access-Control-Allow-Origin', origin);
      response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.set('Access-Control-Allow-Credentials', 'true');
      response.set('Access-Control-Max-Age', '3600');
      logger.info(`✅ CORS allowed for origin: ${origin}`);
      return true;
    } else {
      logger.warn(`❌ CORS blocked for origin: ${origin}`);
      // Still set headers but with error status will be handled by caller
      return false;
    }
  }
  
  // Allow requests with no origin (e.g., mobile apps, curl, Postman)
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return true;
}

// --- CRITICAL FIX: Cloud Function Export Handler (Resolves TS2345 Promise Mismatch) ---
export const api = onRequest(
  {
    cors: [
      'https://minewise-ai-4a4da.web.app',
      'https://minewise-ai-4a4da.firebaseapp.com',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5000',
    ],
    region: 'us-central1',
  },
  async (request, response): Promise<void> => {
    const origin = request.headers.origin;
    
    // Handle OPTIONS preflight requests FIRST - before any other logic
    // This MUST be the very first thing we do
    if (request.method === 'OPTIONS') {
      logger.info(`🔍 OPTIONS preflight request from origin: ${origin}`);
      
      // Check if origin is allowed
      const isAllowed = origin && (
        allowedOrigins.includes(origin) ||
        allowedOrigins.some(allowed => 
          allowed.startsWith('http://localhost') && origin.startsWith('http://localhost')
        )
      );
      
      if (isAllowed || !origin) {
        // Set CORS headers for OPTIONS - use set() method for Firebase Functions
        response.set('Access-Control-Allow-Origin', origin || '*');
        response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.set('Access-Control-Allow-Credentials', 'true');
        response.set('Access-Control-Max-Age', '3600');
        logger.info(`✅ OPTIONS preflight allowed for: ${origin || 'no origin'}`);
        response.status(204).send('');
        return;
      } else {
        logger.warn(`❌ OPTIONS preflight blocked for origin: ${origin}`);
        response.status(403).json({ error: 'CORS policy: Origin not allowed' });
        return;
      }
    }
    
    // Set CORS headers for all other requests
    const corsAllowed = setCorsHeaders(request, response);
    
    // If CORS is not allowed for non-OPTIONS requests, still process but log warning
    if (!corsAllowed && request.headers.origin) {
      logger.warn(`⚠️ CORS not allowed for origin: ${request.headers.origin}, but processing request anyway`);
    }
    
    // Ensure project ID is set before processing
    const currentProjectId = getProjectId();
    logger.info(`🔧 Using Google Cloud Project: ${currentProjectId}`);
    
    // Lazy initialization - only happens when function is actually invoked
    const { db, auth } = ensureInitialized();
    
    // Ensure router is loaded and Firestore is set
    const router = await getRouter();
    if (setFirestoreFn) {
      setFirestoreFn(db);
    }
    
    try {
      const method = request.method;
      const path = request.path;

      // Handle Health Check (GET /health)
      if (method === 'GET' && path === '/health') {
        const result = await router.createCaller({}).health();
        response.json(result);
        return;
      }
      
      // Handle all tRPC Procedures (POST)
      if (method === 'POST') {
        // Parse request body - Firebase Functions v2 should auto-parse JSON, but ensure it's an object
        let body: any;
        try {
          // If body is already parsed (Firebase Functions v2 does this automatically)
          if (typeof request.body === 'object' && request.body !== null) {
            body = request.body;
          } else if (typeof request.body === 'string') {
            // If it's a string, try to parse it
            body = JSON.parse(request.body);
          } else {
            // Try to get raw body and parse
            body = JSON.parse(request.rawBody?.toString() || '{}');
          }
        } catch (parseError: any) {
          logger.error('❌ Failed to parse request body:', parseError);
          response.status(400).json({ error: 'Invalid JSON in request body' });
          return;
        }
        
        logger.info('📥 Parsed request body:', JSON.stringify(body, null, 2));
        
        if (!body || typeof body !== 'object' || !body.procedure) {
          logger.warn('Invalid request body received:', JSON.stringify(body, null, 2));
          response.status(400).json({ error: 'Invalid request format or missing procedure.' });
          return;
        }

        // Extract and validate procedure - ensure it's a string
        let procedure: string;
        if (typeof body.procedure === 'string') {
          procedure = body.procedure.trim(); // Trim whitespace
        } else if (typeof body.procedure === 'object' && body.procedure !== null) {
          // If procedure is an object, try to stringify it for debugging
          logger.error('❌ Procedure is an object instead of string:', JSON.stringify(body.procedure));
          response.status(400).json({ 
            error: 'Procedure must be a string, not an object.',
            received: JSON.stringify(body.procedure)
          });
          return;
        } else {
          logger.error('❌ Procedure is not a string:', typeof body.procedure, body.procedure);
          response.status(400).json({ 
            error: `Procedure must be a string, got ${typeof body.procedure}`,
            received: body.procedure 
          });
          return;
        }
        
        // Validate procedure is not empty
        if (!procedure || procedure.length === 0) {
          response.status(400).json({ error: 'Procedure cannot be empty.' });
          return;
        }
        
        const input = body.input;

        // 1. Authentication and Context Setup
        const authHeader = request.headers.authorization;
        let userId: string | undefined;

        if (authHeader?.startsWith('Bearer ')) {
          try {
            const token = authHeader.split('Bearer ')[1];
            // Verify the token to get the user ID
            const decodedToken = await auth.verifyIdToken(token);
            userId = decodedToken.uid;
          } catch (error) {
            logger.warn('Invalid Auth Token received:', error);
          }
        }

        // Ensure router is properly initialized
        if (!router || typeof router.createCaller !== 'function') {
          logger.error('❌ Router is not properly initialized!');
          logger.error('Router:', router);
          logger.error('typeof router:', typeof router);
          response.status(500).json({ error: 'Router not initialized' });
          return;
        }

        // Create context object explicitly
        const context: { userId?: string } = {};
        if (userId) {
          context.userId = userId;
        }
        
        logger.info('🔧 Creating tRPC caller with context:', JSON.stringify(context));
        const caller = router.createCaller(context);
        
        // Verify caller was created correctly
        if (!caller) {
          logger.error('❌ Failed to create tRPC caller');
          response.status(500).json({ error: 'Failed to create tRPC caller' });
          return;
        }
        
        logger.info('🔧 Caller created successfully, type:', typeof caller);
        
        // Final validation - ensure procedure is definitely a string
        if (typeof procedure !== 'string') {
          logger.error('❌ CRITICAL: Procedure is not a string at execution time!', typeof procedure, procedure);
          response.status(400).json({ 
            error: `Internal error: Procedure type mismatch - expected string, got ${typeof procedure}` 
          });
          return;
        }

        // 2. Execute the tRPC Procedure
        let result;
        logger.info('🔍 Calling procedure:', procedure, 'Type:', typeof procedure);
        logger.info('🔍 Input:', JSON.stringify(input, null, 2));
        
        // Ensure procedure is a string before using in switch
        const procedureName = String(procedure).trim(); // Force string conversion and trim
        
        // Validate input based on procedure type
        try {
          switch (procedureName) {
            case 'uploadDocument':
              if (!input || typeof input !== 'object') {
                throw new Error('uploadDocument requires an input object');
              }
              result = await caller.uploadDocument(input);
              break;
            case 'query':
              if (!input || typeof input !== 'object') {
                throw new Error('query requires an input object with query field');
              }
              if (!input.query || typeof input.query !== 'string') {
                throw new Error('query input must include a "query" field as a string');
              }
              // Ensure input is properly formatted
              const queryInput = {
                query: String(input.query),
                topK: input.topK ? Number(input.topK) : 5
              };
              logger.info('🔍 Calling query with input:', JSON.stringify(queryInput, null, 2));
              
              // Verify caller.query exists and is a function
              if (!caller.query) {
                logger.error('❌ caller.query is not available!');
                logger.error('Caller type:', typeof caller);
                logger.error('Caller keys:', Object.keys(caller || {}));
                throw new Error('caller.query is not available');
              }
              
              // Verify it's callable (tRPC uses a proxy, so it might not be a direct function)
              if (typeof caller.query !== 'function') {
                logger.warn('⚠️ caller.query is not a direct function (might be a proxy)');
              }
              
              // Call the query procedure - wrap in try-catch for better error handling
              // tRPC uses a proxy, so we need to be careful about how we call it
              try {
                logger.info('🔍 About to call caller.query with:', JSON.stringify(queryInput, null, 2));
                
                // Try calling directly first
                if (typeof caller.query === 'function') {
                  result = await caller.query(queryInput);
                } else {
                  // If it's not a direct function, it's a proxy - call it anyway
                  // The proxy will handle the call correctly
                  result = await (caller as any).query(queryInput);
                }
                
                logger.info('✅ caller.query completed successfully');
              } catch (queryError: any) {
                // Check if this is the specific tRPC error about path
                if (queryError.message && queryError.message.includes('procedure on path')) {
                  logger.error('❌ tRPC path error - procedure name might be wrong:', {
                    error: queryError.message,
                    procedureName: procedureName,
                    input: JSON.stringify(queryInput, null, 2),
                    callerType: typeof caller,
                    callerKeys: Object.keys(caller || {})
                  });
                  
                  // Try alternative: access the procedure directly from router
                  logger.info('🔄 Attempting alternative: calling procedure directly from router');
                  try {
                    const routerDef = (router as any)._def;
                    if (routerDef && routerDef.procedures && routerDef.procedures.query) {
                      const queryProcedure = routerDef.procedures.query;
                      const resolver = queryProcedure._def?.resolver;
                      if (resolver) {
                        result = await resolver({
                          input: queryInput,
                          ctx: context,
                          path: 'query',
                          type: 'mutation',
                        });
                        logger.info('✅ Direct procedure call succeeded');
                      } else {
                        throw new Error('Could not find procedure resolver');
                      }
                    } else {
                      throw new Error('Could not find query procedure in router');
                    }
                  } catch (altError: any) {
                    logger.error('❌ Alternative call also failed:', altError.message);
                    throw queryError; // Throw original error
                  }
                } else {
                  logger.error('❌ Error calling caller.query:', {
                    error: queryError.message,
                    stack: queryError.stack,
                    input: JSON.stringify(queryInput, null, 2)
                  });
                  throw queryError;
                }
              }
              break;
            case 'getDocuments':
              result = await caller.getDocuments();
              break;
            case 'deleteDocument':
              if (!input || typeof input !== 'object') {
                throw new Error('deleteDocument requires an input object');
              }
              result = await caller.deleteDocument(input);
              break;
            case 'getDashboardStats':
              result = await caller.getDashboardStats();
              break;
            case 'health':
              result = await caller.health();
              break;
            default:
              logger.error(`❌ Unknown procedure: ${procedureName}`);
              response.status(404).json({ error: `Procedure '${procedureName}' not found` });
              return;
          }
        } catch (procedureError: any) {
          logger.error('❌ Procedure execution error:', {
            procedure: procedureName,
            error: procedureError.message,
            stack: procedureError.stack,
            input: JSON.stringify(input, null, 2)
          });
          throw procedureError; // Re-throw to be caught by outer catch
        }

        // 3. Successful Response
        response.json(result);
        return;
      }

      // Handle Method Not Allowed
      response.status(405).json({ error: 'Method not allowed' });
      return;
    } catch (error: any) {
      // 4. Error Handling (Explicitly catch and respond)
      logger.error('❌ API Error during execution:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        procedure: request.body?.procedure,
        method: request.method,
        path: request.path,
      });
      
      // Handle tRPC errors or internal execution errors
      const statusCode = error.code === 'UNAUTHORIZED' ? 401 : 500;
      
      // Provide more detailed error message in development, generic in production
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? error.message || 'Internal API Error'
        : error.message || 'Internal API Error';
      
      response.status(statusCode).json({ 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          details: error.toString() 
        })
      });
      return;
    }
  }
);

// Export type lazily to avoid importing router during deployment analysis
export type { AppRouter } from './router.js';

