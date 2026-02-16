import { Queue } from "bullmq";
import { env } from "../utils/env.js";

export const emailQueue = new Queue("emailQueue", {
  connection: {host: env.QUEUE_HOST, port: env.QUEUE_PORT},
});
