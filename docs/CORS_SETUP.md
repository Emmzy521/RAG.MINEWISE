# Firebase Storage CORS Configuration

## Overview

This file (`cors-config.json`) contains CORS (Cross-Origin Resource Sharing) configuration for your Firebase Storage bucket. This is required when uploading files from a web browser running on a different origin than your storage bucket.

## File: `cors-config.json`

Contains CORS rules that allow:
- **Local development**: `http://localhost:3000`
- **Production**: `https://minewise-ai-4a4da.web.app`
- **Methods**: GET, PUT, POST, DELETE
- **Headers**: Content-Type, Authorization
- **Cache**: 3600 seconds (1 hour)

## How to Apply CORS Configuration

### Option 1: Using gsutil (Recommended)

1. **Install Google Cloud SDK** (if not already installed):
   ```bash
   # Download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate**:
   ```bash
   gcloud auth login
   ```

3. **Set your project**:
   ```bash
   gcloud config set project minewise-ai-4a4da
   ```

4. **Get your bucket name**:
   ```bash
   # Your bucket name is typically: minewise-ai-4a4da.firebasestorage.app
   # or: minewise-ai-4a4da.appspot.com
   ```

5. **Apply CORS configuration**:
   ```bash
   gsutil cors set cors-config.json gs://minewise-ai-4a4da.firebasestorage.app
   ```
   
   Or if using the default bucket:
   ```bash
   gsutil cors set cors-config.json gs://minewise-ai-4a4da.appspot.com
   ```

### Option 2: Using Firebase Console

Unfortunately, Firebase Console doesn't directly support CORS configuration. You need to use gsutil or the Cloud Storage API.

### Option 3: Using Cloud Storage API

```bash
# Using curl with gcloud auth
gcloud auth print-access-token | \
  curl -X PATCH \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "Content-Type: application/json" \
    -d @cors-config.json \
    "https://storage.googleapis.com/storage/v1/b/minewise-ai-4a4da.firebasestorage.app?fields=cors"
```

## Verify CORS Configuration

After applying, verify the configuration:

```bash
gsutil cors get gs://minewise-ai-4a4da.firebasestorage.app
```

You should see the CORS rules you just set.

## Troubleshooting

### "Failed to fetch" Error

If you still get CORS errors after applying:

1. **Check bucket name**: Make sure you're using the correct bucket name
   - Find it in Firebase Console → Storage → Settings

2. **Clear browser cache**: CORS errors can be cached

3. **Verify origin**: Make sure your dev server is running on exactly `http://localhost:3000`

4. **Check headers**: Ensure your requests include the correct headers

5. **Wait for propagation**: CORS changes can take a few minutes to propagate

### Common Issues

- **Wrong bucket**: Use the bucket name from Firebase Console Storage settings
- **Not authenticated**: Make sure `gcloud auth login` is done
- **Wrong format**: The JSON must be an array of CORS rule objects

## Additional Origins

To add more origins (e.g., staging environment), edit `cors-config.json`:

```json
{
  "origin": [
    "http://localhost:3000",
    "https://minewise-ai-4a4da.web.app",
    "https://staging.yourdomain.com"
  ],
  ...
}
```

Then re-apply with `gsutil cors set`.

