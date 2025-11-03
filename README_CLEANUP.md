# Cleanup Scripts Guide

## Windows Cleanup Scripts

There are two versions of the cleanup script available:

### Option 1: Batch Script (`.bat`)
**File**: `windows-cleanup-sync.bat`

**Usage in PowerShell:**
```powershell
.\windows-cleanup-sync.bat
```

**Usage in CMD:**
```cmd
windows-cleanup-sync.bat
```

### Option 2: PowerShell Script (`.ps1`)
**File**: `windows-cleanup-sync.ps1`

**Usage in PowerShell:**
```powershell
.\windows-cleanup-sync.ps1
```

If you get an execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run the script again.

## What the Scripts Do

Both scripts perform the same cleanup process:

1. **Warn** you to close VS Code, terminals, and file explorers
2. **Terminate** all Node.js and pnpm processes
3. **Prune** the pnpm store cache
4. **Delete** local `node_modules` and `pnpm-lock.yaml`
5. **Reinstall** all dependencies with `pnpm install`

## Quick Fix for PowerShell Error

If you see this error in PowerShell:
```
The term 'windows-cleanup-sync.bat' is not recognized...
```

**Solution**: Add `.\` before the filename:
```powershell
.\windows-cleanup-sync.bat
```

The `.\` tells PowerShell to execute the file from the current directory.

## Recommended: Use PowerShell Version

The PowerShell version (`.ps1`) provides better error handling and colored output. Use it if you're in PowerShell:

```powershell
.\windows-cleanup-sync.ps1
```

