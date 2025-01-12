import wishlistSchema from "../../model/wishlistModel.js";
import productModel from "../../model/productModel.js";
import { log } from "mercedlogger";

const getWishlist = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8; 
        const skip = (page - 1) * limit;

        const userId = req.session.user.id;

        // Find or create wishlist
        let wishlist = await wishlistSchema.findOne({ userId });
        if (!wishlist) {
            wishlist = await wishlistSchema.create({ userId, products: [] });
        }

        // Get total count for pagination
        const totalProducts = wishlist.products.length;
        const totalPages = Math.ceil(totalProducts / limit);

        // Get paginated wishlist
        const paginatedWishlist = await wishlistSchema.findOne({ userId })
            .populate({
                path: 'products',
                match: { status: 'Active' },
                options: {
                    skip: skip,
                    limit: limit
                }
            });

        res.render('user/profile/wishlist', { 
            wishlist: paginatedWishlist ? paginatedWishlist : [],
            page: "wishlist", 
            user: req.session.user,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        });
    } catch (error) {
        log.red("FETCH_WISHLIST_ERROR", error);
        res.status(500).json({ success: false, message: "Error fetching wishlist" });
    }
}

const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user.id;

        // Check if product is active
        const product = await productModel.findOne({ 
            _id: productId,
            status: 'Active'
        });

        if (!product) {
            return res.status(400).json({ 
                success: false, 
                message: "Product is not available" 
            });
        }

        let wishlist = await wishlistSchema.findOne({ userId });

        if (!wishlist) {
            wishlist = await wishlistSchema.create({ 
                userId, 
                products: [productId] 
            });
        } else if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
            await wishlist.save();
        }

        const totalQuantity = wishlist.products.length;

        res.status(200).json({ 
            success: true, 
            message: "Product added to wishlist successfully",
            totalQuantity
        });
    } catch (error) {
        log.red("ADD_TO_WISHLIST_ERROR", error);
        res.status(500).json({ 
            success: false, 
            message: "Error adding product to wishlist" 
        });
    }
}

const removeFromWishlist = async (req, res) => {
    try {
        
        const { productId } = req.body;
        const userId = req.session.user.id;

        const wishlist = await wishlistSchema.findOne({ userId });
        
        if (!wishlist) {
            return res.status(404).json({ 
                success: false, 
                message: "Wishlist not found" 
            });
        }

        // Remove the product from the wishlist
        wishlist.products = wishlist.products.filter(
            product => product.toString() !== productId
        );
        
        await wishlist.save();

        const totalQuantity = wishlist.products.length;

        res.json({ 
            success: true, 
            message: "Product removed from wishlist successfully",
            totalQuantity
        });
    } catch (error) {
        log.red("REMOVE_FROM_WISHLIST_ERROR", error);
        res.status(500).json({ 
            success: false, 
            message: "Error removing product from wishlist" 
        });
    }
}

export default { getWishlist, addToWishlist, removeFromWishlist }