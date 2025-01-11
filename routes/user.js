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
    .get(userAuthController.loadLogin)
    .post(userAuthController.verifyLogin)
router.get('/logout', auth.checkSession, userAuthController.logoutUser)
router.route('/signup')
    .all(auth.isLogin)
    .get(userAuthController.loadSignup)
    .post(userAuthController.registerUser)

router.post('/verify-otp', auth.isLogin, userAuthController.verifyOTP) // verify user otp 
router.post('/resend-otp', auth.isLogin, userAuthController.resendOTP) // resend otp 
router.get("/auth/google", auth.isLogin, userAuthController.authGoogle) // google oAuth 
router.get('/auth/google/callback', auth.isLogin, userAuthController.authGoogleCallback)
router.route('/forgot-password') // user forgot password 
    .all(auth.isLogin)
    .get(userAuthController.loadForgotpassword)
    .post(userAuthController.processForgotPassword)
router.post('/verify-forgot-password-otp', auth.isLogin, userAuthController.verifyForgotPasswordOTP)
router.post('/resend-forgot-password-otp', auth.isLogin, userAuthController.resendForgotPasswordOTP)
router.patch('/reset-password', auth.isLogin, userAuthController.resetPassword) // user reset password 
router.post('/apply-referral', auth.checkSession, userAuthController.applyReferral);
router.get('/notfound', notfoundController.loadNotfound)

//---- products  routes ---- 
router.use(cartItems.fetchCartItems) // middleware to set the cart Quantity 
router.use(wishlistItems.fetchWishlistItems) // middleware to set the wishlist Quantity 
router.get('/category/:id', averageRatings.calculateAverageRatings, userProductController.viewCategory)
router.get('/allproducts', averageRatings.calculateAverageRatings, userProductController.loadAllProducts)
router.get('/product/:id', averageRatings.calculateAverageRatings, userProductController.viewProduct)
router.get('/', auth.isLogin, averageRatings.calculateAverageRatings, userProductController.loadLanding)
router.get('/search', averageRatings.calculateAverageRatings, userSearchController.searchProducts);
router.get('/api/search', userSearchController.searchProducts);
router.get('/home', auth.checkSession, averageRatings.calculateAverageRatings, userProductController.loadHome)

//---- user Address management ---- 
router.route('/addresses')
    .all(auth.checkSession)
    .get(useraddressController.getAddresses)
    .post(useraddressController.addAddress)
router.route('/address/:id')
    .all(auth.checkSession)
    .put(useraddressController.updateAddress)
    .delete(useraddressController.deleteAddress)
    .get(useraddressController.getAddress);

//---- user profile management ---- 
router.get('/account', auth.checkSession, useraccountController.getAccountDetails)
router.post('/account/update-profile', auth.checkSession, useraccountController.updateProfile)
router.post('/account/change-password', auth.checkSession, useraccountController.changePassword);

//---- user cart management ---- 
router.route('/cart')
    .all(auth.checkSession)
    .get(userCartController.getCart)
    .post(userCartController.addToCart)
    .patch(userCartController.updateQuantity)
router.delete('/cart/:productId', auth.checkSession, userCartController.removeFromCart)
router.post('/cart/clear', auth.checkSession, userCartController.clearCart)

//---- user checkout/order management ----
router.get('/checkout', auth.checkSession, userCheckController.getCheckout);
router.post('/checkout/placeorder', auth.checkSession, userOrderController.placeOrder);
router.post('/checkout/verifypayment', auth.checkSession, userOrderController.verifyPayment);
router.post('/checkout/apply-coupon', auth.checkSession, userCheckController.applyCoupon);
router.post('/checkout/remove-coupon', auth.checkSession, userCheckController.removeCoupon);
router.get('/order/success/:orderId', auth.checkSession, userOrderController.getOrderSuccess);
router.get('/orders', auth.checkSession, userOrderController.getOrders);
router.get('/orders/:orderId', auth.checkSession, userOrderController.getOrderDetails);
router.post('/orders/:orderId/items/:itemId/cancel', auth.checkSession, userOrderController.cancelOrderItem);
router.post('/orders/:orderId/items/:itemId/return', auth.checkSession, userOrderController.returnOrderItem);
router.get('/orders/:orderId/items/:itemId/invoice',auth.checkSession,userOrderController.downloadInvoice);
router.post('/orders/:orderId/retry-payment', auth.checkSession, userOrderController.retryPayment);
router.get('/payment/failed/:orderId', auth.checkSession, userOrderController.getPaymentFailed);
router.post('/review/add', auth.checkSession, userReviewController.addReview);
router.get('/review/get', auth.checkSession, userReviewController.getReview);

//---- wishlist management ----
router.route('/wishlist')
    .all(auth.checkSession)
    .get(userWishlistController.getWishlist)
    .post(userWishlistController.addToWishlist)
    .put(userWishlistController.removeFromWishlist)

//---- user coupons ----
router.get('/coupons', auth.checkSession, userCouponsController.getCoupons);

//---- Wallet management ----
router.route('/wallet')
    .all(auth.checkSession)
    .get(userWalletController.getWallet)
    .post(userWalletController.addMoney)
router.post('/wallet/verify-payment', auth.checkSession, userWalletController.verifyWalletPayment)

export default router
