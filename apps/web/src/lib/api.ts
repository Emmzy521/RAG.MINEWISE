import { auth } from './firebase';

// API URL - Uses environment variable for both development and production
// Development: http://localhost:5001/minewise-ai-4a4da/us-central1/api (Firebase Functions emulator)
// Production: https://api-tkaqtnga6a-uc.a.run.app (Cloud Run)

// Determine API base URL with proper fallbacks
// Priority: 1. VITE_API_URL env var, 2. Production/Dev detection, 3. Hardcoded fallback
let API_BASE: string;

if (import.meta.env.VITE_API_URL) {
  // Use explicit environment variable if set
  API_BASE = import.meta.env.VITE_API_URL;
} else if (import.meta.env.PROD) {
  // Production mode - use Cloud Run URL
  API_BASE = 'https://api-tkaqtnga6a-uc.a.run.app';
} else {
  // Development mode - use local emulator
  API_BASE = 'http://localhost:5001/minewise-ai-4a4da/us-central1/api';
}

// Log configuration for debugging
console.log('🔧 API Configuration:', {
  mode: import.meta.env.PROD ? 'production' : 'development',
  envVar: import.meta.env.VITE_API_URL || '(not set)',
  resolved: API_BASE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
});

// Debug: Log what URL we're using
console.log('🔧 API URL configured:', API_BASE, import.meta.env.DEV ? '(development)' : '(production)');

export async function apiCall<T>(procedure: string, input?: any): Promise<T> {
  const user = auth.currentUser;
  const token = await user?.getIdToken();

  // Use the API base URL directly (it already includes the full path)
  const endpoint = API_BASE;
  
  const requestBody = { procedure, input };
  console.log('🌐 API Request:', { endpoint, procedure, input });
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('📥 API Response:', { status: response.status, statusText: response.statusText, url: response.url });

    if (!response.ok) {
      let errorMessage = `API error: ${response.statusText}`;
      
      // Check if response has content before trying to parse
      const contentType = response.headers.get('content-type');
      const hasJsonContent = contentType && contentType.includes('application/json');
      
      // Get response text first to check if it's empty
      const responseText = await response.text();
      
      if (hasJsonContent && responseText.trim().length > 0) {
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.error || error.message || error.details || errorMessage;
          console.error('❌ API Error:', error);
        } catch (e) {
          console.error('❌ Failed to parse error response:', e);
          // Use the raw text if JSON parsing fails
          if (responseText.trim().length > 0) {
            errorMessage = responseText;
          }
        }
      } else {
        // Handle non-JSON or empty responses
        if (responseText.trim().length > 0) {
          errorMessage = responseText;
        } else if (response.status === 0 || response.status === 503) {
          errorMessage = `Cannot connect to server. Make sure the backend server is running at ${API_BASE}`;
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized. Please log in again.';
        } else if (response.status === 404) {
          errorMessage = `API endpoint not found (${response.status}). Check the server configuration. Endpoint: ${endpoint}`;
        } else if (response.status === 500) {
          errorMessage = 'Internal server error. Check server logs for details.';
        }
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors (Failed to fetch)
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      console.error('❌ Network Error:', error);
      throw new Error(
        `Cannot connect to the API server. Please ensure:\n` +
        `1. The backend server is running (cd functions && pnpm dev)\n` +
        `2. The server is accessible at ${API_BASE}\n` +
        `3. Check browser console for CORS errors`
      );
    }
    throw error;
  }
}

// Typed API functions
export const api = {
  health: () => apiCall<{ status: string; timestamp: string }>('health'),
  
  query: (input: { query: string; topK?: number }) =>
    apiCall<{ answer: string; citations: string[]; sources: Array<{ documentId: string; chunkId: string; content: string; score: number; source: string; pageNumber?: number }> }>('query', input),
  
  uploadDocument: (input: { filename: string; content: string; mimeType: string }) =>
    apiCall<{ success: boolean; documentId: string; chunkCount: number }>('uploadDocument', input),
  
  getDocuments: () =>
    apiCall<Array<{ id: string; filename: string; uploadedAt: any; userId: string; size: number; mimeType: string; chunkCount?: number }>>('getDocuments'),
  
  deleteDocument: (input: { documentId: string }) =>
    apiCall<{ success: boolean }>('deleteDocument', input),
  
  getDashboardStats: () =>
    apiCall<{ documentCount: number; queryCount: number; totalChunks: number }>('getDashboardStats'),
};
