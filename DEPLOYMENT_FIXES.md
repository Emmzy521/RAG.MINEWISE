# RAG Deployment Fixes

## TASK 1: Fix Logging IAM Permission

The Cloud Build process needs permission to write logs. Run this command:

```bash
gcloud projects add-iam-policy-binding minewise-ai-4a4da \
  --member="serviceAccount:787603212501-compute@developer.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

This grants the default Compute Engine Service Account the logging writer role.

---

## TASK 2: Fixed Dockerfile

The Dockerfile has been updated to correctly handle the monorepo structure. The key changes:

1. **Build context changed**: The Docker build context is now set to the project root (`.`) instead of `./apps/functions`, allowing access to `pnpm-lock.yaml` and other root files.

2. **COPY paths updated**: All COPY commands now reference files relative to the project root.

3. **Workspace structure preserved**: The Dockerfile now copies the necessary workspace files (`pnpm-workspace.yaml`, `packages/`) to maintain the monorepo structure.

The corrected Dockerfile is in `apps/functions/Dockerfile`.

The `cloudbuild.yaml` has also been updated to:
- Set the build context to `.` (project root)
- Specify the Dockerfile path with `-f apps/functions/Dockerfile`

---

## Verification

After applying these fixes, your Cloud Build should:
1. ✅ Have permission to write logs
2. ✅ Successfully find and copy `pnpm-lock.yaml` from the project root
3. ✅ Build the Docker image correctly

## Next Steps

1. Apply the IAM permission (TASK 1 command)
2. Deploy using Cloud Build:
   ```bash
   gcloud builds submit --config=apps/functions/cloudbuild.yaml
   ```

