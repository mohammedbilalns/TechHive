import logger from "../utils/logger.js";

export const errorMiddleware = (err, _req, res) => {
  logger.error("GLOBAL_ERROR");
  logger.error("Name:", err.name);
  logger.error("Message:", err.message);
  logger.error("Stack:", err.stack);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
