#!/bin/bash
PAYLOAD='{"text":"Hello LocalStack"}'

# Encode to base64
PAYLOAD_B64=$(echo -n "$PAYLOAD" | base64)

aws --endpoint-url=http://localhost:4566 lambda invoke \
  --function-name AnalyticsFn \
  --payload "$PAYLOAD_B64" \
  --profile localstack \
  response.json
read