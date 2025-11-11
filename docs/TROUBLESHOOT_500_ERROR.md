# Troubleshooting 500 Internal Server Error

## Quick Checks

1. **Check the server terminal** - Look for error messages in the terminal where `pnpm dev` is running

2. **Common Issues:**

### Missing Environment Variables
The server needs these environment variables. Create a `.env` file in `apps/functions/`:

```env
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=minewise-ai
PINECONE_ENVIRONMENT=your_pinecone_environment
OPENAI_MODEL=gpt-4
```

### Firebase Admin Configuration
For local development, you need Firebase credentials. Options:

**Option 1: Use Firebase Emulator (Recommended for local dev)**
- Install Java (required for Firestore emulator)
- Run: `firebase emulators:start`

**Option 2: Use Service Account Key**
1. Download service account key from Firebase Console
2. Set environment variable: `GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json`

**Option 3: Use Application Default Credentials**
- Run: `gcloud auth application-default login`

## Check Server Logs

Look in the terminal where the dev server is running for:
- ✅ Firebase Admin initialized successfully
- ✅ Router initialized with Firestore
- 📥 Received API request: [procedure name]
- Error messages with details

## Test the Server

1. **Health Check:**
   ```powershell
   curl http://localhost:5001/health
   ```

2. **Test API:**
   ```powershell
   Invoke-WebRequest -Uri http://localhost:5001/api -Method POST -ContentType "application/json" -Body '{"procedure":"health"}'
   ```











