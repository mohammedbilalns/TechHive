import { log } from "mercedlogger";
import { HttpStatus } from "../../constants/statusCodes.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/appError.js";
import { validateAdminLogin } from "../../validators/adminAuth.validator.js";
import { env } from "../../utils/env.js";


//---- Admin Login----
const loadLogin = (req, res) => {
  const { message, alertType, email } = req.query
  res.render("admin/login", { message, alertType, email });
};

const verifyLogin = asyncHandler(async (req, res) => {
  let { email, password } = req.body;

  const error = validateAdminLogin({ email, password });
  if (error) {
    throw new AppError(HttpStatus.UNAUTHORIZED, error);
  }

  if (email != env.ADMIN_EMAIL || password != env.ADMIN_PASSWORD) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid credentials');
  }

  req.session.admin = true;
  res.status(HttpStatus.OK).json({
    success: true,
    message: 'Login successful',
    redirectUrl: '/admin/dashboard'
  });
});

const logoutAdmin = (req, res) => {
  try {
    delete req.session.admin;
    res.redirect('/admin/login?message=logged+out+successfully&alertType=success');

  } catch (error) {
    log.red('ADMIN_LOGOUT_ERROR', error);
  }
};

export default {
  loadLogin, verifyLogin, logoutAdmin,
};
