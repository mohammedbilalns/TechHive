import { Worker } from "bullmq";
import authUtils from "../utils/authUtils.js";
import { env } from "../utils/env.js";
import logger from "../utils/logger.js";

const worker = new Worker("emailQueue", async (job) => {
  if(job.name === "sendOTP"){
    await authUtils.sendOTPEmail(job.data.email, job.data.otp)
  }
}, { connection: { host: env.QUEUE_HOST, port: env.QUEUE_PORT } });

worker.on("completed", (job) => {
  logger.info("Email worker", `Job ${job.id} has completed`);
});

worker.on("failed", (job, err) => {
  logger.error("Email worker", `Job ${job.id} has failed with ${err.message}`);
});

