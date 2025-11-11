# TASK 1: Fix Logging IAM Permission

## Command to Grant Logging Permission

Run this command to grant the `roles/logging.logWriter` role to the default Compute Engine Service Account:

```bash
gcloud projects add-iam-policy-binding minewise-ai-4a4da \
  --member="serviceAccount:787603212501-compute@developer.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

This will allow Cloud Build to write logs during the build process.

## Verification

After running the command, verify the permission was granted:

```bash
gcloud projects get-iam-policy minewise-ai-4a4da \
  --flatten="bindings[].members" \
  --filter="bindings.members:787603212501-compute@developer.gserviceaccount.com"
```

