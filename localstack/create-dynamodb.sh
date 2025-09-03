#!/bin/bash
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name ChatMessages \
  --attribute-definitions AttributeName=MessageId,AttributeType=S \
  --key-schema AttributeName=MessageId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --profile localstack