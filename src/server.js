import http from "http";
import app from "./app.js";
import { connectDb, closeDb } from "./db/connect.js";
import logger from "./utils/logger.js";
import { env } from "./utils/env.js";

const PORT = env.PORT

const server = http.createServer(app);

let isShuttingDown = false;

const startServer = async () => {
  try {
    await connectDb();

    server.listen(PORT, () => {
      logger.info(`Server running on port`, PORT);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! Shutting down...");
  console.error(err);

  server.close(() => {
    process.exit(1);
  });
});

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received. Closing server gracefully...`);

  const forceExit = setTimeout(() => {
    logger.error("Shutdown timed out. Forcing exit...");
    process.exit(1);
  }, 10000);

  server.closeAllConnections();
  server.close(async () => {
    clearTimeout(forceExit);
    console.log("HTTP server closed.");

    try {
      await closeDb()
      logger.info("DB_CLOSE_STATUS", "Closed");
      process.exit(0);
    } catch (error) {
      logger.error("DB_CLOSE_ERROR", error);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
