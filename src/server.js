const Fastify = require("fastify");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const app = Fastify();

const dynamo = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  accessKeyId: "test",
  secretAccessKey: "test",
});

app.get("/health", async () => ({ status: "ok" }));

app.post("/messages", async (req, res) => {
  const message = { MessageId: uuidv4(), text: req.body.text, createdAt: Date.now() };
  await dynamo.put({ TableName: "ChatMessages", Item: message }).promise();
  return message;
});

app.get("/messages", async () => {
  const data = await dynamo.scan({ TableName: "ChatMessages" }).promise();
  return data.Items;
});

app.listen({ port: 3000 }, (err, address) => {
  if (err) throw err;
  console.log(`Server running at ${address}`);
});
