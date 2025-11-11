# Fixing "Failed to fetch" Error

## Quick Fix Steps

### 1. Restart the Backend Server

The server needs to be restarted to pick up the CORS changes:

1. **Stop the current server** (press `Ctrl+C` in the terminal where `pnpm dev` is running)

2. **Restart it:**
   ```bash
   cd apps/functions
   pnpm dev
   ```

### 2. Check Browser Console

Open browser console (F12) and look for:
- Network errors (red in Network tab)
- CORS errors (blocked by CORS policy)
- The console logs showing the API request

### 3. Verify Frontend is Using Correct URL

Check that the frontend is calling `http://localhost:5001/api`:
- Open browser console (F12)
- Look for: `🌐 API Request: { endpoint: "http://localhost:5001/api", ... }`

### 4. Test the Connection

Try making a query again after restarting the server.

## What Changed

1. **CORS Configuration**: Updated to allow all origins (`origin: true`)
2. **Error Handling**: Better error messages for "Failed to fetch"
3. **Logging**: Added detailed logging to help debug

## If Still Getting "Failed to fetch"

Check these:

1. **Is the server running?**
   ```bash
   curl http://localhost:5001/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Check browser console (F12)**:
   - Look in **Console** tab for errors
   - Look in **Network** tab to see if the request is being made
   - Check if request shows as "blocked" or "failed"

3. **Common Issues**:
   - **Browser blocking mixed content**: If frontend is HTTPS but backend is HTTP
   - **Firewall/antivirus**: Blocking localhost connections
   - **Port conflict**: Another app using port 5001

4. **Try accessing directly**:
   - Open: `http://localhost:5001/health` in browser
   - Should show: `{"status":"ok","timestamp":"..."}`

## Expected Behavior

After restarting, when you make a query:
- **Browser console** should show: `🌐 API Request: ...`
- **Backend terminal** should show: `📥 Received API request: POST /api`
- Request should complete successfully

Try restarting the server and let me know what you see in the browser console!



