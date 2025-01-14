import cartSchema from "../model/cartModel.js"
import {log} from "mercedlogger"

const fetchCartItems = async (req,res, next)=>{
    try{

        if(req.session.user){
            const userid = req.session.user.id 
            const cart = await cartSchema.findOne({user: userid})
            const cartItems = cart?.items.map(item => item.productId)
            const totalQuantity = cart?.items.reduce((sum , item)=> sum+ item.quantity,0)
            res.locals.cartQuantity = totalQuantity
        }else {
            res.locals.cartQuantity = 0 
        }

    }catch(error){
        log.red("FETCH_CART_QUANTITY_ERROR", error),
        res.locals.cartQuantity = 0 
    }

    next()

}



export default {fetchCartItems}