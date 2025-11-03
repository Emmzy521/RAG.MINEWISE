# Quick Cleanup Script - Simplified Version
# Run this if the main script has issues

Write-Host "Quick Cleanup Script" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

# Kill Node processes
Write-Host "Killing Node.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Remove node_modules and lock file
Write-Host "Removing node_modules and pnpm-lock.yaml..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Removed node_modules" -ForegroundColor Green
}

if (Test-Path "pnpm-lock.yaml") {
    Remove-Item -Path "pnpm-lock.yaml" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Removed pnpm-lock.yaml" -ForegroundColor Green
}

# Clean workspace node_modules
Get-ChildItem -Path "apps", "packages" -Recurse -Directory -Filter "node_modules" -ErrorAction SilentlyContinue | 
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Running pnpm install..." -ForegroundColor Yellow
pnpm install

Write-Host ""
Write-Host "Done!" -ForegroundColor Green

