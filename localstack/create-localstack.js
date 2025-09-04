#!/usr/bin/env node
const { execSync } = require("child_process");
const path = require("path");

const localstackDir = path.join(__dirname, "../localstack");
const endpoint = "http://localhost:4566";
const lambdaZip = path.join(localstackDir, "function.zip");

// Helper to run shell commands cross-platform
function run(cmd) {
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    console.error(`❌ Error running: ${cmd}`);
    process.exit(1);
  }
}

// 1️⃣ Configure AWS profile
console.log("🔧 Configuring AWS profile 'localstack'...");
run('aws configure set aws_access_key_id test --profile localstack');
run('aws configure set aws_secret_access_key test --profile localstack');
run('aws configure set region us-east-1 --profile localstack');

// 2️⃣ Build and start LocalStack
console.log("🚀 Building and starting LocalStack...");
run(`docker-compose build`);
run(`docker-compose up -d`);

// 3️⃣ Wait for LocalStack to initialize
console.log("⏳ Waiting 5 seconds for LocalStack...");
if (process.platform === "win32") {
  run("timeout /t 5 > nul");
} else {
  run("sleep 5");
}

// 4️⃣ Create DynamoDB table
const tableExists = execSync(`aws --endpoint-url=${endpoint} dynamodb list-tables --query "TableNames" --profile localstack --output text`).includes("ChatMessages");

console.log(`DynamoDB Table Exists: ${tableExists}`);

if (!tableExists) {
  console.log("📦 Creating DynamoDB table 'ChatMessages'...");
  run(`aws --endpoint-url=${endpoint} dynamodb create-table \
  --table-name ChatMessages \
  --attribute-definitions AttributeName=MessageId,AttributeType=S \
  --key-schema AttributeName=MessageId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --profile localstack`);
} else {
  console.log("📋 DynamoDB table 'ChatMessages' already exists, skipping creation.");
}

// 5️⃣ List tables
console.log("📋 Listing existing DynamoDB tables...");
run(`aws --endpoint-url=${endpoint} dynamodb list-tables --profile localstack`);

// 6️⃣ Deploy Lambda function
const lambdaExists = execSync(`aws --endpoint-url=${endpoint} lambda list-functions --query "Functions[].FunctionName" --profile localstack --output text`)
  .toString()
  .split("\t")
  .includes("AnalyticsFn");

if (!lambdaExists) {
  console.log("⚡ Deploying Lambda function 'AnalyticsFn'...");
  run(`aws --endpoint-url=${endpoint} lambda create-function \
    --function-name AnalyticsFn \
    --runtime nodejs18.x \
    --role arn:aws:iam::000000000000:role/lambda-role \
    --handler analytics.handler \
    --zip-file "fileb://${lambdaZip}" \
    --profile localstack`);
} else {
  console.log("⚡ Lambda function 'AnalyticsFn' already exists, skipping creation.");
}


// 7️⃣ Create API Gateway
console.log("🌐 Creating REST API 'ChatAPI'...");
run(`aws --endpoint-url=${endpoint} apigateway create-rest-api --name ChatAPI --profile localstack`);

// Get API ID
const apiId = execSync(`aws --endpoint-url=${endpoint} apigateway get-rest-apis \
  --query "items[?name=='ChatAPI'].id" --output text --profile localstack`).toString().trim();
console.log(`API_ID: ${apiId}`);

// Get root resource ID
const rootId = execSync(`aws --endpoint-url=${endpoint} apigateway get-resources \
  --rest-api-id ${apiId} \
  --query "items[?path=='/'].id" --output text --profile localstack`).toString().trim();
console.log(`ROOT_ID: ${rootId}`);

// Create /messages resource
const resourceId = execSync(`aws --endpoint-url=${endpoint} apigateway create-resource \
  --rest-api-id ${apiId} \
  --parent-id ${rootId} \
  --path-part messages \
  --query "id" --output text --profile localstack`).toString().trim();
console.log(`RESOURCE_ID: ${resourceId}`);

// Create POST method
run(`aws --endpoint-url=${endpoint} apigateway put-method \
  --rest-api-id ${apiId} \
  --resource-id ${resourceId} \
  --http-method POST \
  --authorization-type NONE \
  --profile localstack`);

// Integrate POST method with Lambda
run(`aws --endpoint-url=${endpoint} apigateway put-integration \
  --rest-api-id ${apiId} \
  --resource-id ${resourceId} \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:000000000000:function:AnalyticsFn/invocations \
  --profile localstack`);

// Deploy API
const stageName = "dev";
run(`aws --endpoint-url=${endpoint} apigateway create-deployment \
  --rest-api-id ${apiId} \
  --stage-name ${stageName} \
  --profile localstack`);

// 8️⃣ Add permission for API Gateway to invoke Lambda
console.log("🔐 Adding permission for API Gateway to invoke Lambda...");
run(`aws --endpoint-url=${endpoint} lambda add-permission \
  --function-name AnalyticsFn \
  --statement-id apigateway-test-2 \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn arn:aws:execute-api:us-east-1:000000000000:${apiId}/*/POST/messages \
  --profile localstack`);

console.log("✅ API deployed! POST endpoint:");
console.log(`${endpoint}/restapis/${apiId}/${stageName}/_user_request_/messages`);