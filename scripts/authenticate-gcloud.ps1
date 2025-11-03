# PowerShell script to authenticate with Google Cloud
# Usage: .\scripts\authenticate-gcloud.ps1

Write-Host "🔐 Google Cloud Authentication Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
try {
    $null = Get-Command gcloud -ErrorAction Stop
} catch {
    Write-Host "❌ Error: gcloud CLI is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Google Cloud SDK:"
    Write-Host "  https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or use Chocolatey (Windows):"
    Write-Host "  choco install gcloudsdk" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Checking current authentication..." -ForegroundColor Cyan
$activeAccount = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null

if ($activeAccount) {
    Write-Host "✅ Currently authenticated as: $activeAccount" -ForegroundColor Green
} else {
    Write-Host "⚠️  No active authentication found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Setting project..." -ForegroundColor Cyan
gcloud config set project minewise-ai-4a4da
$currentProject = gcloud config get-value project 2>$null
Write-Host "✅ Project set to: $currentProject" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Authenticating with gcloud (opens browser)..." -ForegroundColor Cyan
Write-Host "   Follow the prompts in your browser to authenticate" -ForegroundColor Gray
gcloud auth login

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ User authentication successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Authentication failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Setting up application-default credentials..." -ForegroundColor Cyan
Write-Host "   This is required for API calls from your application" -ForegroundColor Gray
gcloud auth application-default login

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Application-default credentials set!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Application-default authentication failed (may already be set)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 5: Verifying authentication..." -ForegroundColor Cyan
$verifiedAccount = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
$verifiedProject = gcloud config get-value project 2>$null

Write-Host ""
Write-Host "✅ Authentication Setup Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "   Account: $verifiedAccount" -ForegroundColor Gray
Write-Host "   Project: $verifiedProject" -ForegroundColor Gray
Write-Host ""

Write-Host "You can now run commands like:" -ForegroundColor Cyan
Write-Host "   - pnpm run create-artifact-registry" -ForegroundColor Yellow
Write-Host "   - pnpm run apply-cors" -ForegroundColor Yellow
Write-Host "   - gcloud artifacts repositories list" -ForegroundColor Yellow
Write-Host ""

