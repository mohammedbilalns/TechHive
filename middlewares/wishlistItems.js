import wishlistSchema from "../model/wishlistModel.js";
import {log} from "mercedlogger"

const fetchWishlistItems = async (req, res, next)=>{
    try{
        if(req.session.user){
        const userId = req.session.user.id 
        
        const wishlist = await wishlistSchema
            .findOne({ userId})
            .populate({
                path: 'products',
                match: { status: 'Active' }
            })    
        res.locals.wishlistItems = wishlist.products.map(product => product._id)
        }else{
            res.locals.wishlistItems = []
        }
    }catch(error){
        log.red("FETCH_WISHLIST_ERROR")
    }


    next()
}


export default {fetchWishlistItems}