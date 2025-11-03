#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Minewise AI...\n');

// Create .env.local files if they don't exist
const envTemplates = {
  'apps/web/.env.local': `# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Functions URL (for local dev, use Firebase emulator)
VITE_FUNCTIONS_URL=http://localhost:5001/minewise-ai-dev/us-central1/api
`,

  'apps/functions/.env.local': `# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=minewise-ai
PINECONE_ENVIRONMENT=your_pinecone_environment
`,
};

Object.entries(envTemplates).forEach(([filePath, content]) => {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create file if it doesn't exist
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Created ${filePath}`);
  } else {
    console.log(`⏭️  ${filePath} already exists, skipping...`);
  }
});

console.log('\n✨ Setup complete!');
console.log('\n📝 Next steps:');
console.log('1. Fill in your environment variables in the .env.local files');
console.log('2. Install dependencies: pnpm install');
console.log('3. Start development: pnpm run dev');
console.log('\n🔧 Required services:');
console.log('- Firebase project with Authentication, Firestore, and Functions enabled');
console.log('- OpenAI API key');
console.log('- Pinecone account and index');


