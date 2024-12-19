import wishlistSchema from "../../model/wishlistModel.js";
import { log } from "mercedlogger";

const getWishlist = async (req, res) => {
    try {
        const wishlist = await wishlistSchema.findOne({ userId: req.session.user.id })
            .populate('products');

        res.render('user/profile/wishlist', { 
            wishlist: wishlist ? wishlist: [],
            page: "wishlist", 
            user: req.session.user
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

        res.json({ 
            success: true, 
            message: "Product added to wishlist successfully" 
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
        console.log("removeFromWishlist");
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

        res.json({ 
            success: true, 
            message: "Product removed from wishlist successfully" 
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