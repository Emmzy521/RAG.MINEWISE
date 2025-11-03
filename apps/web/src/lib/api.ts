import { auth } from './firebase';

const API_URL = import.meta.env.VITE_FUNCTIONS_URL || 'http://localhost:5001';

export async function apiCall<T>(procedure: string, input?: any): Promise<T> {
  const user = auth.currentUser;
  const token = await user?.getIdToken();

  const response = await fetch(`${API_URL}/api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ procedure, input }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.statusText}`);
  }

  return response.json();
}

// Typed API functions
export const api = {
  health: () => apiCall<{ status: string; timestamp: string }>('health'),
  
  query: (input: { query: string; topK?: number }) =>
    apiCall<{ answer: string; sources: Array<{ documentId: string; chunkId: string; content: string; score: number }> }>('query', input),
  
  uploadDocument: (input: { filename: string; content: string; mimeType: string }) =>
    apiCall<{ success: boolean; documentId: string; chunkCount: number }>('uploadDocument', input),
  
  getDocuments: () =>
    apiCall<Array<{ id: string; filename: string; uploadedAt: any; userId: string; size: number; mimeType: string; chunkCount?: number }>>('getDocuments'),
  
  deleteDocument: (input: { documentId: string }) =>
    apiCall<{ success: boolean }>('deleteDocument', input),
  
  getDashboardStats: () =>
    apiCall<{ documentCount: number; queryCount: number; totalChunks: number }>('getDashboardStats'),
};
