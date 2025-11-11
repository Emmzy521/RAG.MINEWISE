# 🚀 Deployment Setup Complete

## ✅ Current Configuration

- **Firebase Account:** `emmanuel.bwanga@hytel.io`
- **Firebase Project:** `minewise-ai-4a4da` (current)
- **Google Cloud Project:** `minewise-ai-4a4da`
- **Google Cloud Account:** `emmanuel.bwanga@hytel.io`

## 📋 Setup Status

✅ Firebase CLI authenticated  
✅ Firebase project set to `minewise-ai-4a4da`  
✅ Google Cloud project configured  
✅ Google Cloud account set to `emmanuel.bwanga@hytel.io`

## 🔐 Application Default Credentials

For local development and deployment, you may need to set up Application Default Credentials:

```bash
gcloud auth application-default login
```

This will open a browser window. Sign in with `emmanuel.bwanga@hytel.io` and complete the authentication.

**Note:** If you're running this in a non-interactive environment, you can use:

```bash
gcloud auth application-default login --no-launch-browser
```

Then follow the instructions to copy/paste the verification code.

## 🚀 Deployment Commands

### Deploy Everything

```bash
firebase deploy
```

### Deploy Only Functions

```bash
cd functions
pnpm run deploy
# or
firebase deploy --only functions
```

### Deploy Only Hosting (Frontend)

```bash
firebase deploy --only hosting
```

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy Storage Rules

```bash
firebase deploy --only storage
```

## 📝 Pre-Deployment Checklist

Before deploying, make sure:

1. ✅ **Environment Variables Set:**

   - Check `functions/.env.local` has all required variables
   - For production, set environment variables in Firebase Console:
     - Go to Firebase Console > Functions > Configuration
     - Add environment variables there

2. ✅ **Build the Project:**

   ```bash
   # Build functions
   cd functions
   pnpm run build

   # Build frontend
   cd ../apps/web
   pnpm run build
   ```

3. ✅ **Test Locally:**

   ```bash
   # Test backend
   cd functions
   pnpm run dev

   # Test frontend (in another terminal)
   cd apps/web
   pnpm run dev
   ```

4. ✅ **Verify Firebase Project:**
   ```bash
   firebase use
   # Should show: minewise-ai-4a4da (current)
   ```

## 🔧 Environment Variables for Production

Set these in Firebase Console > Functions > Configuration:

- `GOOGLE_CLOUD_PROJECT_ID=minewise-ai-4a4da`
- `OPENAI_API_KEY=your_key` (if using OpenAI)
- Any other required environment variables

## 📍 Project URLs

After deployment:

- **Frontend:** `https://minewise-ai-4a4da.web.app` or `https://minewise-ai-4a4da.firebaseapp.com`
- **Functions:** Check Firebase Console > Functions for the deployed URLs

## 🐛 Troubleshooting

### "Permission Denied" Errors

- Make sure you're logged in: `firebase login`
- Verify project access: `firebase projects:list`
- Check IAM permissions in Google Cloud Console

### "Quota Project" Warnings

- Set quota project: `gcloud auth application-default set-quota-project minewise-ai-4a4da`

### Build Errors

- Make sure all dependencies are installed: `pnpm install`
- Check Node.js version matches (should be 20)
- Clear build cache: `pnpm run clean` (in functions directory)

## 📚 Additional Resources

- Firebase Console: https://console.firebase.google.com/project/minewise-ai-4a4da
- Google Cloud Console: https://console.cloud.google.com/?project=minewise-ai-4a4da
