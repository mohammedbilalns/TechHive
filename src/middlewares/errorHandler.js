import logger from "../utils/logger.js";

export const errorMiddleware = (err, req, res, _next) => {
  void _next;
  logger.error("GLOBAL_ERROR", {
    requestId: req.requestId || req.res?.locals?.requestId || null,
    method: req.method,
    url: req.originalUrl,
    statusCode: err.statusCode || 500,
    name: err.name,
    message: err.message,
    code: err.code,
    field: err.field,
    storageErrors: err.storageErrors,
    stack: err.stack,
    contentType: req.headers["content-type"],
  });

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
