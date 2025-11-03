# PowerShell script to apply CORS configuration to Firebase Storage bucket
# Usage: .\scripts\apply-cors.ps1

$PROJECT_ID = "minewise-ai-4a4da"
$BUCKET_NAME = "$PROJECT_ID.firebasestorage.app"
$CORS_CONFIG = "cors-config.json"

Write-Host "🔧 Applying CORS configuration to Firebase Storage..." -ForegroundColor Cyan
Write-Host "   Project: $PROJECT_ID"
Write-Host "   Bucket: $BUCKET_NAME"
Write-Host ""

# Check if gsutil is available
try {
    $null = Get-Command gsutil -ErrorAction Stop
} catch {
    Write-Host "❌ Error: gsutil is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Google Cloud SDK:"
    Write-Host "  https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if CORS config file exists
if (-not (Test-Path $CORS_CONFIG)) {
    Write-Host "❌ Error: $CORS_CONFIG not found" -ForegroundColor Red
    exit 1
}

# Set project
Write-Host "📋 Setting GCP project..." -ForegroundColor Cyan
gcloud config set project $PROJECT_ID

# Apply CORS configuration
Write-Host "🚀 Applying CORS configuration..." -ForegroundColor Cyan
gsutil cors set $CORS_CONFIG "gs://$BUCKET_NAME"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ CORS configuration applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifying configuration..." -ForegroundColor Cyan
    gsutil cors get "gs://$BUCKET_NAME"
} else {
    Write-Host ""
    Write-Host "❌ Failed to apply CORS configuration" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure you're authenticated: gcloud auth login"
    Write-Host "2. Check your bucket name in Firebase Console"
    Write-Host "3. Verify the CORS config JSON is valid"
    exit 1
}

