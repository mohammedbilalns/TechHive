import { Router } from "express";
import {
  renderUserCartPage,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
} from "../controller/user/userCartController.js";
const router = Router();

router
  .route("/")
  .get(renderUserCartPage) // get cart
  .post(addToCart) // add to cart
  .patch(updateQuantity); // update quantity
router.delete("/:productId", removeFromCart); // remov,e from cart
router.post("/clear", clearCart); // clear cart

export default router;
