# Minewise AI

A Retrieval Augmented Generation (RAG) web application that helps users find accurate, up-to-date legal information related to mining regulations and compliance in Zambia.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PNPM >= 8.0.0
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project configured

### Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run setup script:**
   ```bash
   pnpm run setup
   ```
   This will:
   - Install all workspace dependencies
   - Create environment configuration files from templates
   - Initialize Firebase emulators (optional)

3. **Configure environment variables:**
   
   Create `.env.local` files in:
   - `apps/web/.env.local` - Frontend environment variables
   - `functions/.env.local` - Backend/Functions environment variables

   Required variables:
   ```env
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Pinecone
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX_NAME=minewise-ai
   PINECONE_ENVIRONMENT=your_pinecone_environment
   
   # Firebase (these are usually auto-detected)
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

4. **Start development servers:**
   ```bash
   pnpm run dev
   ```

## 📁 Project Structure

```
minewise-ai/
├── apps/
│   ├── web/              # React + Vite frontend
│   └── functions/        # Firebase Functions (Gen 2) backend
├── packages/
│   └── rag-core/         # Shared RAG utilities (chunking, embeddings, etc.)
├── firebase.json         # Firebase configuration
├── turbo.json            # Turborepo configuration
└── pnpm-workspace.yaml   # PNPM workspace configuration
```

## 🛠️ Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Firebase Functions (Node.js Gen 2) + tRPC
- **Database:** Firestore + Pinecone (vector DB)
- **Authentication:** Firebase Auth
- **LLM:** OpenAI GPT-4 / Gemini 1.5 Pro via LangChain

## 📚 Features

- 📄 **Document Upload**: Upload mining-related legal PDFs or text documents
- 🔍 **Semantic Search**: Query legal documents using natural language
- 🤖 **AI-Generated Answers**: Get accurate responses with source citations
- 📊 **Dashboard**: View analytics and document statistics
- 🔐 **Authentication**: Secure user authentication via Firebase Auth

## 🚢 Deployment

```bash
pnpm run build
firebase deploy
```

## 📝 License

MIT


