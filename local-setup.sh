#!/bin/bash

# Local Setup Script for Minewise AI RAG Project
# This script installs dependencies and builds the functions package locally

set -e  # Exit on error

echo "🚀 Starting local setup for Minewise AI RAG project..."
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm is not installed."
    echo ""
    echo "Please install pnpm:"
    echo "  npm install -g pnpm"
    echo ""
    echo "Or use corepack (recommended):"
    echo "  corepack enable"
    echo "  corepack prepare pnpm@latest --activate"
    exit 1
fi

echo "✅ pnpm found: $(pnpm --version)"
echo ""

# Step 1: Install all dependencies
echo "📦 Step 1: Installing dependencies..."
pnpm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Step 2: Build the functions package
echo "🔨 Step 2: Building apps/functions package..."
pnpm run --filter apps/functions build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build apps/functions"
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

echo "✨ Local setup complete!"
echo ""
echo "📝 Next steps:"
echo "   - Your TypeScript code is compiled to apps/functions/dist/"
echo "   - You can test locally: cd apps/functions && node dist/server.js"
echo "   - Deploy to Cloud Run: gcloud builds submit --config=cloudbuild.yaml"
echo ""

