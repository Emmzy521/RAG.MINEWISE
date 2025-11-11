# 🔧 Fix Vertex AI Permission Errors for Cloud Run (PowerShell)
# This script grants necessary Vertex AI permissions to the Cloud Run service account

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ID = "minewise-ai-4a4da"
$SERVICE_NAME = "api"
$REGION = "us-central1"

Write-Host "🔧 Fixing Vertex AI permissions for Cloud Run service..." -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID"
Write-Host "Service: $SERVICE_NAME"
Write-Host "Region: $REGION"
Write-Host ""

# Step 1: Detect the Cloud Run service account
Write-Host "📋 Step 1: Detecting Cloud Run service account..." -ForegroundColor Yellow
$SERVICE_ACCOUNT = gcloud run services describe $SERVICE_NAME `
  --region=$REGION `
  --project=$PROJECT_ID `
  --format="value(spec.template.spec.serviceAccountName)"

if ([string]::IsNullOrWhiteSpace($SERVICE_ACCOUNT)) {
  Write-Host "⚠️  No custom service account found. Using default Compute Engine service account..." -ForegroundColor Yellow
  $SERVICE_ACCOUNT = "${PROJECT_ID}@appspot.gserviceaccount.com"
} else {
  Write-Host "✅ Found service account: $SERVICE_ACCOUNT" -ForegroundColor Green
}

Write-Host ""

# Step 2: Grant Vertex AI User role (includes aiplatform.endpoints.predict permission)
Write-Host "📋 Step 2: Granting Vertex AI User role..." -ForegroundColor Yellow
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:${SERVICE_ACCOUNT}" `
  --role="roles/aiplatform.user" `
  --condition=None

Write-Host "✅ Granted roles/aiplatform.user role" -ForegroundColor Green
Write-Host ""

# Step 3: Grant Vertex AI Service Agent role (for full access)
Write-Host "📋 Step 3: Granting Vertex AI Service Agent role..." -ForegroundColor Yellow
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:${SERVICE_ACCOUNT}" `
  --role="roles/aiplatform.serviceAgent" `
  --condition=None

Write-Host "✅ Granted roles/aiplatform.serviceAgent role" -ForegroundColor Green
Write-Host ""

# Step 4: Grant Service Account User role (if needed for impersonation)
Write-Host "📋 Step 4: Granting Service Account User role..." -ForegroundColor Yellow
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:${SERVICE_ACCOUNT}" `
  --role="roles/iam.serviceAccountUser" `
  --condition=None

Write-Host "✅ Granted roles/iam.serviceAccountUser role" -ForegroundColor Green
Write-Host ""

# Step 5: Verify permissions
Write-Host "📋 Step 5: Verifying permissions..." -ForegroundColor Yellow
Write-Host "Checking IAM bindings for service account: $SERVICE_ACCOUNT"
Write-Host ""

gcloud projects get-iam-policy $PROJECT_ID `
  --flatten="bindings[].members" `
  --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT}" `
  --format="table(bindings.role)"

Write-Host ""
Write-Host "✅ Permission fix complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Summary:" -ForegroundColor Cyan
Write-Host "   Service Account: $SERVICE_ACCOUNT"
Write-Host "   Roles Granted:"
Write-Host "     - roles/aiplatform.user (includes aiplatform.endpoints.predict)"
Write-Host "     - roles/aiplatform.serviceAgent"
Write-Host "     - roles/iam.serviceAccountUser"
Write-Host ""
Write-Host "🔄 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Wait 1-2 minutes for IAM changes to propagate"
Write-Host "   2. Restart your Cloud Run service if needed:"
Write-Host "      gcloud run services update $SERVICE_NAME --region=$REGION --project=$PROJECT_ID"
Write-Host "   3. Test your API endpoint"
Write-Host ""

