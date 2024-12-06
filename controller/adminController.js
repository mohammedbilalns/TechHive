import { log } from "mercedlogger";
import { configDotenv } from "dotenv";

import userSchema from "../model/userModel.js";
import categorySchema from "../model/categoryModel.js"
import productSchema from "../model/productModel.js"

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
        console.log(email, password)
        if(email != process.env.ADMIN_EMAIL || password != process.env.ADMIN_PASSWORD){
            return res.redirect(`/admin/login?message=Invalid+credentials&alertType=error&email=${email}`)
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
        let message = req.query.message 
        let alertType = req.query.alertType

        const categories = await categorySchema.find()
        res.render('admin/categories', {categories, message, alertType})
    }catch(error){
        log.red('FETCH_CATEGORIES_ERROR',error)
    }
}

const deleteCategory = async (req,res)=>{
    try{
        await categorySchema.findByIdAndDelete(req.params.categoryid)
        res.redirect('/admin/categories?message=Category+deleted+successfully&alertType=success')
    }catch(error){
        log.red('DELETE_CATEGORY_ERROR', error)
    }

}

const hideCategory = async (req,res)=>{
    try{
        await categorySchema.findByIdAndUpdate(req.params.categoryid, {status:"Inactive"})
        res.redirect('/admin/categories?message=Category+hided+successfully&alertType=success')
    }catch(error){
        log.red('HIDE_CATEGORY_ERROR', error)
    }
}
const unhideCategory = async (req,res)=>{
    try{
        await categorySchema.findByIdAndUpdate(req.params.categoryid, {status:"Active"})
        res.redirect('/admin/categories?message=Category+unhided+successfully&alertType=success')

    }catch(error){
        log.red('HIDE_CATEGORY_ERROR', error)
    }
}


const addCategory = async (req,res)=>{
    try{
        let {name , description} = req.body 
        name = name.trim()[0].toUpperCase()+name.trim().slice(1)
        description = description.trim()

        const existingCategory = await categorySchema.findOne({name})
        if(existingCategory) return  res.redirect('/admin/categories?message=Category+with+same+name+already+exists&alertType=error')

        let newCategory = new categorySchema({
            name,
            description,
            status:"Active"
        })

        await newCategory.save()
        res.redirect('/admin/categories?message=Category+created+successfully&alertType=success')
    }catch(error){
        log.red('ADD_CATEGORY_ERROR', error)
    }
}


const editCategory = async (req, res) => {
    try {
        let { name, description } = req.body;

        name = name.trim()[0].toUpperCase() + name.trim().slice(1);
        description = description.trim();
        
        // find if there is any collection with the same name already exists in the db 
        const existingCategory = await categorySchema.findOne({
            name: name,
            _id: { $ne: req.params.categoryid } // Exclude the current category by ID
        });

        if (existingCategory) {
            return res.redirect('/admin/categories?message=Category+name+already+exists&alertType=error');
        }

        await categorySchema.findByIdAndUpdate(req.params.categoryid, { name, description });

        res.redirect('/admin/categories?message=Category+updated+successfully&alertType=success');
    } catch (error) {
        log.red("EDIT_CATEGORY_ERROR", error);
        res.redirect('/admin/categories?message=An+unexpected+error+occurred&alertType=error');
    }
};

//---- Admin Products ---- 
const getProducts = async (req, res) => {
    try {
        let message = req.query.message;
        let alertType = req.query.alertType;

        const products = await productSchema.find();
        const categories = await categorySchema.find();
        res.render("admin/products", { products, categories, message, alertType });
    } catch (error) {
        log.red("PRODUCT_FETCH_ERROR", error);
    }
}

const addProduct = async (req, res) => {
    try {
        let { name, brand, category, variants } = req.body;
        const mainImage = req.file ? req.file.path : ''; // Get the path of the uploaded file

        // Validate input
        name = name.trim();
        brand = brand.trim();
        category = category.trim();

        if (!name || !brand || !category || !mainImage || !variants) {
            return res.redirect('/admin/products?message=All fields are required&alertType=error');
        }

        // Prepare variants
        const preparedVariants = variants.map(variant => ({
            variantName: variant.variantName.trim(),
            price: parseFloat(variant.price),
            stock: parseInt(variant.stock),
            discount: parseInt(variant.discount) || 0,
            images: variant.images // Assuming images are passed correctly
        }));

        // Create new product
        const newProduct = new productSchema({
            name,
            brand,
            category,
            mainImage,
            variants: preparedVariants,
            status: "Active"
        });

        await newProduct.save();
        res.redirect('/admin/products?message=Product added successfully&alertType=success');
    } catch (error) {
        log.red('ADD_PRODUCT_ERROR', error);
        res.redirect('/admin/products?message=Something went wrong&alertType=error');
    }
}

const deleteProduct = async (req, res) =>{
    try{
        await productSchema.findByIdAndDelete(req.params.productid)
        res.redirect('/admin/products?message=Product+deleted+successfully&alertType=success')
    }catch(error){
        log.red('PRODUCT_DELETE_ERROR', error)
        res.redirect('/admin/products?message=Something+went+wrong&alertType=error')
    }
   
}

const deactivateProduct = async (req,res)=>{
    try{
        await productSchema.findByIdAndUpdate(req.params.productid, {status:"Inactive"})
        res.redirect('/admin/products?message=Product+deactivated+successfully&alertType=success')

    }catch(error){
        log.red('PRODUCT_DEACTIVATE_ERROR', error)
        res.redirect('/admin/products?message=Something+went+wrong&alertType=error')
    }

}
const activateProduct = async (req,res)=>{
    try{
        await productSchema.findByIdAndUpdate(req.params.productid, {status:"Active"})
        res.redirect('/admin/products?message=Product+activated+successfully&alertType=success')

    }catch(error){
         log.red('PRODUCT_ACTIVATE_ERROR', error)
        res.redirect('/admin/products?message=Something+went+wrong&alertType=error')
    }

}

export default {
     loadLogin, verifyLogin ,
     getCustomers, blockCustomer, unblockCustomer,
     getCategories, deleteCategory, hideCategory, unhideCategory, addCategory,editCategory,
     getProducts, addProduct, deleteProduct, deactivateProduct, activateProduct
    }