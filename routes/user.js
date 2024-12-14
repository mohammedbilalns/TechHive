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

//---- User Authentication ----
router.route('/login') // login route
    .all(auth.isLogin)
     .get(userController.loadLogin)
     .post(userController.verifyLogin)

router.get('/logout',auth.checkSession, userController.logoutUser)
router.route('/signup') // signup route
    .all(auth.isLogin)
    .get(userController.loadSignup)
    .post(userController.registerUser)

router.post('/verify-otp', auth.isLogin, userController.verifyOTP) // verify user otp 
router.post('/resend-otp', auth.isLogin, userController.resendOTP) // resend otp 

router.get("/auth/google",auth.isLogin,  userController.authGoogle) // google oAuth 
router.get('/auth/google/callback',auth.isLogin, userController.authGoogleCallback)

router.route('/forgot-password') // user forgot passord 
    .all(auth.isLogin)
    .get(userController.loadForgotpassword)
    .post(userController.processForgotPassword)
router.post('/verify-forgot-password-otp', auth.isLogin, userController.verifyForgotPasswordOTP)
router.post('/resend-forgot-password-otp', auth.isLogin, userController.resendForgotPasswordOTP)

router.route('/reset-password') // user reset password 
    .all(auth.isLogin)
    .get(userController.loadResetpassword)
    .post(userController.resetPassword)

//---- user and product routes ---- 
router.get('/home', auth.checkSession, productController.loadHome)
router.get('/category/:id', productController.viewCategory)
router.get('/allproducts',  productController.loadAllProducts)
router.get('/product/:id',  productController.viewProduct)
router.get('/' , auth.isLogin, productController.loadLanding)


//---- user dashboard ---- 
router.get('profile/dashboard', auth.checkSession, userController.getDashboard)
router.get('/profile/account', auth.checkSession, userController.getAccountDetails) 
router.get('/profile/wishlist', auth.checkSession, userController.getWishlist)  
router.get('/profile/orders', auth.checkSession, userOrderController.getOrders);
router.get('/profile/wallet', auth.checkSession, userController.getWallet)  
router.get('/profile/addresses', auth.checkSession, addressController.getAddresses)



//---- user Address management ---- 
router.post('/account/add-address', auth.checkSession, addressController.addAddress); // add new address 

router.route('/account/address/:id')
  .all(auth.checkSession) 
  .put(addressController.updateAddress) // Update address
  .delete(addressController.deleteAddress) // Delete an address
  .get(addressController.getAddress); // Get single address details

  //---- user profile management ---- s
router.post('/account/update-profile', auth.checkSession, useraccountController.updateProfile)
router.post('/account/change-password', auth.checkSession, useraccountController.changePassword);


//---- usr cart management ---- 
router.get('/profile/cart', auth.checkSession, cartController.getCart)
router.post('/cart/add', auth.checkSession, cartController.addToCart)
router.post('/cart/update', auth.checkSession, cartController.updateQuantity)
router.post('/cart/remove', auth.checkSession, cartController.removeFromCart)
router.post('/cart/apply-coupon', auth.checkSession, cartController.applyCoupon)

//---- user checkout management ----
router.get('/checkout', auth.checkSession, checkoutController.getCheckout);
router.post('/order/place', auth.checkSession, userOrderController.placeOrder);


//---- user order management 
router.get('/order/success/:orderId', auth.checkSession, userOrderController.getOrderSuccess);
router.get('/profile/orders/:orderId', auth.checkSession, userOrderController.getOrderDetails);
router.post('/profile/orders/:orderId/cancel', auth.checkSession, userOrderController.cancelOrder);

//---- search products ----
router.get('/search', userSearchController.searchProducts);


export default router
