import { Router } from "express";
import {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
} from "../controller/user/userCartController.js";
const router = Router();

router
  .route("/")
  .get(getCart) // get cart
  .post(addToCart) // add to cart
  .patch(updateQuantity); // update quantity
router.delete("/:productId", removeFromCart); // remove from cart
router.post("/clear", clearCart); // clear cart

export default router;
