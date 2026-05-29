import { UserModel } from "../model/userModel.js";
import logger from "../utils/logger.js";

// Verifies user session exists and account is still active; redirects to login otherwise
export const checkUserSession = async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.redirect("/auth/login");
    }

    const user = await UserModel.findById(req.session.user.id);
    if (!user || user.status !== "Active") {
      delete req.session.user;
      return res.redirect(
        "/auth/login?message=Your+account+has+been+blocked&alertType=error",
      );
    }

    next();
  } catch (error) {
    logger.error("Session Check Error:", error);
    delete req.session.user;
    return res.redirect("/auth/login?message=Session+error&alertType=error");
  }
};

// Redirects authenticated users away from login page to home
export const isUserLoggedIn = (req, res, next) => {
  try {
    if (req.session.user) {
      return res.redirect("/home");
    }
    next();
  } catch (error) {
    logger.error("Login Check Error:", error);
    next(error);
  }
};
