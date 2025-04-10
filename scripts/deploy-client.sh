#!/bin/bash

# Build the client
echo "Building client..."
cd client
npm run build

# Sync with S3
echo "Syncing with S3..."
aws s3 sync dist/ s3://crustysocks-client --delete

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

echo "Deployment complete!"
