import { Router } from "express";
import {
  renderUserWishlistPage,
  addToWishlist,
  removeFromWishlist,
} from "../controller/user/userWishlistController.js";

const router = Router();

router
  .route("/")
  .get(renderUserWishlistPage) // get wishlist
  .post(addToWishlist) // add to wishlist
  .put(removeFromWishlist); // remove from wishlist

export default router;
