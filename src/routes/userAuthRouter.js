import { Router } from "express";
import { isUserLoggedIn } from "../middlewares/userauth.js";
import {
  renderLoginPage,
  renderSignupPage,
} from "../controller/authentication/authViewsController.js";
import {
  verifyLogin,
  registerUser,
  verifyOTP,
  authGoogle,
  authGoogleCallback,
  renderForgotPasswordPage,
} from "../controller/authentication/userAuthController.js";
import {
  verifyForgotPasswordOTP,
  processForgotPassword,
  resendForgotPasswordOTP,
  resetPassword,
  applyReferral,
} from "../controller/authentication/userAuthController.js";
import { checkUserSession } from "../middlewares/userauth.js";
import {
  logoutUser,
  resendOTP,
} from "../controller/authentication/userAuthController.js";

const router = Router();

router.post("/apply-referral", checkUserSession, applyReferral);

router.get("/logout", checkUserSession, logoutUser);

router.use(isUserLoggedIn);
router.route("/login").get(renderLoginPage).post(verifyLogin);
router.route("/signup").get(renderSignupPage).post(registerUser);

router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.get("/google", authGoogle);
router.get("/google/callback", authGoogleCallback);
router
  .route("/forgot-password")
  .get(renderForgotPasswordPage)
  .post(processForgotPassword);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOTP);
router.post("/resend-forgot-password-otp", resendForgotPasswordOTP); //TODO: check the usage in client
router.patch("/reset-password", resetPassword); //  reset password

export default router;
