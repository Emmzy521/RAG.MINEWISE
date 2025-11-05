# Frontend-Backend Integration Complete ✅

## Summary

Successfully connected the frontend to the backend RAG pipeline. The frontend can now query documents and receive AI-powered answers with source citations.

## Changes Made

### 1. ✅ Updated Backend Response Format (`apps/functions/src/router.ts`)
   - Added `sources` array with detailed chunk information
   - Includes: documentId, chunkId, content, similarity score, source URL, page number
   - Kept `citations` array for unique document references

### 2. ✅ Updated Frontend API Client (`apps/web/src/lib/api.ts`)
   - Updated TypeScript types to match backend response
   - Added better error handling with helpful messages
   - Uses environment variable `VITE_FUNCTIONS_URL` (defaults to `http://localhost:5001/api`)

### 3. ✅ Updated Query Page (`apps/web/src/pages/Query.tsx`)
   - Updated interface to match backend response format
   - Displays sources with similarity scores and page numbers
   - Shows citations separately
   - Improved error display

## How to Test

### Step 1: Start the Backend Server

```bash
cd apps/functions
pnpm dev
```

You should see:
```
✅ Firebase Admin initialized successfully
📋 Using Google Cloud Project: minewise-ai-4a4da
✅ Router initialized with Firestore
🚀 Local API server running on http://localhost:5001
```

### Step 2: Start the Frontend

In a **new terminal**:

```bash
cd apps/web
pnpm dev
```

The frontend will start on `http://localhost:5173` (or similar)

### Step 3: Test the Connection

1. **Log in** to the frontend (if not already logged in)
2. Navigate to the **Query** page
3. Enter a question like: "What are the requirements for obtaining a mineral trading permit in Zambia?"
4. Click **Search**

### Expected Result

You should see:
- ✅ **Answer**: AI-generated response with citations
- ✅ **Sources**: List of document chunks with similarity scores
- ✅ **Citations**: List of referenced documents

## Troubleshooting

### "Failed to fetch" Error

1. **Check if backend is running:**
   ```bash
   curl http://localhost:5001/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Check backend terminal** for errors:
   - Missing environment variables
   - Firebase Admin initialization issues
   - Vertex AI API errors

3. **Check browser console** (F12):
   - Network tab shows the request
   - Console shows any errors

4. **Verify authentication:**
   - Make sure you're logged in
   - Check if auth token is being sent

### Common Issues

**Backend not starting:**
- Check if port 5001 is already in use
- Verify dependencies: `cd apps/functions && pnpm install`
- Check for TypeScript errors: `pnpm type-check`

**CORS errors:**
- Backend allows all origins by default (`CORS_ORIGIN=*`)
- Check `apps/functions/src/server-dev.ts` CORS settings

**Authentication errors:**
- Verify Firebase Auth is configured
- Check browser console for auth errors
- Make sure you're logged in before querying

**API errors:**
- Check backend logs for detailed error messages
- Verify Google Cloud credentials are set up
- Check environment variables

## Response Format

The API returns:
```json
{
  "answer": "Generated answer based on retrieved chunks...",
  "citations": [
    "gs://minewise-bucket/document1.pdf",
    "gs://minewise-bucket/document2.pdf"
  ],
  "sources": [
    {
      "documentId": "document-id",
      "chunkId": "chunk-id",
      "content": "Chunk content text...",
      "score": 0.7649,
      "source": "gs://minewise-bucket/document.pdf",
      "pageNumber": 1
    }
  ]
}
```

## Next Steps

1. ✅ Frontend connected to backend
2. ✅ Error handling improved
3. ✅ Response format matched
4. ⏭️ Test with real queries
5. ⏭️ Deploy to production

## Files Modified

- `apps/functions/src/router.ts` - Added sources array to response
- `apps/web/src/lib/api.ts` - Updated types and error handling
- `apps/web/src/pages/Query.tsx` - Updated UI to display new format

## Environment Variables

### Frontend (`apps/web/.env.local`)
```env
VITE_FUNCTIONS_URL=http://localhost:5001/api
```

### Backend (`apps/functions/.env.local`)
```env
GOOGLE_CLOUD_PROJECT_ID=minewise-ai-4a4da
```

Both are optional and have defaults.



