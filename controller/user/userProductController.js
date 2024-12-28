import { log } from "mercedlogger";
import productSchema from "../../model/productModel.js";
import categorySchema from "../../model/categoryModel.js";
import wishlistSchema from "../../model/wishlistModel.js"
import reviewModel from '../../model/reviewModel.js';


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
        const productId = req.params.id;
        
        // First fetch the product
        const product = await productSchema.findById(productId);
        
        if (!product) {
            return res.redirect('/allproducts');
        }

        // Then fetch related products and reviews in parallel
        const [relatedProducts, reviews] = await Promise.all([
            productSchema.find({
                category: product.category,
                _id: { $ne: product._id },
                status: "Active"
            }).limit(4),
            reviewModel.find({ product: productId })
                .populate('user', 'fullname')
                .sort({ createdAt: -1 })
        ]);

        // Calculate average rating
        let averageRating = 0;
        if (reviews && reviews.length > 0) {
            averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        }

        res.render('user/viewproduct', {
            product,
            relatedProducts,
            reviews: reviews || [], // Ensure reviews is always an array
            averageRating,
            reviewCount: reviews ? reviews.length : 0,
            fullname: req.session.user?.fullname
        });

    } catch (error) {
        console.error('View product error:', error);
        res.redirect('/allproducts');
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