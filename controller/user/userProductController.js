import { log } from "mercedlogger";
import productSchema from "../../model/productModel.js";
import categorySchema from "../../model/categoryModel.js";
import wishlistSchema from "../../model/wishlistModel.js"


// ---- load home ---- homepage 
const loadHome = async (req, res) => {
    try {
        const allProducts = await productSchema
            .find({ status: "Active" })
            .limit(6);

        // Fetch all categories
        const categories = await categorySchema
            .find({ status: "Active" })
            .limit(10);

        const newArrivals = await productSchema
            .find({ status: "Active" })
            .sort({ createdAt: -1 })
            .limit(4);

        
            
        let fullname = req.session.user?.fullname;
        
        res.render('user/home', {
            allProducts,
            categories,
            newArrivals,
            fullname
        });
    } catch (error) {
        log.red("ERROR", error);
        res.status(500).render('user/home', { 
            message: "Error loading products",
            alertType: "error" 
        });
    }
};

const loadLanding = async (req, res) => {
    try {
        const allProducts = await productSchema
            .find({ status: "Active" })
            .limit(6);

        // Fetch all categories
        const categories = await categorySchema
            .find({ status: "Active" })
            .limit(10);

        const newArrivals = await productSchema
            .find({ status: "Active" })
            .sort({ createdAt: -1 })
            .limit(4);

        res.render('user/landing', {
            allProducts,
            categories,
            newArrivals
        });
    } catch (error) {
        log.red("ERROR", error);
        res.status(500).render('user/landing', { 
            message: "Error loading products",
            alertType: "error" 
        });
    }
};

const loadAllProducts = async (req, res) => {
    try {
        const categoriesWithProducts = await categorySchema
            .aggregate([
                { $match: { status: "Active" } },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "category",
                        pipeline: [{ $match: { status: "Active" } }],
                        as: "products"
                    }
                }
            ]);

        res.render('user/allproducts', {
            categoriesWithProducts, fullname: req.session.user?.fullname
        });
    } catch (error) {
        log.red("ERROR", error);
        res.status(500).render('user/allproducts', {
            message: "Error loading products",
            alertType: "error"
        });
    }
};

const viewProduct = async (req, res) => {
    try {
        const product = await productSchema.findOne({
            _id: req.params.id,
            status: "Active"
        });
        
        if (!product) {
            return res.status(404).render('notfound', {
                message: "Product not found",
                alertType: "error"
            });
        }

        // Fetch related products from the same category
        const relatedProducts = await productSchema.find({
            category: product.category,
            _id: { $ne: product._id },
            status: "Active"
        }).limit(4);

        res.render('user/viewproduct', { 
            product,
            relatedProducts,
            fullname: req.session.user?.fullname
        });
    } catch (error) {
        log.red("ERROR", error);
        res.status(500).render('notfound');
    }
};

const viewCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        
        // Fetch the category with its products
        const category = await categorySchema.findOne({
            _id: categoryId,
            status: "Active"
        });

        if (!category) {
            return res.status(404).render('error', {
                message: "Category not found",
                alertType: "error"
            });
        }

        // Fetch active products in this category
        const products = await productSchema.find({
            category: categoryId,
            status: "Active"
        });

        res.render('user/viewcategory', {
            category,
            products,
            fullname: req.session.user?.fullname
        });
    } catch (error) {
        log.red("ERROR", error);
        res.status(500).render('error', {
            message: "Error loading category",
            alertType: "error"
        });
    }
};

export default {
    loadHome, loadLanding, loadAllProducts, viewProduct, viewCategory
}