import { log } from "mercedlogger";
import { configDotenv } from "dotenv";
import userSchema from "../model/userModel.js";
configDotenv()

const loadLogin =  (req, res) => {

    res.render("admin/login")
}

const verifyLogin = async (req,res)=>{
    try{
        let {email, password} = req.body
        email = email.trim()
        password = password.trim()
        console.log(email, password)
        if(email != process.env.ADMIN_EMAIL || password != process.env.ADMIN_PASSWORD){
            return res.render('admin/login', { message: "Invalid credentials", alertType: "error" });
        }

        req.session.admin = true 
        res.redirect('/admin/customers')
    }catch(error){
        log.red("LOGIN ERROR", error)
        res.render('admin/login', {message:"Something went wrong", alertType:"error"})
    }
}

const getCustomers = async (req,res)=>{
    try{
        const customers = await userSchema.find()
        res.render('admin/userdashboard', {customers})

    }catch(error){
        log.red('FETCH_USERS_ERROR',error)

    }
}


const blockCustomer = async (req,res)=>{
   
    await userSchema.findByIdAndUpdate(req.params.customerid, {status:"Blocked"})
    res.redirect('/admin/customers')

}

const unblockCustomer = async (req, res)=>{
    await userSchema.findByIdAndUpdate(req.params.customerid , {status:"Active"})
    res.redirect('/admin/customers')
}

export default { loadLogin, verifyLogin , getCustomers, blockCustomer, unblockCustomer}