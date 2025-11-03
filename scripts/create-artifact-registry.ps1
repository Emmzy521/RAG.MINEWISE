# PowerShell script to create Artifact Registry repository
# Usage: .\scripts\create-artifact-registry.ps1

$REGION = "us-central1"
$REPO = "rag-repo"

Write-Host "🔧 Creating Artifact Registry repository..." -ForegroundColor Cyan
Write-Host "   Region: $REGION" -ForegroundColor Gray
Write-Host "   Repository: $REPO" -ForegroundColor Gray
Write-Host ""

# Check if gcloud is installed
try {
    $null = Get-Command gcloud -ErrorAction Stop
} catch {
    Write-Host "❌ Error: gcloud CLI is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Google Cloud SDK:"
    Write-Host "  https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if authenticated
Write-Host "🔐 Checking authentication..." -ForegroundColor Cyan
$authCheck = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null

if (-not $authCheck) {
    Write-Host "⚠️  Not authenticated. Logging in..." -ForegroundColor Yellow
    gcloud auth login
}

# Set project
Write-Host ""
Write-Host "📋 Setting GCP project..." -ForegroundColor Cyan
gcloud config set project minewise-ai-4a4da

# Enable required API (if not already enabled)
Write-Host "🔌 Enabling Artifact Registry API..." -ForegroundColor Cyan
gcloud services enable artifactregistry.googleapis.com

Write-Host ""
Write-Host "🚀 Creating Artifact Registry repository..." -ForegroundColor Cyan
gcloud artifacts repositories create $REPO `
  --repository-format=docker `
  --location=$REGION `
  --description="Docker repository for Minewise AI RAG application"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Artifact Registry repository created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository details:" -ForegroundColor Cyan
    Write-Host "  Name: $REPO"
    Write-Host "  Location: $REGION"
    Write-Host "  Format: docker"
    Write-Host ""
    Write-Host "📝 Configure Docker authentication:" -ForegroundColor Cyan
    Write-Host "  gcloud auth configure-docker $REGION-docker.pkg.dev" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Failed to create repository" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Repository may already exist - check with: gcloud artifacts repositories list"
    Write-Host "2. Make sure you have the required permissions"
    Write-Host "3. Verify your project ID is correct"
    exit 1
}

