import { log } from "mercedlogger";

export const errorMiddleware = (err, _req, res, _next) => {
  log.red("GLOBAL_ERROR");
  log.red("Name:", err.name);
  log.red("Message:", err.message);
  log.red("Stack:", err.stack);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
