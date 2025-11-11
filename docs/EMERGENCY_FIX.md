# Emergency Fix for EBUSY Error

## The Problem

You're getting:
```
ERR_PNPM_LINKING_FAILED  Error: EBUSY: resource busy or locked, rename 
'C:\Users\User\RAG PROJECT\node_modules\zod-to-json-schema_tmp_8404' 
-> 'C:\Users\User\RAG PROJECT\node_modules\zod-to-json-schema'
```

This is caused by **corrupted temporary directories** left behind by a failed pnpm install.

## Immediate Fix (Run This Now)

Run this script to fix it:

```powershell
.\fix-ebusy.ps1
```

This script will:
1. Kill all Node processes
2. Stop Windows Search Indexer temporarily
3. Remove ALL `_tmp_` directories
4. Clean up corrupted node_modules
5. Retry pnpm install with error handling

## Manual Fix (If Script Fails)

If the script doesn't work, run these commands **one by one**:

```powershell
# 1. Close VS Code and all terminals FIRST!

# 2. Kill all Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 3. Remove all temporary directories
Get-ChildItem -Path "node_modules" -Directory -Filter "*_tmp_*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force

# 4. Wait for locks to clear
Start-Sleep -Seconds 5

# 5. Remove entire node_modules (if step 3 didn't work)
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# 6. Remove lock file
Remove-Item -Path "pnpm-lock.yaml" -Force -ErrorAction SilentlyContinue

# 7. Install fresh
pnpm install
```

## Nuclear Option

If nothing else works:

```powershell
.\nuclear-cleanup.ps1
```

Then:
```powershell
pnpm install
```

## Prevention

To avoid this in the future:
1. **Always close VS Code** before running `pnpm install`
2. **Close all terminals** before cleanup
3. **Don't interrupt** pnpm install mid-process
4. **Use the cleanup scripts** before major dependency changes

