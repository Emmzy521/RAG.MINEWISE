# 🔧 Fix Vertex AI Permission Errors for Cloud Run

## Problem

Your Cloud Run service is failing with this error:

```
Permission 'aiplatform.endpoints.predict' denied on resource 
'//aiplatform.googleapis.com/projects/minewise-ai-4a4da/locations/us-central1/publishers/google/models/text-embedding-004'
```

This happens because the Cloud Run service account doesn't have the necessary Vertex AI permissions.

## Solution

We've created scripts to automatically fix this issue:

### For Linux/Mac (Bash)

```bash
./fix-vertex-ai-permissions.sh
```

### For Windows (PowerShell)

```powershell
.\fix-vertex-ai-permissions.ps1
```

## What the Scripts Do

1. **Detect the Cloud Run service account** - Finds the service account used by your `api` service
2. **Grant Vertex AI User role** - Includes `aiplatform.endpoints.predict` permission
3. **Grant Vertex AI Service Agent role** - Provides full Vertex AI access
4. **Grant Service Account User role** - Allows service account impersonation if needed
5. **Verify permissions** - Shows the granted roles

## Manual Steps (if scripts don't work)

### Step 1: Find the Service Account

```bash
gcloud run services describe api \
  --region=us-central1 \
  --project=minewise-ai-4a4da \
  --format="value(spec.template.spec.serviceAccountName)"
```

If this returns empty, use the default:
```
minewise-ai-4a4da@appspot.gserviceaccount.com
```

### Step 2: Grant Vertex AI User Role

```bash
gcloud projects add-iam-policy-binding minewise-ai-4a4da \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### Step 3: Grant Vertex AI Service Agent Role

```bash
gcloud projects add-iam-policy-binding minewise-ai-4a4da \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.serviceAgent"
```

### Step 4: Verify Permissions

```bash
gcloud projects get-iam-policy minewise-ai-4a4da \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:YOUR_SERVICE_ACCOUNT" \
  --format="table(bindings.role)"
```

## Required IAM Roles

The following roles are needed for Vertex AI access:

1. **`roles/aiplatform.user`** - Allows calling Vertex AI APIs (includes `aiplatform.endpoints.predict`)
2. **`roles/aiplatform.serviceAgent`** - Full Vertex AI service access
3. **`roles/iam.serviceAccountUser`** - Allows service account impersonation (if needed)

## After Running the Script

1. **Wait 1-2 minutes** for IAM changes to propagate
2. **Restart your Cloud Run service** (optional but recommended):
   ```bash
   gcloud run services update api --region=us-central1 --project=minewise-ai-4a4da
   ```
3. **Test your API endpoint** - The permission error should be resolved

## Troubleshooting

### If permissions still don't work:

1. **Check service account** - Make sure you're using the correct service account
2. **Wait longer** - IAM changes can take up to 5 minutes to propagate
3. **Check project** - Ensure you're working with the correct project ID
4. **Verify roles** - Use the verification step to confirm roles were granted

### Common Issues

- **"Permission denied"** - Wait a few minutes and try again
- **"Service account not found"** - Check the service account name
- **"Project not found"** - Verify the project ID is correct

## Additional Resources

- [Vertex AI IAM Roles](https://cloud.google.com/vertex-ai/docs/general/access-control)
- [Cloud Run Service Accounts](https://cloud.google.com/run/docs/securing/service-identity)
- [IAM Policy Binding](https://cloud.google.com/sdk/gcloud/reference/projects/add-iam-policy-binding)

