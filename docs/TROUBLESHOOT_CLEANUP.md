# Troubleshooting Cleanup Errors

## Common Errors and Solutions

### Error: "File is locked" or "EBUSY"

**Solution:**
1. Close ALL VS Code windows completely
2. Close ALL terminal windows (including this one)
3. Open a NEW PowerShell window as Administrator
4. Navigate to your project: `cd "C:\Users\User\RAG PROJECT"`
5. Run the cleanup script again

### Error: "Cannot find pnpm"

**Solution:**
```powershell
npm install -g pnpm
```

Or use corepack:
```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

### Error: "Access Denied" or Permission errors

**Solution:**
1. Run PowerShell as Administrator (Right-click → Run as Administrator)
2. Try the cleanup script again

### Error: Still getting EBUSY after cleanup

**Solution: Manual cleanup steps:**

1. **Kill all Node processes:**
   ```powershell
   Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

2. **Wait a few seconds:**
   ```powershell
   Start-Sleep -Seconds 5
   ```

3. **Manually delete (if needed):**
   - Close VS Code completely
   - Open File Explorer as Administrator
   - Navigate to your project folder
   - Try deleting `node_modules` manually
   - Try deleting `pnpm-lock.yaml` manually

4. **Then run:**
   ```powershell
   pnpm install
   ```

### Quick Manual Cleanup Commands

Run these one by one:

```powershell
# 1. Kill all Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Wait
Start-Sleep -Seconds 3

# 3. Delete node_modules (if it exists)
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Delete pnpm-lock.yaml (if it exists)
Remove-Item -Path "pnpm-lock.yaml" -Force -ErrorAction SilentlyContinue

# 5. Clean workspace node_modules
Get-ChildItem -Path "apps", "packages" -Recurse -Directory -Filter "node_modules" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# 6. Install fresh
pnpm install
```

### Nuclear Option: Restart Computer

If nothing else works:
1. Save all your work
2. Restart your computer
3. After restart, open PowerShell
4. Navigate to project: `cd "C:\Users\User\RAG PROJECT"`
5. Run: `pnpm install`

