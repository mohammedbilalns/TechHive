import wishlistSchema from "../model/wishlistModel.js";
import {log} from "mercedlogger"

const fetchWishlistItems = async (req, res, next)=>{
    try{
        if(req.session.user){
            const userId = req.session.user.id 
            
            let wishlist = await wishlistSchema
                .findOne({ userId })
                .populate({
                    path: 'products',
                    match: { status: 'Active' }
                })

            // Create new wishlist if none exists
            if (!wishlist) {
                wishlist = await wishlistSchema.create({ userId, products: [] })
            }
            
            
            res.locals.wishlistItems = wishlist.products.map(product => product._id)
           
        } else {
            res.locals.wishlistItems = []
        }
    } catch(error){
        log.red("FETCH_WISHLIST_ERROR")
        res.locals.wishlistItems = [] // Fallback to empty array on error
    }

    next()
}


export default {fetchWishlistItems}