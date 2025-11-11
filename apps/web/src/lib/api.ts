import { auth } from './firebase';

// API URL Configuration
// - Development: Uses Vite proxy (/api) which forwards to http://localhost:5001/api
// - Production: Uses VITE_API_URL from .env.production or falls back to /api
const API_URL = import.meta.env.DEV 
  ? '/api'  // Always use proxy in development (avoids CORS issues)
  : (import.meta.env.VITE_API_URL || '/api');

// Debug: Log what URL we're using
if (import.meta.env.DEV) {
  console.log('🔧 API URL configured:', API_URL, '(using Vite proxy)');
} else if (import.meta.env.VITE_API_URL) {
  console.log('🔧 API URL configured:', API_URL, '(production)');
}

// Retry logic for handling connection resets during server restarts
async function fetchWithRetry(
  endpoint: string,
  options: RequestInit,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<Response> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, options);
      
      // If we get a response (even if not ok), don't retry
      // Only retry on network errors
      return response;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a connection reset or network error that might be recoverable
      const isRetryableError = 
        error.message === 'Failed to fetch' ||
        error.name === 'TypeError' ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('network') ||
        error.message?.includes('connection');
      
      if (!isRetryableError || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retrying, with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      console.log(`⚠️ Request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export async function apiCall<T>(procedure: string, input?: any): Promise<T> {
  const user = auth.currentUser;
  const token = await user?.getIdToken();

  // Construct endpoint URL
  // Production URLs might already include /api, or might be the base URL
  // Development uses /api which is handled by Vite proxy
  let endpoint: string;
  if (API_URL.startsWith('http')) {
    // Production URL - check if it already ends with /api
    endpoint = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
  } else {
    // Development - use as-is (will be proxied by Vite)
    endpoint = API_URL;
  }
  
  const requestBody = { procedure, input };
  console.log('🌐 API Request:', { endpoint, procedure, input });
  
  try {
    const response = await fetchWithRetry(endpoint, {
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
          errorMessage = 'Cannot connect to server. Make sure the backend server is running on http://localhost:5001';
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
        'Cannot connect to the API server. Please ensure:\n' +
        '1. The backend server is running (cd functions && pnpm dev)\n' +
        '2. The server is accessible at http://localhost:5001\n' +
        '3. Check browser console for CORS errors'
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
