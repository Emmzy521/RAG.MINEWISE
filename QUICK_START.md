# 🚀 Quick Start Guide

## Backend Server Location

**Your backend code is in: `functions/` directory**

```
RAG.MINEWISE/
└── functions/          ← BACKEND IS HERE
    └── src/
        └── server-dev.ts
```

## Starting the Backend

1. Open a terminal
2. Navigate to functions directory:
   ```bash
   cd functions
   ```
3. Start the server:
   ```bash
   pnpm dev
   ```

## Where Errors Appear

**All backend errors show up in the terminal where you ran `pnpm dev`**

When you see a 500 error in your browser:
1. **Look at the backend terminal** (where `pnpm dev` is running)
2. You'll see a detailed error message with:
   - Error name and message
   - Full stack trace
   - File path and line number
   - Request details

## Example Error Output

When an error occurs, you'll see something like:

```
================================================================================
❌ API ERROR DETECTED
================================================================================
Error Name: TypeError
Error Message: Cannot read property 'embedding' of undefined
Error Code: N/A
Request Method: POST
Request URL: /api
Procedure: query
Input: {"query":"mining rules","topK":5}
User ID: dev-user-local

📚 Full Stack Trace:
TypeError: Cannot read property 'embedding' of undefined
    at retrieveTopKChunks (functions/src/retrieval.ts:72:30)
    at query (functions/src/router.ts:127:15)
    ...
================================================================================
```

## Common Files to Check

| Error Type | File to Check | Location |
|------------|---------------|----------|
| API request errors | `functions/src/server-dev.ts` | Lines 108-383 |
| Query procedure errors | `functions/src/router.ts` | Lines 110-171 |
| Retrieval errors | `functions/src/retrieval.ts` | Lines 34-118 |
| Generation errors | `functions/src/generation.ts` | Lines 26-166 |

## Need More Help?

See `BACKEND_ERROR_DEBUGGING.md` for detailed debugging guide.

