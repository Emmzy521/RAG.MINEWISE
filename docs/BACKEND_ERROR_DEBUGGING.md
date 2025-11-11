# 🔍 Backend Error Debugging Guide

## Where is the Backend Code?

Your backend server code is located in the **`functions/`** directory of this project:

```
RAG.MINEWISE/
├── functions/              ← BACKEND CODE IS HERE
│   ├── src/
│   │   ├── server-dev.ts  ← Main server file (runs on port 5001)
│   │   ├── router.ts      ← API routes and procedures
│   │   ├── retrieval.ts   ← RAG retrieval logic
│   │   ├── generation.ts  ← Response generation logic
│   │   └── ...
│   └── package.json
└── apps/
    └── web/               ← Frontend code (separate)
```

## How to Start the Backend Server

1. **Open a terminal** and navigate to the functions directory:
   ```bash
   cd functions
   ```

2. **Start the development server**:
   ```bash
   pnpm dev
   ```

3. **You should see**:
   ```
   🚀 Local API server running on http://localhost:5001
   📡 API endpoint: http://localhost:5001/api
   ❤️  Health check: http://localhost:5001/health
   ```

## Where to See Error Messages

**All backend errors appear in the terminal where you ran `pnpm dev`.**

When an error occurs, you'll see detailed output like:

```
❌ API Error during execution: Error: Failed to retrieve chunks
Error name: Error
Error message: Failed to retrieve chunks: Cannot read property 'embedding' of undefined
Error stack:
    at retrieveTopKChunks (functions/src/retrieval.ts:72:30)
    at query (functions/src/router.ts:127:15)
    ...
```

## Common Error Locations

### 1. **API Request Handler**
   - **File**: `functions/src/server-dev.ts`
   - **Lines**: 108-377
   - **What it does**: Receives requests from frontend, validates input, calls procedures

### 2. **Query Procedure**
   - **File**: `functions/src/router.ts`
   - **Lines**: 110-171
   - **What it does**: Handles the `query` procedure, calls retrieval and generation

### 3. **Retrieval Logic**
   - **File**: `functions/src/retrieval.ts`
   - **Lines**: 34-118
   - **What it does**: Searches Firestore for relevant document chunks

### 4. **Generation Logic**
   - **File**: `functions/src/generation.ts`
   - **Lines**: 26-166
   - **What it does**: Generates response using Gemini API

## How to Debug Errors

### Step 1: Check the Server Terminal

The terminal running `pnpm dev` will show:
- ✅ Request received logs
- ❌ Error messages with full stack traces
- 📝 Procedure execution logs

### Step 2: Look for Error Patterns

Common error messages and their meanings:

| Error Message | Likely Cause | File to Check |
|--------------|--------------|---------------|
| `Failed to retrieve chunks` | Firestore query failed or no chunks found | `retrieval.ts` |
| `Failed to generate response` | Gemini API error or authentication issue | `generation.ts` |
| `Router not initialized` | Firestore not set up correctly | `server-dev.ts` |
| `Procedure not found` | Wrong procedure name sent from frontend | `server-dev.ts` |
| `Unauthorized access` | Missing or invalid auth token | `router.ts` |

### Step 3: Check Environment Variables

Make sure `.env.local` in `functions/` has:
```env
GOOGLE_CLOUD_PROJECT_ID=minewise-ai-4a4da
PORT=5001
```

### Step 4: Verify Firebase Admin Setup

The server needs Firebase Admin credentials. Check if you see:
```
✅ Firebase Admin initialized successfully
✅ Router initialized with Firestore
```

If not, you may need to run:
```bash
gcloud auth application-default login
```

## Enhanced Error Logging

The server now logs:
- 📥 **Incoming requests** (method, URL, body, headers)
- 🔧 **Procedure calls** (procedure name, input data)
- ✅ **Success messages** (when procedures complete)
- ❌ **Detailed errors** (error name, message, stack trace, code)

All errors include:
- Error name and message
- Full stack trace (in development mode)
- Error code (if available)
- Request context (procedure, input, userId)

## Quick Test

To verify the server is working:

```bash
# In a new terminal
curl http://localhost:5001/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-01-01T12:00:00.000Z"}
```

## Still Having Issues?

1. **Check the server terminal** - errors are always logged there
2. **Look for the file path** in the error stack trace
3. **Check the line number** mentioned in the error
4. **Verify environment variables** are set correctly
5. **Restart the server** after making changes

Remember: **The backend terminal is your best friend for debugging!** 🐛

