
export const renderLoginPage = (req, res) => {
  const { message, alertType } = req.query;
  res.render('user/auth/login', { message, alertType });
};

export const renderSignupPage = (_req, res) => {
  res.render('user/auth/signup');
};

export const renderAdminLoginPage = (req, res) => {
  const { message, alertType, email } = req.query;
  res.render("admin/login", { message, alertType, email });
};
