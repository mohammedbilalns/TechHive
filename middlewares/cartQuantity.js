import cartSchema from "../model/cartModel.js"
import {log} from "mercedlogger"

const fetchCartQuantity = async (req,res, next)=>{
    try{

        if(req.session.user){
            const userid = req.session.user.id 
            const cart = await cartSchema.findOne({user: userid})
            const totalQuantity = cart.items.reduce((sum , item)=> sum+ item.quantity,0)
            res.locals.cartQuantity = totalQuantity
            console.log("reached line 15 ")
        }else {
            res.locals.cartQuantity = 0 
        }

    }catch(error){
        log.red("FETCH_CART_QUANTITY_ERROR", error),
        res.locals.cartQuantity = 0 
    }

    next()

}



export default {fetchCartQuantity}
