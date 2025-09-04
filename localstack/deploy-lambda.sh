#!/bin/bash
aws --endpoint-url=http://localhost:4566 lambda create-function \
  --function-name AnalyticsFn \
  --runtime nodejs18.x \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --handler analytics.handler \
  --zip-file fileb://function.zip \
  --profile localstack