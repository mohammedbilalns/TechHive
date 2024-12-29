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

        res.render('user/allproducts', {
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
        res.status(500).render('error', {
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
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const sortBy = req.query.sort || 'newest';
        const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : 0;
        const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : Number.MAX_VALUE;
        const minRating = req.query.minRating ? parseFloat(req.query.minRating) : 0;

        // Fetch the category
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

        res.render('user/viewcategory', {
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
        log.red("ERROR", error);
        if (req.xhr) {
            return res.status(500).json({
                error: "Error loading category"
            });
        }
        res.status(500).render('error', {
            message: "Error loading category",
            alertType: "error"
        });
    }
};

export default {
    loadHome, loadLanding, loadAllProducts, viewProduct, viewCategory
}