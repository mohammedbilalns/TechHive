import express from "express"
import { Router } from "express"
// middlewares
import auth from "../middlewares/auth.js"
import cartItems from "../middlewares/cartItems.js"
import wishlistItems from "../middlewares/wishlistItems.js"
import averageRatings from "../middlewares/averageRatings.js"
// controllers
import userAuthController from "../controller/user/userAuthController.js"
import userProductController from "../controller/user/userProductsController.js"
import useraddressController from "../controller/user/useraddressController.js"
import useraccountController from "../controller/user/userAccountController.js"
import userCartController from "../controller/user/userCartController.js"
import userCheckController from "../controller/user/userCheckoutController.js"
import userOrderController from "../controller/user/userOrdersController.js"
import userSearchController from "../controller/user/userSearchController.js"
import userWishlistController from "../controller/user/userWishlistController.js"
import userCouponsController from "../controller/user/userCouponsController.js"
import userWalletController from "../controller/user/userWalletController.js"
import userReviewController from "../controller/user/userReviewsController.js"
import notfoundController from "../controller/user/notFoundController.js"

const router = Router()

//---- User Authentication ----
router.route('/login')
    .all(auth.isLogin)
    .get(userAuthController.loadLogin) // load login page
    .post(userAuthController.verifyLogin) // verify login 
router.get('/logout', auth.checkSession, userAuthController.logoutUser) // logout user 
router.route('/signup')
    .all(auth.isLogin)
    .get(userAuthController.loadSignup) // load signup page 
    .post(userAuthController.registerUser) // register user 

router.post('/verify-otp', auth.isLogin, userAuthController.verifyOTP) // verify user otp 
router.post('/resend-otp', auth.isLogin, userAuthController.resendOTP) // resend otp 
router.get("/auth/google", auth.isLogin, userAuthController.authGoogle) // google oAuth 
router.get('/auth/google/callback', auth.isLogin, userAuthController.authGoogleCallback) // google oAuth callback 
router.route('/forgot-password') // user forgot password 
    .all(auth.isLogin)
    .get(userAuthController.loadForgotpassword) // load forgot password page 
    .post(userAuthController.processForgotPassword) // process forgot password 
router.post('/verify-forgot-password-otp', auth.isLogin, userAuthController.verifyForgotPasswordOTP) // verify forgot password otp 
router.post('/resend-forgot-password-otp', auth.isLogin, userAuthController.resendForgotPasswordOTP) // resend forgot password otp 
router.patch('/reset-password', auth.isLogin, userAuthController.resetPassword) //  reset password 
router.post('/apply-referral', auth.checkSession, userAuthController.applyReferral); // apply referral code 
router.get('/notfound', notfoundController.loadNotfound) // load not found page 

//---- products  routes ---- 
router.use(cartItems.fetchCartItems) // middleware to set the cart Quantity 
router.use(wishlistItems.fetchWishlistItems) // middleware to set the wishlist Quantity 
router.get('/category/:id', averageRatings.calculateAverageRatings, userProductController.viewCategory) // view category page 
router.get('/allproducts', averageRatings.calculateAverageRatings, userProductController.loadAllProducts) // load all products page 
router.get('/product/:id', averageRatings.calculateAverageRatings, userProductController.viewProduct) // view product page 
router.get('/', auth.isLogin, averageRatings.calculateAverageRatings, userProductController.loadLanding) // load landing page 
router.get('/search', averageRatings.calculateAverageRatings, userSearchController.searchProducts); // search products 
router.get('/api/search', userSearchController.searchProducts); // search products 
router.get('/home', auth.checkSession, averageRatings.calculateAverageRatings, userProductController.loadHome) // load home page 

//---- user Address management ---- 
router.route('/addresses')
    .all(auth.checkSession)
    .get(useraddressController.getAddresses) // get all addresses 
    .post(useraddressController.addAddress) // add address 
router.route('/address/:id')
    .all(auth.checkSession)
    .put(useraddressController.updateAddress)
    .delete(useraddressController.deleteAddress)
    .get(useraddressController.getAddress);

//---- user profile management ---- 
router.get('/account', auth.checkSession, useraccountController.getAccountDetails) // get account details 
router.post('/account/update-profile', auth.checkSession, useraccountController.updateProfile) // update profile 
router.post('/account/change-password', auth.checkSession, useraccountController.changePassword); // change password 

//---- user cart management ---- 
router.route('/cart')
    .all(auth.checkSession)
    .get(userCartController.getCart) // get cart    
    .post(userCartController.addToCart) // add to cart 
    .patch(userCartController.updateQuantity) // update quantity 
router.delete('/cart/:productId', auth.checkSession, userCartController.removeFromCart) // remove from cart 
router.post('/cart/clear', auth.checkSession, userCartController.clearCart) // clear cart 

//---- user checkout/order management ----
router.get('/checkout', auth.checkSession, userCheckController.getCheckout); // get checkout 
router.post('/checkout/placeorder', auth.checkSession, userOrderController.placeOrder); // place order 
router.post('/checkout/verifypayment', auth.checkSession, userOrderController.verifyPayment); // verify payment 
router.post('/checkout/apply-coupon', auth.checkSession, userCheckController.applyCoupon); // apply coupon  
router.post('/checkout/remove-coupon', auth.checkSession, userCheckController.removeCoupon); // remove coupon 
router.get('/order/success/:orderId', auth.checkSession, userOrderController.getOrderSuccess); // get order success 
router.get('/orders', auth.checkSession, userOrderController.getOrders); // get all orders page 
router.get('/orders/:orderId', auth.checkSession, userOrderController.getOrderDetails); // get single order details 
router.post('/orders/:orderId/items/:itemId/cancel', auth.checkSession, userOrderController.cancelOrderItem); // cancel ordered item 
router.post('/orders/:orderId/items/:itemId/return', auth.checkSession, userOrderController.returnOrderItem); // return ordered item 
router.get('/orders/:orderId/items/:itemId/invoice',auth.checkSession,userOrderController.downloadInvoice); // download invoice 
router.post('/orders/:orderId/retry-payment', auth.checkSession, userOrderController.retryPayment); // retry payment  
router.get('/payment/failed/:orderId', auth.checkSession, userOrderController.getPaymentFailed); // get payment failed 
router.post('/review/add', auth.checkSession, userReviewController.addReview); // add review 
router.get('/review/get', auth.checkSession, userReviewController.getReview); // get review 

//---- wishlist management ----
router.route('/wishlist')
    .all(auth.checkSession)
    .get(userWishlistController.getWishlist) // get wishlist 
    .post(userWishlistController.addToWishlist) // add to wishlist 
    .put(userWishlistController.removeFromWishlist) // remove from wishlist 

//---- user coupons ----
router.get('/coupons', auth.checkSession, userCouponsController.getCoupons);

//---- Wallet management ----
router.route('/wallet')
    .all(auth.checkSession)
    .get(userWalletController.getWallet) // get wallet 
    .post(userWalletController.addMoney) // add money to the wallet 
router.post('/wallet/verify-payment', auth.checkSession, userWalletController.verifyWalletPayment) // verify wallet payment 

export default router
