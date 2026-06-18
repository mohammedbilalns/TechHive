import logger from "../utils/logger.js";
import crypto from "node:crypto";

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();

  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  logger.debug("request_start", {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.session?.user?._id?.toString?.() || null,
  });

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    const logPayload = {
      requestId,
      method,
      url: originalUrl,
      statusCode,
      duration: `${duration}ms`,
      userId: req.session?.user?._id?.toString?.() || null,
    };

    if (statusCode >= 500) {
      logger.error("request_error", logPayload);
    } else if (statusCode >= 400) {
      logger.warn("request_warn", logPayload);
    } else {
      logger.info("request_success", logPayload);
    }
  });

  next();
};
