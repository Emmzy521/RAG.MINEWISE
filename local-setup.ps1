# PowerShell Local Setup Script for Minewise AI RAG Project
# This script installs dependencies and builds the functions package locally

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting local setup for Minewise AI RAG project..." -ForegroundColor Cyan
Write-Host ""

# Check if pnpm is installed
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm found: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: pnpm is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install pnpm:" -ForegroundColor Yellow
    Write-Host "  npm install -g pnpm"
    Write-Host ""
    Write-Host "Or use corepack (recommended):" -ForegroundColor Yellow
    Write-Host "  corepack enable"
    Write-Host "  corepack prepare pnpm@latest --activate"
    exit 1
}

Write-Host ""

# Step 1: Install all dependencies
Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Cyan
pnpm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Build the functions package
Write-Host "🔨 Step 2: Building apps/functions package..." -ForegroundColor Cyan
pnpm run --filter apps/functions build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build apps/functions" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully" -ForegroundColor Green
Write-Host ""

Write-Host "✨ Local setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   - Your TypeScript code is compiled to apps/functions/dist/"
Write-Host "   - You can test locally: cd apps/functions; node dist/server.js"
Write-Host "   - Deploy to Cloud Run: gcloud builds submit --config=cloudbuild.yaml"
Write-Host ""

