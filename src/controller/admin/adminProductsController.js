import { categoryModel } from "../../model/categoryModel.js";
import { productModel } from "../../model/productModel.js";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import mongoose from 'mongoose';
import { HttpStatus } from "../../constants/statusCodes.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/appError.js";
import { validateProduct } from "../../validators/product.validator.js";

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

const getProducts = asyncHandler(async (req, res) => {
    let message = req.query.message;
    let alertType = req.query.alertType;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const search = req.query.search || '';

    // Create search query
    const searchQuery = {
        $or: [
            { name: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } }
        ]
    };

    const totalProducts = await productModel.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalProducts / limit);
    const skip = (page - 1) * limit;

    const products = await productModel.find(searchQuery)
        .populate('category')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit);

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
});

const deleteProduct = asyncHandler(async (req, res) => {
    // Get the product details 
    const product = await productModel.findById(req.params.productid);

    if (!product) {
        throw new AppError(HttpStatus.NOT_FOUND, 'Product not found');
    }

    if (product.images && product.images.length > 1) {
        product.images.slice(1).forEach(image => {
            const imagePath = path.join('static', image.path);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        });
    }

    // Delete the product from database
    await productModel.findByIdAndDelete(req.params.productid);

    res.json({
        success: true,
        message: 'Product deleted successfully'
    });
});

const deactivateProduct = asyncHandler(async (req, res) => {
    const product = await productModel.findByIdAndUpdate(
        req.params.productid,
        { status: "Inactive" },
        { new: true }
    );

    if (!product) {
        throw new AppError(HttpStatus.NOT_FOUND, 'Product not found');
    }

    res.json({
        success: true,
        message: 'Product deactivated successfully',
        product
    });
});

const activateProduct = asyncHandler(async (req, res) => {
    const product = await productModel.findByIdAndUpdate(
        req.params.productid,
        { status: "Active" },
        { new: true }
    );

    if (!product) {
        throw new AppError(HttpStatus.NOT_FOUND, 'Product not found');
    }

    res.json({
        success: true,
        message: 'Product activated successfully',
        product
    });
});

const getAddProduct = asyncHandler(async (_req, res) => {
    const categories = await categoryModel.find({ status: "Active" });
    res.render('admin/addProduct', { categories, page: 'products' });
});

const addProduct = asyncHandler(async (req, res) => {
    let { name, description, price, stock, brand, category, specifications } = req.body;

    // Sanitization
    name = name.trim().split(' ')
        .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    description = description.trim();
    brand = brand.trim().split(' ')
        .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    const specArray = Array.isArray(specifications) ? specifications : [specifications];
    const cleanedSpecs = specArray.filter(spec => spec && spec.trim()).map(spec => spec.trim());

    // Validation
    const validationError = validateProduct({ name, description, price, stock, brand, category });
    if (validationError) {
        throw new AppError(HttpStatus.BAD_REQUEST, validationError);
    }

    let product = await productModel.findOne({ name });
    if (product) {
        throw new AppError(HttpStatus.CONFLICT, 'Product with same name already exists');
    }

    // Process images
    const images = req.files.map(file => ({
        path: file.path.replace('static/', '/'),
        filename: file.filename
    }));

    const newProduct = new productModel({
        name,
        description,
        brand,
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
});



const getEditProduct = asyncHandler(async (req, res) => {
    const productId = req.params.productid;


    if (!mongoose.Types.ObjectId.isValid(productId)) {
        res.redirect('/notfound?message=Invalid+Product+ID&alertType=error');
        return;
    }

    const product = await productModel.findById(productId);

    // Check if product exists
    if (!product) {
        res.redirect('/notfound?message=Product+not+found&alertType=error');
        return;
    }

    const categories = await categoryModel.find({ status: "Active" });
    res.render('admin/editProduct', { product, categories, page: 'products' });
});


const editProduct = asyncHandler(async (req, res) => {
    const productId = req.params.productid;
    if (!productId) {
        res.redirect('/notfound?message=Invalid+Product+id&alertType=error');
        return;

    };
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        res.redirect('/notfound?message=Invalid+Product+id&alertType=error');
        return;

    }

    let { name, description, price, stock, brand, category, specifications } = req.body;

    // Sanitization
    name = name.trim().split(' ')
        .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    description = description.trim();
    brand = brand.trim().split(' ')
        .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    const specArray = Array.isArray(specifications) ? specifications : [specifications];
    const cleanedSpecs = specArray.filter(spec => spec && spec.trim()).map(spec => spec.trim());

    // Validation
    const validationError = validateProduct({ name, description, price, stock, brand, category });
    if (validationError) {
        throw new AppError(HttpStatus.BAD_REQUEST, validationError);
    }

    let existingproduct = await productModel.findOne({
        name,
        _id: { $ne: productId }
    });
    if (existingproduct) {
        throw new AppError(HttpStatus.CONFLICT, 'Product with same name already exists');
    }

    const product = await productModel.findById(productId);
    if (!product) {
        throw new AppError(HttpStatus.NOT_FOUND, 'Product not found');
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
    const updatedProduct = await productModel.findByIdAndUpdate(
        productId,
        {
            name,
            description,
            brand,
            category,
            specifications: cleanedSpecs,
            price: parseFloat(price),
            stock: parseInt(stock),
            images
        },
        { new: true }
    );

    if (!updatedProduct) {
        throw new AppError(HttpStatus.NOT_FOUND, 'Failed to update product');
    }

    res.json({
        success: true,
        message: 'Product updated successfully'
    });
});

export default { getProducts, deleteProduct, deactivateProduct, activateProduct, getAddProduct, addProduct, getEditProduct, editProduct, productUpload };
