import { log } from "mercedlogger";
import categorySchema from "../../model/categoryModel.js"
import productSchema from "../../model/productModel.js"
import multer from "multer";
import fs from "node:fs"
import path from "node:path"
import mongoose from 'mongoose';

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
        let message = req.query.message
        let alertType = req.query.alertType
        const page = parseInt(req.query.page) || 1
        const limit = 10
        const search = req.query.search || ''

        // Create search query
        const searchQuery = {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ]
        }

        const totalProducts = await productSchema.countDocuments(searchQuery)
        const totalPages = Math.ceil(totalProducts / limit)
        const skip = (page - 1) * limit

        const products = await productSchema.find(searchQuery)
            .populate('category')
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)

        res.render("admin/products", {
            products,
            page: "products",
            message,
            alertType,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            search
        });
    } catch (error) {
        log.red("PRODUCT_FETCH_ERROR", error);
        
    }
}

const deleteProduct = async (req, res) => {
    try {
        // Get the product details 
        const product = await productSchema.findById(req.params.productid);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete all images except the first one
        if (product.images && product.images.length > 1) {
            product.images.slice(1).forEach(image => {
                const imagePath = path.join('static', image.path);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            });
        }

        // Delete the product from database
        await productSchema.findByIdAndDelete(req.params.productid);

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        log.red('PRODUCT_DELETE_ERROR', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product'
        });
    }
};

const deactivateProduct = async (req, res) => {
    try {
        const product = await productSchema.findByIdAndUpdate(
            req.params.productid,
            { status: "Inactive" },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product deactivated successfully',
            product
        });
    } catch (error) {
        log.red('PRODUCT_DEACTIVATE_ERROR', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate product'
        });
    }
};

const activateProduct = async (req, res) => {
    try {
        const product = await productSchema.findByIdAndUpdate(
            req.params.productid,
            { status: "Active" },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product activated successfully',
            product
        });
    } catch (error) {
        log.red('PRODUCT_ACTIVATE_ERROR', error);
        res.status(500).json({
            success: false,
            message: 'Failed to activate product'
        });
    }
};

const getAddProduct = async (req, res) => {
    try {
        const categories = await categorySchema.find({ status: "Active" })
        res.render('admin/addProduct', { categories, page: 'products' })
    } catch (error) {
        log.red("FETCH_ADD_PRODUCT", err)
        res.redirect('/admin/products?message=Something+went+wrong&alertType=error')

    }

}

const addProduct = async (req, res) => {
    try {
        let { name, description, price, stock, brand, category, specifications } = req.body;

        name = name.trim().split(' ')
            .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        description = description.trim();
        brand = brand.trim().split(' ')
            .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        const specArray = Array.isArray(specifications) ? specifications : [specifications];
        const cleanedSpecs = specArray.filter(spec => spec && spec.trim()).map(spec => spec.trim());

        let product = await productSchema.findOne({ name })
        if (product) return res.redirect('/admin/products?message=Product+with+same+name+already+exists&alertType=error')

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
            images,
            status: "Active"
        });

        await newProduct.save();
        res.json({
            success: true,
            message: 'Product added successfully'
        });

    } catch (error) {
        log.red('ADD_PRODUCT_ERROR', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add product'
        });
    }
};



const getEditProduct = async (req, res) => {
    try {
        const productId = req.params.productid;

        
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.redirect('/notfound?message=Invalid+Product+ID&alertType=error');
        }

        const product = await productSchema.findById(productId);
        
        // Check if product exists
        if (!product) {
            return res.redirect('/notfound?message=Product+not+found&alertType=error');
        }

        const categories = await categorySchema.find({ status: "Active" });
        res.render('admin/editProduct', { product, categories, page: 'products' });
        
    } catch (error) {
        log.red('FETCH_EDIT_PRODUCT_ERROR', error);
        res.redirect('/notfound?message=Error+loading+product&alertType=error');
    }
};


const editProduct = async (req, res) => {
    try {
        const productId = req.params.productid;
        if(!productId){
            return res.redirect('/notfound?message=Invalid+Product+id&alertType=error');

        };
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.redirect('/notfound?message=Invalid+Product+id&alertType=error');
        
        }

        let { name, description, price, stock, brand, category, specifications } = req.body;

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
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing'
            });
        }

        let existingproduct = await productSchema.findOne({
            name,
            _id: { $ne: productId }
        });
        if (existingproduct) {
            return res.status(400).json({
                success: false,
                message: 'Product with same name already exists'
            });
        }

        const product = await productSchema.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
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
                images
            },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Failed to update product'
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully'
        });

    } catch (error) {
        log.red('EDIT_PRODUCT_ERROR', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product'
        });
    }
};

export default { getProducts, deleteProduct, deactivateProduct, activateProduct, getAddProduct, addProduct, getEditProduct, editProduct, productUpload }