// Redirects to admin login if no active admin session
export const checkAdminSession = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

// Redirects to admin dashboard if admin is already logged in
export const isAdminLoggedIn = (req, res, next) => {
  if (req.session.admin) {
    res.redirect("/admin/customers");
  } else {
    next();
  }
};
