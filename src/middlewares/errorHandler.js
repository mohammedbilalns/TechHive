import logger from "../utils/logger.js";

export const errorMiddleware = (err, req, res, _next) => {
  void _next;
  logger.error("GLOBAL_ERROR");
  logger.error("Name:", err.name);
  logger.error("Message:", err.message);
  logger.error("Stack:", err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.isOperational || statusCode !== 500 ? err.message : "Internal Server Error";
  const prefersJson =
    req.xhr ||
      req.originalUrl?.startsWith("/api/") ||
      req.get("accept")?.includes("application/json");

  if (!prefersJson) {
    return res.status(statusCode).render("somethingWentWrong", {
      fullname: req.session?.user?.fullname || null,
      message,
      alertType: "error",
    });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    error: message,
  });
};
