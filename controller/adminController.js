import { log } from "mercedlogger";
import { configDotenv } from "dotenv";
import userSchema from "../model/userModel.js";
import categorySchema from "../model/categoryModel.js"

configDotenv()


//---- Admin Login----
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

//--- Admin Users Dashboard ----
const getCustomers = async (req,res)=>{
    try{
        const customers = await userSchema.find()
        res.render('admin/userdashboard', {customers})

    }catch(error){
        log.red('FETCH_USERS_ERROR',error)

    }
}


const blockCustomer = async (req,res)=>{
   try{
    await userSchema.findByIdAndUpdate(req.params.customerid, {status:"Blocked"})
    res.redirect('/admin/customers')
   }catch(error){
    log.red('BLOCK_CUSTOMER_ERROR', error)
   }
    

}

const unblockCustomer = async (req, res)=>{
    try{
        await userSchema.findByIdAndUpdate(req.params.customerid , {status:"Active"})
        res.redirect('/admin/customers')
    }catch(error){
        log.red('UNBLOCK_CUSTOMER_ERROR', error)

    }
    
}


//---- Admin Categories ----

const getCategories = async (req, res)=>{
    try{
        const categories = await categorySchema.find()
        res.render('admin/categories', {categories})
    }catch(error){
        log.red('FETCH_CATEGORIES_ERROR',error)
    }
}

const deleteCategory = async (req,res)=>{
    try{
        await categorySchema.findByIdAndDelete(req.params.categoryid)
        res.redirect('/admin/categories')
    }catch(error){
        log.red('DELETE_CATEGORY_ERROR', error)
    }

}

const hideCategory = async (req,res)=>{
    try{
        await categorySchema.findByIdAndUpdate(req.params.categoryid, {status:"Inactive"})
        res.redirect('/admin/categories')
    }catch(error){
        log.red('HIDE_CATEGORY_ERROR', error)
    }
}
const unhideCategory = async (req,res)=>{
    try{
        await categorySchema.findByIdAndUpdate(req.params.categoryid, {status:"Active"})
        res.redirect('/admin/categories')
    }catch(error){
        log.red('HIDE_CATEGORY_ERROR', error)
    }
}


const addCategory = async (req,res)=>{
    try{
        let {name , description} = req.body 
      
        let newCategory = new categorySchema({
            name: name.trim(),
            description: description.trim(),
            status:"Active"
        })

        await newCategory.save()
        res.redirect('/admin/categories')
    }catch(error){
        log.red('ADD_CATEGORY_ERROR', error)
    }
}
export default { loadLogin, verifyLogin , getCustomers, blockCustomer, unblockCustomer, getCategories, deleteCategory, hideCategory, unhideCategory, addCategory}