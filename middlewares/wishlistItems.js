import wishlistSchema from "../model/wishlistModel.js";
import {log} from "mercedlogger"

const fetchWishlistItems = async (req, res, next)=>{
    try{

        const userId = req.session.user.id 
        
        const wishlist = await wishlistSchema
            .findOne({ userId})
            .populate({
                path: 'products',
                match: { status: 'Active' }
            })    
        res.locals.wishlistItems = wishlist.products 

    }catch(error){
        log.red("FETCH_WISHLIST_ERROR")
    }


    next()
}


export default {fetchWishlistItems}