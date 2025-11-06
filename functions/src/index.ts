import { onRequest } from 'firebase-functions/v2/https';
import { onInit } from 'firebase-functions/v2/core';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as logger from 'firebase-functions/logger';

// Set Google Cloud Project ID for Vertex AI (from Firebase project)
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT_ID || process.env.GCLOUD_PROJECT || 'minewise-ai-4a4da';
process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_CLOUD_PROJECT_ID = PROJECT_ID;

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

// --- CRITICAL FIX: Cloud Function Export Handler (Resolves TS2345 Promise Mismatch) ---
export const api = onRequest(
  {
    cors: true,
    region: 'us-central1',
  },
  async (request, response): Promise<void> => {
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
        const body = request.body;
        
        if (!body || typeof body !== 'object' || !body.procedure) {
          logger.warn('Invalid request body received.');
          response.status(400).json({ error: 'Invalid request format or missing procedure.' });
          return;
        }

        const { procedure, input } = body;

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

        const caller = router.createCaller({ userId });

        // 2. Execute the tRPC Procedure
        let result;
        
        switch (procedure) {
          case 'uploadDocument':
            result = await caller.uploadDocument(input);
            break;
          case 'query':
            result = await caller.query(input);
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
            response.status(404).json({ error: `Procedure '${procedure}' not found` });
            return;
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
      logger.error('API Error during execution:', error);
      
      // Handle tRPC errors or internal execution errors
      const statusCode = error.code === 'UNAUTHORIZED' ? 401 : 500;
      response.status(statusCode).json({ error: error.message || 'Internal API Error' });
      return;
    }
  }
);

// Export type lazily to avoid importing router during deployment analysis
export type { AppRouter } from './router.js';

