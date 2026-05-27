import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { env } from "../utils/env.js";

let isConnected = false;

export const connectDb = async () => {
  try {
    if (isConnected) return;

    const conn = await mongoose.connect(env.MONGODB_URI, {});

    isConnected = true;

    logger.info("DB STATUS", `Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error("DB STATUS", error);
    process.exit(1);
  }
};

export const closeDb = async () => {
  try {
    if (!isConnected) return;

    await mongoose.connection.close(false);
    isConnected = false;

    logger.warn("DB STATUS", "Connection closed successfully");
  } catch (error) {
    logger.error("DB STATUS", "Error closing DB connection");
    console.error(error);
  }
};

mongoose.connection.on("connected", () => {
  logger.info("MONGOOSE EVENT", "connected");
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MONGOOSE EVENT", "disconnected");
});

mongoose.connection.on("error", (err) => {
  logger.error("MONGOOSE EVENT", err);
});
