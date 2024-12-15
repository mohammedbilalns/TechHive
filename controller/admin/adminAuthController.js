import { log } from "mercedlogger";
import { configDotenv } from "dotenv";
configDotenv()



//---- Admin Login----
const loadLogin = (req, res) => {

  const message = req.query.message
  const alertType = req.query.alertType
  const email = req.query.email
  res.render("admin/login", { message, alertType, email })
}

const verifyLogin = async (req, res) => {
  try {
    let { email, password } = req.body
    email = email.trim()
    password = password.trim()
    if (email != process.env.ADMIN_EMAIL || password != process.env.ADMIN_PASSWORD) {
      return res.redirect(`/admin/login?message=Invalid+credentials&alertType=error&email=${email}`)
    }

    req.session.admin = true
    res.redirect('/admin/customers')
  } catch (error) {
    log.red("LOGIN ERROR", error)
    res.render('admin/login', { message: "Something went wrong", alertType: "error" })
  }
}

const logoutAdmin = (req, res) => {
  try {
    delete req.session.admin
    res.redirect('/admin/login?message=logged+out+successfully&alertType=success');
  } catch (error) {
    log.red('ADMIN_LOGOUT_ERROR', error)
  }

}



export default {
  loadLogin, verifyLogin, logoutAdmin,
}
