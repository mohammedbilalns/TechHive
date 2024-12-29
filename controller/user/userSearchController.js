import { log } from "mercedlogger";
import productSchema from "../../model/productModel.js";
import categorySchema from "../../model/categoryModel.js";
import reviewSchema from "../../model/reviewModel.js";

const searchProducts = async (req, res) => {
    try {
        const query = req.query.q || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const sortBy = req.query.sort || 'newest';
        const categoryFilter = req.query.category;
        const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : 0;
        const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : Number.MAX_VALUE;
        const minRating = req.query.minRating ? parseFloat(req.query.minRating) : 0;

        // Get product ratings first
        const productRatings = await reviewSchema.aggregate([
            { 
                $group: {
                    _id: "$product",
                    avgRating: { $avg: "$rating" }
                }
            }
        ]);

        const ratingMap = new Map(productRatings.map(item => [item._id.toString(), item.avgRating]));

        // Base query with price filter
        const baseQuery = {
            status: "Active",
            price: { $gte: minPrice, $lte: maxPrice }
        };

        // Add search query if provided
        if (query) {
            const matchingCategories = await categorySchema.find({
                name: { $regex: query, $options: 'i' },
                status: 'Active'
            });

            const categoryIds = matchingCategories.map(cat => cat._id);

            baseQuery.$or = [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { brand: { $regex: query, $options: 'i' } },
                { category: { $in: categoryIds } }
            ];
        }

        // Add category filter if provided
        if (categoryFilter && categoryFilter !== 'all') {
            baseQuery.category = categoryFilter;
        }

        // Get all products first
        let allProducts = await productSchema
            .find(baseQuery)
            .populate('category', 'name');

        // Apply rating filter if needed
        if (minRating > 0) {
            allProducts = allProducts.filter(product => 
                (ratingMap.get(product._id.toString()) || 0) >= minRating
            );
        }

        // Sort products based on selected option
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

        // Calculate pagination after all filters and sorting
        const totalProducts = allProducts.length;
        const totalPages = Math.ceil(totalProducts / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        // Slice the products array for pagination
        const products = allProducts.slice(startIndex, endIndex);

        // Get all categories for filter dropdown
        const allCategories = await categorySchema.find({ status: 'Active' });

        if (req.xhr || req.path === '/api/search') {
            return res.json({
                products,
                productRatings: Object.fromEntries(ratingMap),
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            });
        }

        res.render('user/searchResults', {
            products,
            query,
            productRatings: Object.fromEntries(ratingMap),
            categories: allCategories,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            fullname: req.session.user?.fullname,
            wishlistItems: req.wishlistItems || []
        });

    } catch (error) {
        log.red("ERROR", error);
        if (req.xhr || req.path === '/api/search') {
            return res.status(500).json({
                error: "Error searching products"
            });
        }
        res.status(500).render('notfound', {
            message: "Error searching products",
            alertType: "error"
        });
    }
};

export default {
    searchProducts
};
