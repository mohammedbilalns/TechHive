import { Router } from "express";
// middlewares
import { checkUserSession, isUserLoggedIn } from "../middlewares/userauth.js";
import cartItems from "../middlewares/cartItems.js";
import wishlistItems from "../middlewares/wishlistItems.js";
import averageRatings from "../middlewares/averageRatings.js";
// controllers
import * as userAuthController from "../controller/authentication/userAuthController.js";
import * as AuthViewsController from "../controller/authentication/authViewsController.js";
import userProductController from "../controller/user/userProductsController.js";
import * as useraddressController from "../controller/user/useraddressController.js";
import * as useraccountController from "../controller/user/userAccountController.js";
import userCartController from "../controller/user/userCartController.js";
import userCheckController from "../controller/user/userCheckoutController.js";
import userOrderController from "../controller/user/userOrdersController.js";
import userSearchController from "../controller/user/userSearchController.js";
import userWishlistController from "../controller/user/userWishlistController.js";
import userCouponsController from "../controller/user/userCouponsController.js";
import userWalletController from "../controller/user/userWalletController.js";
import userReviewController from "../controller/user/userReviewsController.js";
import * as notfoundController from "../controller/user/notFoundController.js";

const router = Router();

//---- User Authentication ----
router.route('/login')
    .all(isUserLoggedIn)
    .get(AuthViewsController.renderLoginPage) // load login page
    .post(userAuthController.verifyLogin); // verify login 
router.get('/logout',checkUserSession, userAuthController.logoutUser); // logout user 
router.route('/signup')
    .all(isUserLoggedIn)
    .get(AuthViewsController.renderSignupPage) // load signup page 
    .post(userAuthController.registerUser); // register user 

router.post('/verify-otp', isUserLoggedIn, userAuthController.verifyOTP); // verify user otp 
router.post('/resend-otp', isUserLoggedIn, userAuthController.resendOTP); // resend otp 
router.get("/auth/google", isUserLoggedIn, userAuthController.authGoogle); // google oAuth 
router.get('/auth/google/callback', isUserLoggedIn, userAuthController.authGoogleCallback); // google oAuth callback 
router.route('/forgot-password') // user forgot password 
    .all(isUserLoggedIn)
    .get(userAuthController.loadForgotpassword) // load forgot password page 
    .post(userAuthController.processForgotPassword); // process forgot password 
router.post('/verify-forgot-password-otp', isUserLoggedIn, userAuthController.verifyForgotPasswordOTP); // verify forgot password otp 
router.post('/resend-forgot-password-otp', isUserLoggedIn, userAuthController.resendForgotPasswordOTP); // resend forgot password otp 
router.patch('/reset-password', isUserLoggedIn, userAuthController.resetPassword); //  reset password 
router.post('/apply-referral', checkUserSession, userAuthController.applyReferral); // apply referral code 
router.get('/notfound', notfoundController.loadNotfound); // load not found page 

//---- products  routes ---- 
router.use(cartItems.fetchCartItems); // middleware to set the cart Quantity 
router.use(wishlistItems.fetchWishlistItems); // middleware to set the wishlist Quantity 
router.get('/category/:id', averageRatings.calculateAverageRatings, userProductController.viewCategory); // view category page 
router.get('/allproducts', averageRatings.calculateAverageRatings, userProductController.loadAllProducts); // load all products page 
router.get('/product/:id', averageRatings.calculateAverageRatings, userProductController.viewProduct); // view product page 
router.get('/', isUserLoggedIn, averageRatings.calculateAverageRatings, userProductController.loadLanding); // load landing page 
router.get('/search', averageRatings.calculateAverageRatings, userSearchController.searchProducts); // search products 
router.get('/api/search', userSearchController.searchProducts); // search products 
router.use(checkUserSession);
router.get('/home',  averageRatings.calculateAverageRatings, userProductController.loadHome); // load home page 

//---- user Address management ---- 
router.route('/addresses')
    .get(useraddressController.getAddresses) // get all addresses 
    .post(useraddressController.addAddress); // add address 
router.route('/address/:id')
    .put(useraddressController.updateAddress)
    .delete(useraddressController.deleteAddress)
    .get(useraddressController.getAddress);

//---- user profile management ---- 
router.get('/account',  useraccountController.getAccountDetails); // get account details 
router.post('/account/update-profile',useraccountController.updateProfile); // update profile 
router.post('/account/change-password', useraccountController.changePassword); // change password 

//---- user cart management ---- 
router.route('/cart')
    .get(userCartController.getCart) // get cart    
    .post(userCartController.addToCart) // add to cart 
    .patch(userCartController.updateQuantity); // update quantity 
router.delete('/cart/:productId',  userCartController.removeFromCart); // remove from cart 
router.post('/cart/clear', userCartController.clearCart); // clear cart 

//---- user checkout/order management ----
router.get('/checkout', userCheckController.getCheckout); // get checkout 
router.post('/checkout/placeorder', userOrderController.placeOrder); // place order 
router.post('/checkout/verifypayment',  userOrderController.verifyPayment); // verify payment 
router.post('/checkout/apply-coupon', userCheckController.applyCoupon); // apply coupon  
router.post('/checkout/remove-coupon',  userCheckController.removeCoupon); // remove coupon 
router.get('/order/success/:orderId',  userOrderController.getOrderSuccess); // get order success 
router.get('/orders', userOrderController.getOrders); // get all orders page 
router.get('/orders/:orderId',  userOrderController.getOrderDetails); // get single order details 
router.post('/orders/:orderId/items/:itemId/cancel',  userOrderController.cancelOrderItem); // cancel ordered item 
router.post('/orders/:orderId/items/:itemId/return', userOrderController.returnOrderItem); // return ordered item 
router.get('/orders/:orderId/items/:itemId/invoice', userOrderController.downloadInvoice); // download invoice 
router.post('/orders/:orderId/retry-payment', userOrderController.retryPayment); // retry payment  
router.get('/payment/failed/:orderId',  userOrderController.getPaymentFailed); // get payment failed 
router.post('/review/add', userReviewController.addReview); // add review 
router.get('/review/get', userReviewController.getReview); // get review 

//---- wishlist management ----
router.route('/wishlist')
    .get(userWishlistController.getWishlist) // get wishlist 
    .post(userWishlistController.addToWishlist) // add to wishlist 
    .put(userWishlistController.removeFromWishlist); // remove from wishlist 

//---- user coupons ----
router.get('/coupons', userCouponsController.getCoupons);

//---- Wallet management ----
router.route('/wallet')
    .get(userWalletController.getWallet) // get wallet 
    .post(userWalletController.addMoney); // add money to the wallet 
router.post('/wallet/verify-payment', userWalletController.verifyWalletPayment); // verify wallet payment 

export default router;
