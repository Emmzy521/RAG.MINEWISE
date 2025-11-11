# Troubleshooting Guide

## Common Errors and Solutions

### 1. "Cannot find package 'express'"

**Problem:** tsx can't resolve express in PNPM workspace with ESM.

**Solutions:**
- Ensure `.npmrc` exists with `shamefully-hoist=true`
- Run `pnpm install` from root directory
- Verify express is installed: `pnpm list express`
- Try: `cd apps/functions && pnpm install`

### 2. TypeScript errors in mammoth.d.ts

**Problem:** Encoding or syntax errors in type definitions.

**Solution:**
- File should be exactly 7 lines with proper syntax
- Check file encoding is UTF-8
- Recreate the file if needed

### 3. Module Resolution Issues

**Problem:** ESM modules not resolving correctly.

**Solution:**
- Check `tsconfig.json` has `"moduleResolution": "node"`
- Ensure `package.json` has `"type": "module"` (for functions)
- Try running with explicit tsconfig: `tsx --tsconfig tsconfig.json watch src/server.ts`

## Quick Fixes

1. **Clean install:**
   ```bash
   pnpm install --force
   ```

2. **Rebuild everything:**
   ```bash
   pnpm run clean
   pnpm install
   pnpm run build
   ```

3. **Check TypeScript compilation:**
   ```bash
   cd packages/rag-core && pnpm run type-check
   cd ../../apps/functions && pnpm run type-check
   ```

## Environment Setup

Make sure you have:
- Node.js 18+ (or 20 as specified)
- PNPM 8.15.0+
- `.npmrc` file with `shamefully-hoist=true`
- All dependencies installed via `pnpm install` from root

