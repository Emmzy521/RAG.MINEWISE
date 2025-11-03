# Firebase Storage Security Rules Guide

## Current Rule: Admin-Only Uploads

The `storage.rules` file contains security rules for Firebase Storage that restrict uploads to the `/admin/uploads/` path to users with the `role: 'admin'` field in their Firestore user profile.

## Rule Explanation

```javascript
match /admin/uploads/{allPaths=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow delete: if request.auth != null
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### What this does:
- **Path**: `/admin/uploads/{allPaths=**}` - Matches any file path under `/admin/uploads/`
- **Read**: Any authenticated user can read files
- **Write/Upload**: Only users with `role: 'admin'` in their Firestore profile can upload
- **Delete**: Only admin users can delete files

## How to Deploy Rules

```bash
firebase deploy --only storage
```

## Setting Up Admin Users

To make a user an admin, update their Firestore document:

```javascript
// In Firestore Console or via code:
// Collection: users
// Document ID: {userId}
// Fields:
{
  "role": "admin",
  "email": "admin@example.com",
  // ... other user fields
}
```

## Testing Rules

1. **Test as non-admin**: Should fail to upload
2. **Test as admin**: Should succeed
3. **Test unauthenticated**: Should fail

## Additional Rule Patterns

See `storage.rules.example` for more patterns like:
- User-specific folders
- Public read access
- Additional admin-only areas

