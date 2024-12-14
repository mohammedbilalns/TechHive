import { log } from "mercedlogger";
import categorySchema from "../model/categoryModel.js"
import productSchema from "../model/productModel.js"
import multer from "multer";
import fs from "node:fs"
import path from "node:path"

//  multer configuration for local storage
const productStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'static/uploads/products';
        
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
        let { name, description, price, discount, stock, brand, category, specifications } = req.body;
      
        name = name.trim().split(' ')
            .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        description = description.trim();
        brand = brand.trim().split(' ')
            .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        const specArray = Array.isArray(specifications) ? specifications : [specifications];
        const cleanedSpecs = specArray.filter(spec => spec && spec.trim()).map(spec => spec.trim());

        let product = await productSchema.findOne({name})
        if(product) return res.redirect('/admin/products?message=Product+with+same+name+already+exists&alertType=error')

        // Process images
        const images = req.files.map(file => ({
            path: file.path.replace('static/', '/'),
            filename: file.filename
        }));

        const newProduct = new productSchema({
            name: name.trim(),
            description: description.trim(),
            brand: brand.trim(),
            category,
            specifications: cleanedSpecs,
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


const editProduct = async (req, res) => {
    try {
        const productId = req.params.productid;
        let { name, description, price, discount, stock, brand, category, specifications } = req.body;

        name = name.trim().split(' ')
            .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        description = description.trim();
        brand = brand.trim().split(' ')
            .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        const specArray = Array.isArray(specifications) ? specifications : [specifications];
        const cleanedSpecs = specArray.filter(spec => spec && spec.trim()).map(spec => spec.trim());

        // Basic validation
        if (!name || !description || !price || !stock || !brand || !category) {
            return res.redirect('/admin/products?message=Required+fields+are+missing&alertType=error');
        }

        let existingproduct = await productSchema.findOne({
            name,
            _id: { $ne: productId } 
        });
        if(existingproduct) return res.redirect('/admin/products?message=Product+with+same+name+already+exists&alertType=error');

        const product = await productSchema.findById(productId);
        if (!product) {
            return res.redirect('/admin/products?message=Product+not+found&alertType=error');
        }

        // Handle image updates
        let images = [...product.images]; 

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                path: file.path.replace('static/', '/'),
                filename: file.filename
            }));

            req.files.forEach((file, index) => {
                if (images[index]) {
                    const oldImagePath = path.join('static', images[index].path);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                    images[index] = newImages[index];
                } else {
                    images.push(newImages[index]);
                }
            });
        }

        // Update product with new data
        const updatedProduct = await productSchema.findByIdAndUpdate(
            productId,
            {
                name: name.trim(),
                description: description.trim(),
                brand: brand.trim(),
                category,
                specifications: cleanedSpecs,
                price: parseFloat(price),
                stock: parseInt(stock),
                discount: discount ? parseFloat(discount) : 0,
                images
            },
            { new: true }
        );

        if (!updatedProduct) {
            return res.redirect('/admin/products?message=Failed+to+update+product&alertType=error');
        }

        res.redirect('/admin/products?message=Product+updated+successfully&alertType=success');

    } catch (error) {
        log.red('EDIT_PRODUCT_ERROR', error);
        res.redirect('/admin/products?message=Something+went+wrong&alertType=error');
    }
};

export default {getProducts, deleteProduct, deactivateProduct, activateProduct, getAddProduct, addProduct, getEditProduct, editProduct, productUpload}