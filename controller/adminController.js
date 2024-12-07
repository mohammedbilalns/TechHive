import { log } from "mercedlogger";
import { configDotenv } from "dotenv";

import userSchema from "../model/userModel.js";
import categorySchema from "../model/categoryModel.js"
import productSchema from "../model/productModel.js"
import {v2 as cloudinary} from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"

configDotenv()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "product_variants",
      allowed_formats: ["jpg", "jpeg", "png"],
    },
  });

const upload = multer({ storage: storage });

// Add multer configuration for local storage
const productStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'static/uploads/products';
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const productUpload = multer({ 
    storage: productStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});

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

        
        const products = await productSchema.find().populate('category');
        res.render("admin/products", { products, message, alertType });
    } catch (error) {
        log.red("PRODUCT_FETCH_ERROR", error);
    }
}

const deleteProduct = async (req, res) => {
    try {
        // Get the product details before deletion
        const product = await productSchema.findById(req.params.productid);
        
        if (product && product.images) {
            // Delete each image file from the storage
            product.images.forEach(image => {
                const imagePath = path.join('static', image.path);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            });
        }

        // Delete the product from database
        await productSchema.findByIdAndDelete(req.params.productid);
        res.redirect('/admin/products?message=Product+deleted+successfully&alertType=success');
    } catch (error) {
        log.red('PRODUCT_DELETE_ERROR', error);
        res.redirect('/admin/products?message=Something+went+wrong&alertType=error');
    }
};

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

const getAddProduct = async(req,res)=>{
    try{
        const categories = await categorySchema.find({status:"Active"})    
         res.render('admin/addproduct',{categories} )
    }catch(error){
        log.red("FETCH_ADD_PRODUCT",err)
        res.redirect('/admin/products?message=Something+went+wrong&alertType=error')

    }
    
}

const addProduct = async (req, res) => {
    try {
        const { name, description, price, discount, stock, brand, category, variant } = req.body;
        const files = req.files;

        // Basic validation
        if (!name || !description || !price || !stock || !brand || !category || !variant || !files) {
            return res.redirect('/admin/products?message=All+fields+are+required&alertType=error');
        }

        // Process images
        const images = files.map(file => ({
            path: file.path.replace('static/', '/'),  // Convert to URL path
            filename: file.filename
        }));

        // Create new product
        const newProduct = new productSchema({
            name: name.trim(),
            description: description.trim(),
            brand: brand.trim(),
            category,
            variant: variant.trim(),
            price: parseFloat(price),
            stock: parseInt(stock),
            discount: discount ? parseFloat(discount) : 0,
            images,
            status: "Active"
        });

        await newProduct.save();
        res.redirect('/admin/products?message=Product+added+successfully&alertType=success');

    } catch (error) {
        log.red('ADD_PRODUCT_ERROR', error);
        res.redirect('/admin/products?message=Something+went+wrong&alertType=error');
    }
};



const getEditProduct = async (req,res)=>{
    try{
        const product = await productSchema.findById(req.params.productid)
        console.log(product)
        const categories = await categorySchema.find({status:"Active"})
        res.render('admin/editproduct', {product, categories})
    }catch(error){
        log.red('FETCH_EDIT_PRODUCT_ERROR', error)
        res.redirect('/admin/products?message=Something+went+wrong&alertType=error')        
    }
}


const editProduct = async (req,res)=>{
    try{
        const productId = req.params.id;
        const updateData = {
            name: req.body.productName,
            description: req.body.description,
            category: req.body.category,
            price: req.body.price,
            stock: req.body.stock
        }
        if(req.body.deleteImages){
            const imagesToDelete = Array.isArray(req.body.deleteImages) 
                ? req.body.deleteImages 
                : [req.body.deleteImages];
            imagesToDelete.forEach(image => {
                fs.unlinkSync(path.join(__dirname, '../public/uploads/', image));
            });
            await productSchema.findByIdAndUpdate(productId, {
                $pull: { images: { $in: imagesToDelete } }
            });
        }
        if(req.files && req.files.length > 0){
            const newImageNames = req.files.map(file => file.filename);
            await productSchema.findByIdAndUpdate(productId, {
                $push: { images: { $each: newImageNames } }
            });
        }
        await productSchema.findByIdAndUpdate(productId, updateData);
        res.redirect('/admin/products?message=Product+updated+successfully&alertType=success');
   
    }catch(error){  
        log.red('EDIT_PRODUCT_ERROR', error)
        res.redirect('/admin/products?message=Something+went+wrong&alertType=error')
    }

}
export default {
     loadLogin, verifyLogin , logoutAdmin,
     getCustomers, blockCustomer, unblockCustomer,
     getCategories, deleteCategory, hideCategory, unhideCategory, addCategory,editCategory,
     getProducts, addProduct, deleteProduct, deactivateProduct, activateProduct, getAddProduct,
     productUpload, getEditProduct, editProduct
    }
