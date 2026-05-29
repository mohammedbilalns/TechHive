import { Router } from "express";
// middlewares
import { checkUserSession, isUserLoggedIn } from "../middlewares/userauth.js";
import cartItems from "../middlewares/cartItems.js";
import wishlistItems from "../middlewares/wishlistItems.js";
import averageRatings from "../middlewares/averageRatings.js";
import { renderHomePage,renderLandingPage, renderProductPage,renderCategoryPage,renderAllProductsPage } from "../controller/user/ProductsController.js";
import userSearchController from "../controller/user/userSearchController.js";
import { renderUserCouponsPage } from "../controller/user/userCouponsController.js";
import * as notfoundController from "../controller/user/notFoundController.js";
import userCartRouter from "./userCart.route.js";
import userWishlistRouter from "./userWishlist.route.js";
import userWalletRouter from "./userWallet.route.js";
import productReviewRouter from "./productReview.route.js";
import userOrderRouter from "./userOrders.route.js";
import userAddressRouter from "./userAddressManagement.route.js";
import userAccountRouter from "./userAccountManagement.route.js";
import userCheckoutRouter from "./orderCheckout.route.js";
import userAuthRouter from "./userAuthRouter.js";

const router = Router();

router.use("/auth", userAuthRouter);
router.get("/notfound", notfoundController.renderNotFoundPage); 

//---- products  routes ----
router.use(cartItems.fetchCartItems); // middleware to set the cart Quantity
router.use(wishlistItems.fetchWishlistItems); // middleware to set the wishlist Quantity
router.get(
  "/category/:id",
  averageRatings.calculateAverageRatings,
  renderCategoryPage
); // view category page
router.get(
  "/allproducts",
  averageRatings.calculateAverageRatings,
  renderAllProductsPage
); // load all products page
router.get(
  "/product/:id",
  averageRatings.calculateAverageRatings,
  renderProductPage
); // view product page
router.get(
  "/",
  isUserLoggedIn,
  averageRatings.calculateAverageRatings,
  renderLandingPage
); // load landing page
router.get(
  "/search",
  averageRatings.calculateAverageRatings,
  userSearchController.searchProducts,
); // search products
router.get("/api/search", userSearchController.searchProducts); // search products
router.use(checkUserSession);
router.get(
  "/home",
  averageRatings.calculateAverageRatings,
renderHomePage
); // load home page

//---- user profile management ----
router.use("/cart", userCartRouter);
router.use("/wishlist", userWishlistRouter);
router.use("/wallet", userWalletRouter);
router.use("/review", productReviewRouter);
router.use("/orders", userOrderRouter);
router.use("/addresses", userAddressRouter);
router.use("/account", userAccountRouter);
router.use("/checkout", userCheckoutRouter);
router.get("/coupons", renderUserCouponsPage);

export default router;
