import logger from "../utils/logger.js";

export const requestLogger = (
	req,
	res,
	next,
) => {
	const start = Date.now();


	res.on("finish", () => {
		const duration = Date.now() - start;
		const { method, originalUrl } = req;
		const { statusCode } = res;

		const logPayload = {
			method,
			url: originalUrl,
			statusCode,
			duration: `${duration}ms`,
		};

		if (statusCode >= 500) {
			logger.error( "request_error", logPayload);
		} else if (statusCode >= 400) {
			logger.warn( "request_warn", logPayload);
		} else {
			logger.info( "request_success", logPayload);
		}
	});

		next();
};
