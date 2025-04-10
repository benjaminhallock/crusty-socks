#!/bin/bash

# Initialize Elastic Beanstalk if not already done
if [ ! -d .elasticbeanstalk ]; then
  eb init crustysocks --platform "Node.js 18" --region us-east-1
fi

# Deploy to Elastic Beanstalk
echo "Deploying to Elastic Beanstalk..."
eb deploy

echo "Server deployment complete!"
