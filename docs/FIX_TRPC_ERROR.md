# Fix for tRPC Error: "No query-procedure on path [object Object]"

## Problem

The error `No "query"-procedure on path "[object Object]"` occurs when tRPC receives an object where it expects a string path. This typically happens when:

1. The request body is not properly parsed
2. The procedure name is being passed as an object instead of a string
3. The tRPC caller is not properly initialized

## Solution

The production function (`functions/src/index.ts`) has been updated with:

1. **Better request body validation** - Ensures the procedure is always a string
2. **Enhanced error logging** - Logs the exact request body and procedure type
3. **Caller verification** - Verifies the caller is properly created before use
4. **Input validation** - Validates input format before passing to tRPC

## Changes Made

1. Added explicit context object creation
2. Added caller verification before procedure calls
3. Added input validation for query procedure
4. Enhanced error logging throughout

## Next Steps

1. **Rebuild the functions:**
   ```bash
   cd functions
   pnpm run build
   ```

2. **Deploy the updated function:**
   ```bash
   firebase deploy --only functions
   ```

3. **Check the logs** after deployment to see detailed error information if issues persist:
   ```bash
   firebase functions:log --only api
   ```

## Testing

After deployment, test the query endpoint:
```bash
curl -X POST https://api-tkaqtnga6a-uc.a.run.app \
  -H "Content-Type: application/json" \
  -d '{"procedure":"query","input":{"query":"test","topK":5}}'
```

