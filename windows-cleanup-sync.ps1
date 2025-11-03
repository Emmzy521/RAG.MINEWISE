# PowerShell Cleanup and Dependency Synchronization Script
# This script performs a comprehensive cleanup and reinstall of dependencies

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Windows Cleanup and Sync Script (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Print warning message
Write-Host "[STEP 1/5] WARNING: Close all applications using project files" -ForegroundColor Yellow
Write-Host "---------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Please close ALL of the following BEFORE proceeding:" -ForegroundColor Yellow
Write-Host "  - All VS Code windows open in this project"
Write-Host "  - All terminal windows (PowerShell, CMD, Git Bash, etc.)"
Write-Host "  - All File Explorer windows open in this project directory"
Write-Host "  - Any other applications accessing files in this project"
Write-Host ""

$continue = Read-Host "Have you closed all applications? (Y/N)"
if ($continue -ne "Y" -and $continue -ne "y") {
    Write-Host ""
    Write-Host "Script cancelled. Please close all applications and try again." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Forcefully terminate Node.js processes
Write-Host "[STEP 2/5] Terminating Node.js and pnpm processes..." -ForegroundColor Cyan
Write-Host "---------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Terminated Node.js processes" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No Node.js processes found (or already terminated)" -ForegroundColor Gray
}

# Also try to kill pnpm processes if they exist
Get-Process -Name "pnpm" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "pnpm.cmd" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "✅ Process termination complete" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# Step 3: Prune pnpm store
Write-Host "[STEP 3/5] Pruning pnpm store cache..." -ForegroundColor Cyan
Write-Host "---------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

try {
    pnpm store prune
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ pnpm store pruned successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Warning: pnpm store prune encountered an error" -ForegroundColor Yellow
        Write-Host "   Continuing anyway..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Warning: pnpm store prune encountered an error" -ForegroundColor Yellow
    Write-Host "   Continuing anyway..." -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Delete node_modules and pnpm-lock.yaml
Write-Host "[STEP 4/5] Removing local node_modules and pnpm-lock.yaml..." -ForegroundColor Cyan
Write-Host "---------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

# Delete node_modules directory
if (Test-Path "node_modules") {
    Write-Host "Removing node_modules directory..."
    try {
        Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction Stop
        Write-Host "✅ Deleted node_modules directory" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to delete node_modules - it may be locked by another process" -ForegroundColor Red
        Write-Host "   Please manually delete it after closing all applications" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  node_modules directory not found (already deleted)" -ForegroundColor Gray
}

# Delete pnpm-lock.yaml
if (Test-Path "pnpm-lock.yaml") {
    Write-Host "Removing pnpm-lock.yaml..."
    try {
        Remove-Item -Path "pnpm-lock.yaml" -Force -ErrorAction Stop
        Write-Host "✅ Deleted pnpm-lock.yaml" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to delete pnpm-lock.yaml - it may be locked by another process" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️  pnpm-lock.yaml not found (already deleted)" -ForegroundColor Gray
}

# Also clean up workspace node_modules
Write-Host ""
Write-Host "Cleaning up workspace node_modules directories..." -ForegroundColor Cyan

$workspacePaths = @(
    "apps\*\node_modules",
    "packages\*\node_modules"
)

foreach ($pattern in $workspacePaths) {
    $dirs = Get-ChildItem -Path $pattern -Directory -ErrorAction SilentlyContinue
    foreach ($dir in $dirs) {
        if (Test-Path $dir.FullName) {
            Write-Host "Removing $($dir.Name)..."
            Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# Step 5: Install dependencies
Write-Host "[STEP 5/5] Installing dependencies with pnpm..." -ForegroundColor Cyan
Write-Host "---------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "This may take several minutes. Please wait..." -ForegroundColor Yellow
Write-Host ""

try {
    pnpm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ SUCCESS: Dependencies installed successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  - Your pnpm-lock.yaml has been regenerated"
        Write-Host "  - All dependencies are now synchronized"
        Write-Host "  - You can now run: pnpm run build"
        Write-Host ""
    } else {
        throw "pnpm install failed"
    }
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ ERROR: pnpm install failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure all applications are closed"
    Write-Host "  2. Try running this script again"
    Write-Host "  3. Check your internet connection"
    Write-Host "  4. Verify pnpm is installed: pnpm --version"
    Write-Host ""
    exit 1
}

Write-Host ""
Read-Host "Press Enter to exit"

