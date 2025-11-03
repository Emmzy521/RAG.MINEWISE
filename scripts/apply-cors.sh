#!/bin/bash

# Script to apply CORS configuration to Firebase Storage bucket
# Usage: ./scripts/apply-cors.sh

PROJECT_ID="minewise-ai-4a4da"
BUCKET_NAME="${PROJECT_ID}.firebasestorage.app"
CORS_CONFIG="cors-config.json"

echo "🔧 Applying CORS configuration to Firebase Storage..."
echo "   Project: $PROJECT_ID"
echo "   Bucket: $BUCKET_NAME"
echo ""

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo "❌ Error: gsutil is not installed."
    echo ""
    echo "Please install Google Cloud SDK:"
    echo "  https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if CORS config file exists
if [ ! -f "$CORS_CONFIG" ]; then
    echo "❌ Error: $CORS_CONFIG not found"
    exit 1
fi

# Set project
echo "📋 Setting GCP project..."
gcloud config set project $PROJECT_ID

# Apply CORS configuration
echo "🚀 Applying CORS configuration..."
gsutil cors set $CORS_CONFIG gs://$BUCKET_NAME

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ CORS configuration applied successfully!"
    echo ""
    echo "Verifying configuration..."
    gsutil cors get gs://$BUCKET_NAME
else
    echo ""
    echo "❌ Failed to apply CORS configuration"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure you're authenticated: gcloud auth login"
    echo "2. Check your bucket name in Firebase Console"
    echo "3. Verify the CORS config JSON is valid"
    exit 1
fi

