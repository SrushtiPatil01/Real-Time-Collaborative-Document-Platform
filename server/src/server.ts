import http from "http";
import app from "./app";
import { connectDB } from "./config/db";
import { setupWebSocket } from "./websocket";
import { env } from "./config/env";
import { logger } from "./utils/logger";

async function start() {
  await connectDB();

  const server = http.createServer(app);
  setupWebSocket(server);

  server.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} (${env.nodeEnv})`);
    logger.info(`WebSocket available at ws://localhost:${env.port}/ws`);
  });

  const shutdown = async () => {
    logger.info("Shutting down...");
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});