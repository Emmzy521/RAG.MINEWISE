# Nuclear Option: Complete Cleanup
# Use this if fix-ebusy.ps1 doesn't work
# WARNING: This will delete ALL node_modules everywhere in the project

Write-Host "========================================" -ForegroundColor Red
Write-Host "NUCLEAR CLEANUP - Complete Reset" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️  WARNING: This will delete:" -ForegroundColor Yellow
Write-Host "   - ALL node_modules directories"
Write-Host "   - pnpm-lock.yaml"
Write-Host "   - All temporary pnpm directories"
Write-Host ""
$confirm = Read-Host "Are you SURE? (type YES to continue)"
if ($confirm -ne "YES") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Killing all processes..." -ForegroundColor Cyan
taskkill /F /IM node.exe /T 2>$null
taskkill /F /IM pnpm.exe /T 2>$null
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Removing ALL node_modules directories..." -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Directory -Filter "node_modules" -ErrorAction SilentlyContinue | 
    ForEach-Object {
        Write-Host "  Removing $($_.FullName)..."
        Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }

Write-Host ""
Write-Host "Removing ALL _tmp_ directories..." -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Directory -Filter "*_tmp_*" -ErrorAction SilentlyContinue | 
    ForEach-Object {
        Write-Host "  Removing $($_.FullName)..."
        Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }

Write-Host ""
Write-Host "Removing lock files..." -ForegroundColor Cyan
Remove-Item -Path "pnpm-lock.yaml" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Recurse -Filter "pnpm-lock.yaml" -ErrorAction SilentlyContinue | 
    Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Clearing pnpm store..." -ForegroundColor Cyan
pnpm store prune 2>&1 | Out-Null

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run: pnpm install" -ForegroundColor Cyan

