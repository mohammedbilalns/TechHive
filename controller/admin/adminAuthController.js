import { log } from "mercedlogger";
import { configDotenv } from "dotenv";
configDotenv();

//---- Admin Login----
const loadLogin = (req, res) => {

  const message = req.query.message;
  const alertType = req.query.alertType;
  const email = req.query.email;
  res.render("admin/login", { message, alertType, email });

};

const verifyLogin = async (req, res) => {
  try {

    let { email, password } = req.body;
    email = email.trim();
    password = password.trim();

    if (!email) {
      return res.status(401).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!password) {
      return res.status(401).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (email != process.env.ADMIN_EMAIL || password != process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    req.session.admin = true;
    res.status(200).json({
      success: true,
      message: 'Login successful',
      redirectUrl: '/admin/dashboard'
    });

  } catch (error) {
    log.red("LOGIN ERROR", error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
};

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
