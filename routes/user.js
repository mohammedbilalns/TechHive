import express from "express"
import { Router } from "express"
import userController from "../controller/userController.js"
import auth from "../middlewares/auth.js"
import productController from "../controller/productController.js"
import addressController from "../controller/addressController.js"
import useraccountController from "../controller/useraccountController.js"
import cartController from "../controller/userCartcontroller.js"
import checkoutController from "../controller/checkoutController.js"
import userOrderController from "../controller/userOrderController.js"
import userSearchController from "../controller/userSearchController.js"
const router = Router()

router.use(express.static('static'))

// User Login
router.get('/login', auth.isLogin, userController.loadLogin)
router.post('/login',auth.isLogin, userController.verifyLogin)
router.get('/logout',auth.checkSession, userController.logoutUser)

// User Signup
router.get('/signup', auth.isLogin, userController.loadSignup)
router.post('/signup', auth.isLogin, userController.registerUser)
router.post('/verify-otp', auth.isLogin, userController.verifyOTP)
router.post('/resend-otp', auth.isLogin, userController.resendOTP)
// Google OAuth
router.get("/auth/google",auth.isLogin,  userController.authGoogle)
router.get('/auth/google/callback',auth.isLogin, userController.authGoogleCallback)
// User Reset Password
router.get('/forgot-password', auth.isLogin, userController.loadForgotpassword);
router.post('/forgot-password', auth.isLogin, userController.processForgotPassword);
router.post('/verify-forgot-password-otp', auth.isLogin, userController.verifyForgotPasswordOTP);
router.post('/resend-forgot-password-otp', auth.isLogin, userController.resendForgotPasswordOTP);
router.get('/reset-password', auth.isLogin, userController.loadResetpassword);
router.post('/reset-password', auth.isLogin, userController.resetPassword);

// basic user and product routes
router.get('/home', auth.checkSession, productController.loadHome)
router.get('/category/:id', productController.viewCategory)
router.get('/allproducts',  productController.loadAllProducts)
router.get('/product/:id',  productController.viewProduct)
router.get('/' , auth.isLogin, productController.loadLanding)


// router for user dashboard
router.get('profile/dashboard', auth.checkSession, userController.getDashboard)
router.get('/profile/account', auth.checkSession, userController.getAccountDetails) 
router.get('/profile/wishlist', auth.checkSession, userController.getWishlist)  
router.get('/profile/orders', auth.checkSession, userOrderController.getOrders);
router.get('/profile/orders/:orderId', auth.checkSession, userOrderController.getOrderDetails);
router.post('/profile/orders/:orderId/cancel', auth.checkSession, userOrderController.cancelOrder);
router.get('/profile/wallet', auth.checkSession, userController.getWallet)  


// Address Routess 
router.get('/profile/addresses', auth.checkSession, addressController.getAddresses)
router.post('/account/add-address', auth.checkSession, addressController.addAddress);
router.put('/account/address/:id', auth.checkSession, addressController.updateAddress);
router.delete('/account/address/:id', auth.checkSession, addressController.deleteAddress);
router.get('/account/address/:id', auth.checkSession, addressController.getAddress);
router.post('/account/update-profile', auth.checkSession, useraccountController.updateProfile)


// Cart Routes
router.get('/profile/cart', auth.checkSession, cartController.getCart)
router.post('/cart/add', auth.checkSession, cartController.addToCart)
router.post('/cart/update', auth.checkSession, cartController.updateQuantity)
router.post('/cart/remove', auth.checkSession, cartController.removeFromCart)
router.post('/cart/apply-coupon', auth.checkSession, cartController.applyCoupon)

router.get('/checkout', auth.checkSession, checkoutController.getCheckout);
router.post('/order/place', auth.checkSession, userOrderController.placeOrder);
router.get('/cart/totals', cartController.getTotals);
router.get('/order/success/:orderId', auth.checkSession, userOrderController.getOrderSuccess);

router.get('/search', userSearchController.searchProducts);


export default router
