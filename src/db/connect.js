import mongoose from "mongoose";
import { log } from "mercedlogger";

let isConnected = false;

export const connectDb = async () => {
  try {
    if (isConnected) return;

    const conn = await mongoose.connect(process.env.MONGOURL, {});

    isConnected = true;

    log.green("DB STATUS", `Connected: ${conn.connection.host}`);
  } catch (error) {
    log.red("DB STATUS", error);
    process.exit(1);
  }
};


export const closeDb = async () => {
  try {
    if (!isConnected) return;

    await mongoose.connection.close(false);
    isConnected = false;

    log.yellow("DB STATUS", "Connection closed successfully");
  } catch (error) {
    log.red("DB STATUS", "Error closing DB connection");
    console.error(error);
  }
};


mongoose.connection.on("connected", () => {
  log.green("MONGOOSE EVENT", "connected");
});

mongoose.connection.on("disconnected", () => {
  log.yellow("MONGOOSE EVENT", "disconnected");
});

mongoose.connection.on("error", (err) => {
  log.red("MONGOOSE EVENT", err);
});
