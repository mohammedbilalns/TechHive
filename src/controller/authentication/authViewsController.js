
import { ADMIN_VIEW_PATHS, USER_VIEW_PATHS } from "../../constants/viewPaths.js";

export const renderLoginPage = (req, res) => {
  const { message, alertType } = req.query;
  res.render(USER_VIEW_PATHS.AuthLogin, { message, alertType });
};

export const renderSignupPage = (_req, res) => {
  res.render(USER_VIEW_PATHS.AuthSignup);
};

export const renderAdminLoginPage = (req, res) => {
  const { message, alertType, email } = req.query;
  res.render(ADMIN_VIEW_PATHS.Login, { message, alertType, email });
};
