import express from "express"
import { Router } from "express"
// middlewares
import auth from "../middlewares/auth.js"
import cartQuantity from "../middlewares/cartQuantity.js"
import wishlistItems from "../middlewares/wishlistItems.js"
import averageRatings from "../middlewares/averageRatings.js"
// controllers
import userAuthController from "../controller/user/userAuthController.js"
import userProductController from "../controller/user/userProductController.js"
import useraddressController from "../controller/user/useraddressController.js"
import useraccountController from "../controller/user/useraccountController.js"
import userCartController from "../controller/user/userCartcontroller.js"
import userCheckController from "../controller/user/userCheckoutController.js"
import userOrderController from "../controller/user/userOrderController.js"
import userSearchController from "../controller/user/userSearchController.js"
import userWishlistController from "../controller/user/userWishlistController.js"
import userCouponsController from "../controller/user/userCouponsController.js"
import userWalletController from "../controller/user/userWalletController.js"
import userReviewController from "../controller/user/userReviewController.js"
import notfoundController from "../controller/user/notfoundController.js"

const router = Router()

router.use(express.static('static'))

//---- User Authentication ----
router.route('/login') // login route
    .all(auth.isLogin)
    .get(userAuthController.loadLogin)
    .post(userAuthController.verifyLogin)
router.get('/logout', auth.checkSession, userAuthController.logoutUser)
router.route('/signup') // signup route
    .all(auth.isLogin)
    .get(userAuthController.loadSignup)
    .post(userAuthController.registerUser)

router.post('/verify-otp', auth.isLogin, userAuthController.verifyOTP) // verify user otp 
router.post('/resend-otp', auth.isLogin, userAuthController.resendOTP) // resend otp 
router.get("/auth/google", auth.isLogin, userAuthController.authGoogle) // google oAuth 
router.get('/auth/google/callback', auth.isLogin, userAuthController.authGoogleCallback)
router.route('/forgot-password') // user forgot passord 
    .all(auth.isLogin)
    .get(userAuthController.loadForgotpassword)
    .post(userAuthController.processForgotPassword)
router.post('/verify-forgot-password-otp', auth.isLogin, userAuthController.verifyForgotPasswordOTP)
router.post('/resend-forgot-password-otp', auth.isLogin, userAuthController.resendForgotPasswordOTP)
router.patch('/reset-password', auth.isLogin, userAuthController.resetPassword) // user reset password 

router.get('/notfound', notfoundController.loadNotfound)

//---- user and product routes ---- 
router.use(cartQuantity.fetchCartQuantity) // middleware to set the cart Quantity 
router.get('/category/:id', wishlistItems.fetchWishlistItems, averageRatings.calculateAverageRatings, userProductController.viewCategory)
router.get('/allproducts', wishlistItems.fetchWishlistItems, averageRatings.calculateAverageRatings, userProductController.loadAllProducts)
router.get('/product/:id', wishlistItems.fetchWishlistItems, averageRatings.calculateAverageRatings, userProductController.viewProduct)
router.get('/', auth.isLogin, averageRatings.calculateAverageRatings, userProductController.loadLanding)
router.get('/search', wishlistItems.fetchWishlistItems, averageRatings.calculateAverageRatings, userSearchController.searchProducts);
router.get('/api/search', userSearchController.searchProducts);

// routes accessible only with session 
router.use(auth.checkSession)
router.get('/home', wishlistItems.fetchWishlistItems, averageRatings.calculateAverageRatings, userProductController.loadHome)

//---- user Address management ---- 
router.route('/addresses')
    .get(useraddressController.getAddresses)
    .post(useraddressController.addAddress)
router.route('/address/:id')
    .put(useraddressController.updateAddress) // Update address
    .delete(useraddressController.deleteAddress) // Delete an address
    .get(useraddressController.getAddress); // Get single address details

//---- user profile management ---- 
router.get('/account', useraccountController.getAccountDetails)
router.post('/account/update-profile', useraccountController.updateProfile)
router.post('/account/change-password', useraccountController.changePassword);

//---- user cart management ---- 
router.route('/cart')
    .get(userCartController.getCart)
    .post(userCartController.addToCart)
    .patch(userCartController.updateQuantity)
    .put(userCartController.removeFromCart)
router.post('/cart/clear', userCartController.clearCart)

//---- user checkout/order management ----
router.get('/checkout', userCheckController.getCheckout);
router.post('/checkout/placeorder', userOrderController.placeOrder);
router.post('/checkout/verifypayment', userOrderController.verifyPayment);
router.get('/order/success/:orderId', userOrderController.getOrderSuccess);
router.get('/orders/:orderId', userOrderController.getOrderDetails);
router.post('/orders/:orderId/items/:itemId/cancel', userOrderController.cancelOrderItem);
router.get('/orders', userOrderController.getOrders);
router.post('/orders/:orderId/items/:itemId/return', userOrderController.returnOrderItem);
router.post('/review/add', userReviewController.addReview);
router.get('/review/get', userReviewController.getReview);

//---- wishlist management ----
router.route('/wishlist')
    .get(userWishlistController.getWishlist)
    .post(userWishlistController.addToWishlist)
    .put(userWishlistController.removeFromWishlist)
    
//---- user coupons ----
router.get('/coupons', userCouponsController.getCoupons);

//---- Wallet management ----
router.route('/wallet')
    .get(userWalletController.getWallet)
    .post(userWalletController.addMoney)
router.post('/wallet/verify-payment', userWalletController.verifyWalletPayment)

router.post('/checkout/apply-coupon', userCheckController.applyCoupon);
router.post('/checkout/remove-coupon', userCheckController.removeCoupon);

export default router
