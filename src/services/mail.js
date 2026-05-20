import { env } from "../utils/env.js";
import { BrevoClient } from "@getbrevo/brevo";
import logger from "../utils/logger.js";

const brevo = new BrevoClient({
  apiKey: env.BREVO_API_KEY,
});

const maskSecret = (value) => {
  if (!value) return "missing";
  if (value.length <= 8) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
};

const serializeError = (error) => {
  if (!error) return null;

  return {
    name: error.name,
    message: error.message,
    code: error.code,
    status: error.status,
    stack: error.stack,
    cause: error.cause,
    response: error.response,
    body: error.body,
    details: error.details,
    errors: error.errors,
  };
};

export const sendOTPEmail = async (email, otp) => {
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    logger.error("OTP EMAIL CONFIG", {
      hasApiKey: Boolean(env.BREVO_API_KEY),
      senderEmail: env.BREVO_SENDER_EMAIL || "missing",
      senderName: env.BREVO_SENDER_NAME || "TechHive",
    });
    throw new Error("Brevo email configuration is missing");
  }

  const payload = {
    subject: "Your OTP Code For TechHive",
    textContent: `Your OTP is ${otp}. It will expire in 1 minute.`,
    sender: {
      email: env.BREVO_SENDER_EMAIL,
      name: env.BREVO_SENDER_NAME || "TechHive",
    },
    to: [{ email }],
  };

  try {
    logger.debug("OTP EMAIL ATTEMPT", {
      recipient: email,
      senderEmail: payload.sender.email,
      senderName: payload.sender.name,
      apiKeyPreview: maskSecret(env.BREVO_API_KEY),
    });

    const response = await brevo.transactionalEmails.sendTransacEmail(payload);

    logger.info("OTP STATUS", `OTP sent successfully to ${email}`);
    logger.debug("OTP EMAIL RESPONSE", {
      recipient: email,
      messageId: response?.messageId,
      response,
    });
    return response;
  } catch (error) {
    logger.error("OTP EMAIL FAILURE", {
      recipient: email,
      senderEmail: payload.sender.email,
      senderName: payload.sender.name,
      apiKeyPreview: maskSecret(env.BREVO_API_KEY),
      error: serializeError(error),
    });
    throw error;
  }
};
