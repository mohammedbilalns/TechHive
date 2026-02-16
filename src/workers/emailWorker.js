import { Worker } from "bullmq";
import authUtils from "../utils/authUtils.js";
import { log } from "mercedlogger";
import { env } from "../utils/env.js";

const worker = new Worker("emailQueue", async (job) => {
  if(job.name === "sendOTP"){
    await authUtils.sendOTPEmail(job.data.email, job.data.otp)
  }
}, { connection: { host: env.QUEUE_HOST, port: env.QUEUE_PORT } });

worker.on("completed", (job) => {
  log.green("Email worker", `Job ${job.id} has completed`);
});

worker.on("failed", (job, err) => {
  log.red("Email worker", `Job ${job.id} has failed with ${err.message}`);
});

