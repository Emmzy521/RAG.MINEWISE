# 🔐 Firebase Authentication Setup Guide

## Error: `auth/configuration-not-found`

This error means Firebase Authentication is not enabled or configured in your Firebase project.

## Steps to Enable Firebase Authentication

### 1. Go to Firebase Console
1. Visit: https://console.firebase.google.com/
2. Select your project: **minewise-ai-4a4da**

### 2. Enable Authentication
1. In the left sidebar, click **"Authentication"**
2. If you see "Get Started", click it
3. If Authentication is already enabled, you'll see the "Users" tab

### 3. Enable Email/Password Provider
1. Click on the **"Sign-in method"** tab
2. Find **"Email/Password"** in the list
3. Click on it
4. Toggle **"Enable"** to ON
5. Optionally enable **"Email link (passwordless sign-in)"** if you want
6. Click **"Save"**

### 4. Verify Configuration
After enabling, your authentication should work. The sign-in methods page should show:
- ✅ Email/Password: **Enabled**

## Additional Security Rules (Optional)

For production, you may want to configure:
- **Authorized domains** - Add your domain to allowed origins
- **Password requirements** - Set minimum password strength
- **Email verification** - Require email verification before sign-in

## Testing

After enabling Authentication:
1. Restart your dev server (if running)
2. Try signing up with a new email/password
3. The error should be resolved

## Troubleshooting

If you still get errors after enabling:
- Make sure you saved the changes in Firebase Console
- Wait a few seconds for changes to propagate
- Clear browser cache and try again
- Check Firebase Console → Authentication → Users to see if the account was created despite the error

