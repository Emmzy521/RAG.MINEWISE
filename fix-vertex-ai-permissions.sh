#!/bin/bash

# 🔧 Fix Vertex AI Permission Errors for Cloud Run
# This script grants necessary Vertex AI permissions to the Cloud Run service account

set -e  # Exit on error

# Configuration
PROJECT_ID="minewise-ai-4a4da"
SERVICE_NAME="api"
REGION="us-central1"

echo "🔧 Fixing Vertex AI permissions for Cloud Run service..."
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Step 1: Detect the Cloud Run service account
echo "📋 Step 1: Detecting Cloud Run service account..."
SERVICE_ACCOUNT=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(spec.template.spec.serviceAccountName)")

if [ -z "$SERVICE_ACCOUNT" ]; then
  echo "⚠️  No custom service account found. Using default Compute Engine service account..."
  SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"
else
  echo "✅ Found service account: $SERVICE_ACCOUNT"
fi

echo ""

# Step 2: Grant Vertex AI User role (includes aiplatform.endpoints.predict permission)
echo "📋 Step 2: Granting Vertex AI User role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.user" \
  --condition=None

echo "✅ Granted roles/aiplatform.user role"
echo ""

# Step 3: Grant Vertex AI Service Agent role (for full access)
echo "📋 Step 3: Granting Vertex AI Service Agent role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.serviceAgent" \
  --condition=None

echo "✅ Granted roles/aiplatform.serviceAgent role"
echo ""

# Step 4: Grant Service Account User role (if needed for impersonation)
echo "📋 Step 4: Granting Service Account User role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountUser" \
  --condition=None

echo "✅ Granted roles/iam.serviceAccountUser role"
echo ""

# Step 5: Verify permissions
echo "📋 Step 5: Verifying permissions..."
echo "Checking IAM bindings for service account: $SERVICE_ACCOUNT"
echo ""

gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT}" \
  --format="table(bindings.role)" \
  | grep -E "(aiplatform|serviceAccount)" || echo "⚠️  No matching roles found (this might be normal if roles were just added)"

echo ""
echo "✅ Permission fix complete!"
echo ""
echo "📝 Summary:"
echo "   Service Account: $SERVICE_ACCOUNT"
echo "   Roles Granted:"
echo "     - roles/aiplatform.user (includes aiplatform.endpoints.predict)"
echo "     - roles/aiplatform.serviceAgent"
echo "     - roles/iam.serviceAccountUser"
echo ""
echo "🔄 Next Steps:"
echo "   1. Wait 1-2 minutes for IAM changes to propagate"
echo "   2. Restart your Cloud Run service if needed:"
echo "      gcloud run services update $SERVICE_NAME --region=$REGION --project=$PROJECT_ID"
echo "   3. Test your API endpoint"
echo ""

