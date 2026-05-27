import { HttpStatus } from "../../constants/statusCodes.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import logger from "../../utils/logger.js";
import { AppError } from "../../utils/appError.js";
import { validateAdminLogin } from "../../validators/adminAuth.validator.js";
import { env } from "../../utils/env.js";
import { AdminAuthErrorMessages } from "../../constants/errorMessages.js";
import { AdminAuthSuccessMessages } from "../../constants/successMessage.js";

export const loginAdmin = asyncHandler(async (req, res) => {
  let { email, password } = req.body;

  const error = validateAdminLogin({ email, password });
  if (error) {
    throw new AppError(HttpStatus.UNAUTHORIZED, error);
  }

  if (email != env.ADMIN_EMAIL || password != env.ADMIN_PASSWORD) {
    throw new AppError(HttpStatus.UNAUTHORIZED, AdminAuthErrorMessages.INVALID_CREDENTIALS);
  }

  req.session.admin = true;
  res.status(HttpStatus.OK).json({
    success: true,
    message: AdminAuthSuccessMessages.LOGIN_SUCCESS,
    redirectUrl: '/admin/dashboard'
  });
});

export const logoutAdmin = (req, res) => {
  try {
    delete req.session.admin;
    res.redirect(`/admin/login?message=${encodeURIComponent(AdminAuthSuccessMessages.LOGOUT_SUCCESS)}&alertType=success`);

  } catch (error) {
    logger.error('ADMIN_LOGOUT_ERROR', error);
  }
};

