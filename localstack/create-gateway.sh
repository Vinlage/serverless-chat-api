#!/bin/bash
aws --endpoint-url=http://localhost:4566 apigateway create-rest-api --name ChatAPI --profile localstack

# Variables
API_NAME="ChatAPI"
LAMBDA_NAME="AnalyticsFn"
STAGE_NAME="dev"
ENDPOINT_URL="http://localhost:4566"

# Get REST API ID
API_ID=$(aws --endpoint-url=$ENDPOINT_URL apigateway get-rest-apis \
    --query "items[?name=='$API_NAME'].id" --output text --profile localstack)
echo "API_ID: $API_ID"

# Get Root Resource ID
ROOT_ID=$(aws --endpoint-url=$ENDPOINT_URL apigateway get-resources \
    --rest-api-id $API_ID \
    --query "items[?path=='/'].id" --output text --profile localstack)
echo "ROOT_ID: $ROOT_ID"

# Create /messages resource
RESOURCE_ID=$(aws --endpoint-url=$ENDPOINT_URL apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part messages \
    --query "id" --output text --profile localstack)
echo "RESOURCE_ID: $RESOURCE_ID"

# Create POST method
aws --endpoint-url=$ENDPOINT_URL apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE \
    --profile localstack

# Integrate POST with Lambda
aws --endpoint-url=$ENDPOINT_URL apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:000000000000:function:$LAMBDA_NAME/invocations \
    --profile localstack

# Deploy API
aws --endpoint-url=$ENDPOINT_URL apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE_NAME \
    --profile localstack

# Show final endpoint
echo "API deployed! POST endpoint:"
echo "$ENDPOINT_URL/restapis/$API_ID/$STAGE_NAME/_user_request_/messages"
echo "Press Enter to continue..."
read