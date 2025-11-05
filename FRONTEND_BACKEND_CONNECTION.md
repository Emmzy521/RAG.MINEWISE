# Frontend-Backend Connection Guide

## Quick Start

### 1. Start the Backend Server

In one terminal, navigate to the functions directory and start the dev server:

```bash
cd apps/functions
pnpm dev
```

This will start the API server on `http://localhost:5001`

### 2. Start the Frontend

In another terminal, start the web app:

```bash
cd apps/web
pnpm dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in terminal)

### 3. Make Sure You're Logged In

- The frontend requires Firebase authentication
- Make sure you're logged in before making queries
- The API will use your Firebase auth token automatically

## Configuration

### API URL

The frontend uses the API URL from environment variables. You can set it in `apps/web/.env.local`:

```env
VITE_FUNCTIONS_URL=http://localhost:5001/api
```

If not set, it defaults to `http://localhost:5001/api`

### Backend Environment Variables

Make sure `apps/functions/.env.local` has:

```env
GOOGLE_CLOUD_PROJECT_ID=minewise-ai-4a4da
```

Or it will use the default: `minewise-ai-4a4da`

## Troubleshooting

### "Failed to fetch" Error

1. **Check if backend server is running:**
   ```bash
   curl http://localhost:5001/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Check CORS settings:**
   - Backend allows all origins by default (`CORS_ORIGIN=*`)
   - If issues persist, check `apps/functions/src/server-dev.ts`

3. **Check authentication:**
   - Make sure you're logged in to the frontend
   - Check browser console for auth errors

4. **Check API endpoint:**
   - Verify the API URL in browser Network tab
   - Should be: `POST http://localhost:5001/api`

### Backend Errors

Check the backend terminal for error messages. Common issues:

- **Missing GOOGLE_CLOUD_PROJECT_ID**: Set it in `.env.local` or it defaults to `minewise-ai-4a4da`
- **Firebase Admin not initialized**: Run `gcloud auth application-default login`
- **Vertex AI API errors**: Check Google Cloud credentials

## Testing the Connection

1. **Test health endpoint:**
   ```bash
   curl http://localhost:5001/health
   ```

2. **Test query endpoint (requires auth token):**
   - Use the frontend UI to test queries
   - Or use the browser's Network tab to see the request/response

## Response Format

The API returns:
```json
{
  "answer": "Generated answer text...",
  "citations": ["gs://bucket/doc1.pdf", "gs://bucket/doc2.pdf"],
  "sources": [
    {
      "documentId": "doc-id",
      "chunkId": "chunk-id",
      "content": "Chunk content...",
      "score": 0.7649,
      "source": "gs://bucket/doc.pdf",
      "pageNumber": 1
    }
  ]
}
```

The frontend displays:
- **Answer**: The generated response
- **Sources**: Detailed chunks with similarity scores
- **Citations**: List of referenced documents



