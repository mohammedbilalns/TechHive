import { log } from "mercedlogger";
import productSchema from "../../model/productModel.js";
import categorySchema from "../../model/categoryModel.js";
import reviewModel from '../../model/reviewModel.js';
import mongoose from 'mongoose';


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
        const page = parseInt(req.query.page) || 1;
        const limit = 4; // Number of categories per page

        // Get total number of active categories
        const totalCategories = await categorySchema.countDocuments({ status: "Active" });
        const totalPages = Math.ceil(totalCategories / limit);

        // Get categories
        const categories = await categorySchema
            .find({ status: "Active" })
            .skip((page - 1) * limit)
            .limit(limit);

        // Get products for each category
        const categoriesWithProducts = await Promise.all(
            categories.map(async (category) => {
                const products = await productSchema
                    .find({ 
                        category: category._id,
                        status: "Active"
                    })
                    .sort({ createdAt: -1 });

                return {
                    ...category.toObject(),
                    products
                };
            })
        );

        // Get product ratings
        const productRatings = await reviewModel.aggregate([
            {
                $group: {
                    _id: "$product",
                    avgRating: { $avg: "$rating" }
                }
            }
        ]);

        const ratingMap = new Map(
            productRatings.map(item => [item._id.toString(), item.avgRating])
        );

        res.render('user/allProducts', {
            categoriesWithProducts,
            productRatings: Object.fromEntries(ratingMap),
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            fullname: req.session.user?.fullname,
        });

    } catch (error) {
        console.error("Error in loadAllProducts:", error);
        res.status(500).render('notfound', {
            message: "Error loading products",
            alertType: "error"
        });
    }
};

const viewProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const reviewsPerPage = 5;
        
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            if (req.xhr) {
                return res.status(400).json({ error: 'Invalid product ID' });
            }
            return res.redirect('/notfound?message=Invalid+Product+id&alertType=error');
        }
        
        // Fetch reviews first
        const reviews = await reviewModel.find({ product: productId })
            .populate('user', 'fullname')
            .sort({ createdAt: -1 })
            .skip((page - 1) * reviewsPerPage)
            .limit(reviewsPerPage);

        const totalReviews = await reviewModel.countDocuments({ product: productId });

        // If it's an AJAX request, return only the reviews data
        if (req.xhr) {
            return res.json({
                reviews,
                hasMore: (page * reviewsPerPage) < totalReviews
            });
        }

        // For regular page load, fetch the rest of the data
        const product = await productSchema.findById(productId);
        
        if (!product || product.status !== "Active") {
            return res.redirect('/notfound?message=Product+not+found&alertType=error');
        }

        const relatedProducts = await productSchema.find({
            category: product.category,
            _id: { $ne: product._id },
            status: "Active"
        }).limit(4);

        // Calculate average rating
        let averageRating = 0;
        if (totalReviews > 0) {
            const allRatings = await reviewModel.find({ product: productId });
            averageRating = allRatings.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
        }

        // Get product ratings for related products
        const productRatings = await reviewModel.aggregate([
            {
                $group: {
                    _id: "$product",
                    avgRating: { $avg: "$rating" }
                }
            }
        ]);

        const ratingMap = new Map(
            productRatings.map(item => [item._id.toString(), item.avgRating])
        );

        // Get user's wishlist if logged in
        let wishlistItems = [];
        if (req.session.user) {
            const user = await mongoose.model('users').findById(req.session.user._id);
            wishlistItems = user ? user.wishlist || [] : [];
        }

        res.render('user/viewProduct', {
            product,
            relatedProducts,
            reviews,
            averageRating,
            reviewCount: totalReviews,
            currentPage: page,
            hasMore: (page * reviewsPerPage) < totalReviews,
            fullname: req.session.user?.fullname,
            wishlistItems,
            productRatings: Object.fromEntries(ratingMap)
        });

    } catch (error) {
        console.error("VIEWPRODUCT_ERROR:", error);
        if (req.xhr) {
            return res.status(500).json({ error: "Error loading reviews" });
        }
        res.status(500).render('notfound', {
            message: "Error loading product",
            alertType: "error"
        });
    }
};

const viewCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const sortBy = req.query.sort || 'newest';
        const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : 0;
        const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : Number.MAX_VALUE;
        const minRating = req.query.minRating ? parseFloat(req.query.minRating) : 0;

        // Validate if the ID is a valid  ObjectId
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.redirect('/notfound?message=Invalid+category+id&alertType=error');
        }

        // Fetch the category
        const category = await categorySchema.findOne({
            _id: categoryId,
            status: "Active"
        });

        if (!category) {
            return res.redirect('/notfound?message=Category+not+found&alertType=error');

        }

        // Get product ratings
        const productRatings = await reviewModel.aggregate([
            { 
                $group: {
                    _id: "$product",
                    avgRating: { $avg: "$rating" }
                }
            }
        ]);

        const ratingMap = new Map(productRatings.map(item => [item._id.toString(), item.avgRating]));

        // Base query with category and price filter
        const baseQuery = {
            category: categoryId,
            status: "Active",
            price: { $gte: minPrice, $lte: maxPrice }
        };

        // Get all products matching the base query
        let allProducts = await productSchema
            .find(baseQuery);

        // Apply rating filter if needed
        if (minRating > 0) {
            allProducts = allProducts.filter(product => 
                (ratingMap.get(product._id.toString()) || 0) >= minRating
            );
        }

        // Sort products
        allProducts.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return b.createdAt - a.createdAt;
                case 'price_asc':
                    return a.price - b.price;
                case 'price_desc':
                    return b.price - a.price;
                case 'name_asc':
                    return a.name.localeCompare(b.name);
                case 'name_desc':
                    return b.name.localeCompare(a.name);
                case 'rating':
                    const ratingA = ratingMap.get(a._id.toString()) || 0;
                    const ratingB = ratingMap.get(b._id.toString()) || 0;
                    return ratingB - ratingA;
                default:
                    return b.createdAt - a.createdAt;
            }
        });

        // Calculate pagination
        const totalProducts = allProducts.length;
        const totalPages = Math.ceil(totalProducts / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        // Slice the products array for pagination
        const products = allProducts.slice(startIndex, endIndex);

        if (req.xhr) {
            return res.json({
                products,
                productRatings: Object.fromEntries(ratingMap),
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            });
        }

        res.render('user/viewCategory', {
            category,
            products,
            productRatings: Object.fromEntries(ratingMap),
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            fullname: req.session.user?.fullname,
        });

    } catch (error) {
        log.red("VIEW_CATEGORY_ERROR", error);
        if (req.xhr) {
            return res.status(500).json({
                error: "Error loading category"
            });
        }
        res.status(500).render('notfound', {
            message: "Error loading category",
            alertType: "error"
        });
    }
};

export default {
    loadHome, loadLanding, loadAllProducts, viewProduct, viewCategory
}