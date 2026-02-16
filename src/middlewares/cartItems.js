import cartSchema from "../model/cartModel.js";
import logger from "../utils/logger.js";

const fetchCartItems = async (req,res, next)=>{
    try{

        if(req.session.user){
            const userid = req.session.user.id; 
            const cart = await cartSchema.findOne({user: userid});
            const totalQuantity = cart?.items.reduce((sum , item)=> sum+ item.quantity,0);
            res.locals.cartQuantity = totalQuantity;
        }else {
            res.locals.cartQuantity = 0; 
        }

    }catch(error){
        logger.error("FETCH_CART_QUANTITY_ERROR", error),
        res.locals.cartQuantity = 0; 
    }

    next();

};



export default {fetchCartItems};
