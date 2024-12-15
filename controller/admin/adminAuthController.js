import { log } from "mercedlogger";
import { configDotenv } from "dotenv";
import userSchema from "../../model/userModel.js";

configDotenv()



//---- Admin Login----
const loadLogin =  (req, res) => {

    const message = req.query.message 
    const alertType = req.query.alertType
    const email = req.query.email 
    res.render("admin/login", {message, alertType, email})
}

const verifyLogin = async (req,res)=>{
    try{
        let {email, password} = req.body
        email = email.trim()
        password = password.trim()
        if(email != process.env.ADMIN_EMAIL || password != process.env.ADMIN_PASSWORD){
            return res.redirect(`/admin/login?message=Invalid+credentials&alertType=error&email=${email}`)
        }

        req.session.admin = true 
        res.redirect('/admin/customers')
    }catch(error){
        log.red("LOGIN ERROR", error)
        res.render('admin/login', {message:"Something went wrong", alertType:"error"})
    }
}

const logoutAdmin = (req,res)=>{

    req.session.destroy((err) => {
    if (err) {
      log.red('Error destroying session', err);
      return res.status(500).send('Unable to log out');
    }
    res.redirect('/admin/login?message=logged+out+successfully&alertType=success');
  });


}
//--- Admin Users Dashboard ----
const getCustomers = async (req,res)=>{
    try{
        let message = req.query.message 
        let alertType = req.query.alertType
        const customers = await userSchema.find()
        res.render('admin/userdashboard', {customers, message, alertType})

    }catch(error){
        log.red('FETCH_USERS_ERROR',error)

    }
}


const blockCustomer = async (req,res)=>{
   try{
    const customer = await userSchema.findByIdAndUpdate(
      req.params.customerid, 
      {status:"Blocked"},
      {new: true}
    );
    if(req.session.user.id == customer._id ){
      delete req.session.user
    }
    res.json({
      success: true,
      message: 'Customer blocked successfully',
      customer
    });
   }catch(error){
    log.red('BLOCK_CUSTOMER_ERROR', error)
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
   }
}

const unblockCustomer = async (req, res)=>{
    try{
        const customer = await userSchema.findByIdAndUpdate(
          req.params.customerid, 
          {status:"Active"},
          {new: true}
        );
        res.json({
          success: true,
          message: 'Customer unblocked successfully',
          customer
        });
    }catch(error){
        log.red('UNBLOCK_CUSTOMER_ERROR', error)
        res.status(500).json({
          success: false,
          message: 'Something went wrong'
        });
    }
}



export default {
     loadLogin, verifyLogin , logoutAdmin,
     getCustomers, blockCustomer, unblockCustomer,
     
}
