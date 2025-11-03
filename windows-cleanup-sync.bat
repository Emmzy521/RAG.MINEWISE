@echo off
REM Windows Cleanup and Dependency Synchronization Script
REM This script performs a comprehensive cleanup and reinstall of dependencies

setlocal enabledelayedexpansion

echo ========================================
echo Windows Cleanup and Sync Script
echo ========================================
echo.

REM Step 1: Print warning message
echo [STEP 1/5] WARNING: Close all applications using project files
echo ----------------------------------------------------------------
echo.
echo Please close ALL of the following BEFORE proceeding:
echo   - All VS Code windows open in this project
echo   - All terminal windows (PowerShell, CMD, Git Bash, etc.)
echo   - All File Explorer windows open in this project directory
echo   - Any other applications accessing files in this project
echo.
set /p continue="Have you closed all applications? (Y/N): "
if /i not "%continue%"=="Y" (
    echo.
    echo Script cancelled. Please close all applications and try again.
    pause
    exit /b 1
)
echo.

REM Step 2: Forcefully terminate Node.js processes
echo [STEP 2/5] Terminating Node.js and pnpm processes...
echo ----------------------------------------------------------------
echo.
taskkill /F /IM node.exe /T >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Terminated Node.js processes
) else (
    echo ℹ️  No Node.js processes found (or already terminated)
)

REM Also try to kill pnpm processes if they exist
taskkill /F /IM pnpm.exe /T >nul 2>&1
taskkill /F /IM pnpm.cmd /T >nul 2>&1

echo ✅ Process termination complete
echo.
timeout /t 2 /nobreak >nul

REM Step 3: Prune pnpm store
echo [STEP 3/5] Pruning pnpm store cache...
echo ----------------------------------------------------------------
echo.
pnpm store prune
if %errorlevel% neq 0 (
    echo ⚠️  Warning: pnpm store prune encountered an error
    echo    Continuing anyway...
) else (
    echo ✅ pnpm store pruned successfully
)
echo.

REM Step 4: Delete node_modules and pnpm-lock.yaml
echo [STEP 4/5] Removing local node_modules and pnpm-lock.yaml...
echo ----------------------------------------------------------------
echo.

REM Delete node_modules directory
if exist "node_modules" (
    echo Removing node_modules directory...
    rd /s /q "node_modules" >nul 2>&1
    if exist "node_modules" (
        echo ❌ Failed to delete node_modules - it may be locked by another process
        echo    Please manually delete it after closing all applications
    ) else (
        echo ✅ Deleted node_modules directory
    )
) else (
    echo ℹ️  node_modules directory not found (already deleted)
)

REM Delete pnpm-lock.yaml
if exist "pnpm-lock.yaml" (
    echo Removing pnpm-lock.yaml...
    del /f /q "pnpm-lock.yaml" >nul 2>&1
    if exist "pnpm-lock.yaml" (
        echo ❌ Failed to delete pnpm-lock.yaml - it may be locked by another process
    ) else (
        echo ✅ Deleted pnpm-lock.yaml
    )
) else (
    echo ℹ️  pnpm-lock.yaml not found (already deleted)
)

REM Also clean up workspace node_modules
echo.
echo Cleaning up workspace node_modules directories...
for /d %%d in (apps\*\node_modules packages\*\node_modules) do (
    if exist "%%d" (
        echo Removing %%d...
        rd /s /q "%%d" >nul 2>&1
    )
)

echo ✅ Cleanup complete
echo.
timeout /t 2 /nobreak >nul

REM Step 5: Install dependencies
echo [STEP 5/5] Installing dependencies with pnpm...
echo ----------------------------------------------------------------
echo.
echo This may take several minutes. Please wait...
echo.

pnpm install

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✅ SUCCESS: Dependencies installed successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo   - Your pnpm-lock.yaml has been regenerated
    echo   - All dependencies are now synchronized
    echo   - You can now run: pnpm run build
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ ERROR: pnpm install failed
    echo ========================================
    echo.
    echo Troubleshooting:
    echo   1. Make sure all applications are closed
    echo   2. Try running this script again
    echo   3. Check your internet connection
    echo   4. Verify pnpm is installed: pnpm --version
    echo.
    pause
    exit /b 1
)

echo.
pause

