const Fastify = require("fastify");
const app = Fastify();

app.get("/health", async () => ({ status: "ok" }));

app.listen({ port: 3000 }, (err, address) => {
  if (err) throw err;
  console.log(`Server running at ${address}`);
});
