# Aggressive Cleanup Script for EBUSY Errors
# This script handles Windows file locking issues during pnpm install

Write-Host "========================================" -ForegroundColor Red
Write-Host "EBUSY Error Fix Script" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

Write-Host "⚠️  IMPORTANT: Close ALL of the following BEFORE continuing:" -ForegroundColor Yellow
Write-Host "   - VS Code (completely exit, check Task Manager)"
Write-Host "   - All terminal windows"
Write-Host "   - File Explorer windows in this project"
Write-Host "   - Any antivirus scans"
Write-Host ""
$confirm = Read-Host "Have you closed EVERYTHING? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Please close all applications and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[1/6] Killing all Node.js processes..." -ForegroundColor Cyan
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name pnpm -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "✅ Done" -ForegroundColor Green

Write-Host ""
Write-Host "[2/6] Stopping Windows Search Indexer for this directory..." -ForegroundColor Cyan
# Stop indexing service temporarily (will restart automatically)
Stop-Service -Name "WSearch" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Done" -ForegroundColor Green

Write-Host ""
Write-Host "[3/6] Waiting for file locks to clear..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
Write-Host "✅ Done" -ForegroundColor Green

Write-Host ""
Write-Host "[4/6] Removing corrupted temporary directories..." -ForegroundColor Cyan

# Remove any _tmp_ directories that pnpm might have left behind
$tmpDirs = Get-ChildItem -Path "node_modules" -Directory -Filter "*_tmp_*" -ErrorAction SilentlyContinue
foreach ($dir in $tmpDirs) {
    Write-Host "  Removing $($dir.Name)..."
    Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue
}

# Also check for corrupted node_modules
if (Test-Path "node_modules") {
    Write-Host "  Removing entire node_modules directory..."
    # Try multiple times with delays
    $retries = 3
    $success = $false
    for ($i = 1; $i -le $retries; $i++) {
        try {
            Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction Stop
            $success = $true
            break
        } catch {
            Write-Host "  Attempt $i failed, waiting and retrying..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    }
    if ($success) {
        Write-Host "✅ node_modules removed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not remove node_modules automatically" -ForegroundColor Yellow
        Write-Host "   You may need to restart your computer and try again" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[5/6] Removing pnpm-lock.yaml..." -ForegroundColor Cyan
Remove-Item -Path "pnpm-lock.yaml" -Force -ErrorAction SilentlyContinue
Write-Host "✅ Done" -ForegroundColor Green

Write-Host ""
Write-Host "[6/6] Cleaning pnpm store..." -ForegroundColor Cyan
pnpm store prune 2>&1 | Out-Null
Write-Host "✅ Done" -ForegroundColor Green

Write-Host ""
Write-Host "Starting fresh pnpm install..." -ForegroundColor Cyan
Write-Host "This may take several minutes..." -ForegroundColor Yellow
Write-Host ""

# Try installing with retries
$maxRetries = 3
for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
    Write-Host "Install attempt $attempt of $maxRetries..." -ForegroundColor Cyan
    
    pnpm install --no-frozen-lockfile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ SUCCESS! Dependencies installed!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        exit 0
    } else {
        if ($attempt -lt $maxRetries) {
            Write-Host "⚠️  Install failed, waiting 10 seconds before retry..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "❌ Installation failed after $maxRetries attempts" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "Try these solutions:" -ForegroundColor Yellow
Write-Host "1. Restart your computer completely"
Write-Host "2. Run this script again after restart"
Write-Host "3. Disable antivirus temporarily during install"
Write-Host "4. Try installing in Safe Mode"
Write-Host ""

# Restart search service
Start-Service -Name "WSearch" -ErrorAction SilentlyContinue

