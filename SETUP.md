# Minewise AI - Setup Instructions

## Project Structure

```
minewise-ai/
├── apps/
│   ├── web/              # React + Vite frontend
│   └── functions/        # Firebase Functions (Gen 2) backend
├── packages/
│   └── rag-core/         # Shared RAG utilities
├── scripts/
│   └── setup.js          # Setup script for environment files
├── firebase.json         # Firebase configuration
├── firestore.rules       # Firestore security rules
└── turbo.json            # Turborepo configuration
```

## Initial Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run setup script:**
   ```bash
   pnpm run setup
   ```
   This creates `.env.local` files in `apps/web/` and `apps/functions/`

3. **Configure environment variables:**
   
   Edit `apps/web/.env.local`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FUNCTIONS_URL=http://localhost:5001/minewise-ai-dev/us-central1/api
   ```

   Edit `apps/functions/.env.local`:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=gpt-4
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX_NAME=minewise-ai
   PINECONE_ENVIRONMENT=your_environment
   ```

4. **Initialize Firebase:**
   ```bash
   firebase login
   firebase use --add  # Select your Firebase project
   ```

5. **Create Pinecone Index:**
   - Go to Pinecone console
   - Create index named `minewise-ai`
   - Dimension: 3072 (for text-embedding-3-large)
   - Metric: cosine

6. **Start development:**
   ```bash
   pnpm run dev
   ```

## Features Implemented

✅ Monorepo structure with PNPM + Turborepo
✅ Firebase Functions Gen 2 backend with tRPC
✅ React frontend with Vite + TypeScript
✅ Tailwind CSS + shadcn/ui components
✅ Firebase Authentication
✅ Document upload (PDF, TXT, DOCX)
✅ RAG pipeline:
   - Document chunking
   - Embedding generation
   - Pinecone indexing
   - Semantic retrieval
   - LLM generation with citations
✅ Pages:
   - Home (/)
   - Upload (/upload)
   - Query (/query)
   - Dashboard (/dashboard)

## Deployment

1. **Build all packages:**
   ```bash
   pnpm run build
   ```

2. **Deploy to Firebase:**
   ```bash
   firebase deploy
   ```

## Notes

- Make sure Firebase project has Authentication, Firestore, and Functions enabled
- Set up Firestore indexes as needed (see `firestore.indexes.json`)
- For production, update `VITE_FUNCTIONS_URL` with your deployed functions URL
