import express from "express"
import { Router } from "express"
import userAuthController from "../controller/user/userAuthController.js"
import auth from "../middlewares/auth.js"
import cartQuantity from "../middlewares/cartQuantity.js"
import userProductController from "../controller/user/userProductController.js"
import useraddressController from "../controller/user/useraddressController.js"
import useraccountController from "../controller/user/useraccountController.js"
import userCartController from "../controller/user/userCartcontroller.js"
import userCheckController from "../controller/user/userCheckoutController.js"
import userOrderController from "../controller/user/userOrderController.js"
import userSearchController from "../controller/user/userSearchController.js"
const router = Router()

router.use(express.static('static'))

//---- User Authentication ----
router.route('/login') // login route
    .all(auth.isLogin)
     .get(userAuthController.loadLogin)
     .post(userAuthController.verifyLogin)

router.get('/logout',auth.checkSession, userAuthController.logoutUser)

router.route('/signup') // signup route
    .all(auth.isLogin)
    .get(userAuthController.loadSignup)
    .post(userAuthController.registerUser)

router.post('/verify-otp', auth.isLogin, userAuthController.verifyOTP) // verify user otp 
router.post('/resend-otp', auth.isLogin, userAuthController.resendOTP) // resend otp 

router.get("/auth/google",auth.isLogin,  userAuthController.authGoogle) // google oAuth 
router.get('/auth/google/callback',auth.isLogin, userAuthController.authGoogleCallback)

router.route('/forgot-password') // user forgot passord 
    .all(auth.isLogin)
    .get(userAuthController.loadForgotpassword)
    .post(userAuthController.processForgotPassword)
router.post('/verify-forgot-password-otp', auth.isLogin, userAuthController.verifyForgotPasswordOTP)
router.post('/resend-forgot-password-otp', auth.isLogin, userAuthController.resendForgotPasswordOTP)

router.route('/reset-password') // user reset password 
    .all(auth.isLogin)
    .get(userAuthController.loadResetpassword)
    .post(userAuthController.resetPassword)

//---- user and product routes ---- 

router.use(cartQuantity.fetchCartQuantity) // middleware to set the cart Quantity 
router.get('/home', auth.checkSession, userProductController.loadHome)
router.get('/category/:id', userProductController.viewCategory)
router.get('/allproducts',  userProductController.loadAllProducts)
router.get('/product/:id',  userProductController.viewProduct)
router.get('/' , auth.isLogin, userProductController.loadLanding)


//---- user dashboard ---- 
router.get('profile/dashboard', auth.checkSession, userAuthController.getDashboard)
router.get('/profile/account', auth.checkSession, useraccountController.getAccountDetails) 
router.get('/profile/wishlist', auth.checkSession, userAuthController.getWishlist)  
router.get('/profile/orders', auth.checkSession, userOrderController.getOrders);
router.get('/profile/wallet', auth.checkSession, userAuthController.getWallet)  
router.get('/profile/addresses', auth.checkSession, useraddressController.getAddresses)



//---- user Address management ---- 
router.post('/account/add-address', auth.checkSession, useraddressController.addAddress); // add new address 

router.route('/account/address/:id')
  .all(auth.checkSession) 
  .put(useraddressController.updateAddress) // Update address
  .delete(useraddressController.deleteAddress) // Delete an address
  .get(useraddressController.getAddress); // Get single address details

  //---- user profile management ---- s
router.post('/account/update-profile', auth.checkSession, useraccountController.updateProfile)
router.post('/account/change-password', auth.checkSession, useraccountController.changePassword);


//---- usr cart management ---- 
router.get('/profile/cart', auth.checkSession, userCartController.getCart)
router.post('/cart/add', auth.checkSession, userCartController.addToCart)
router.post('/cart/update', auth.checkSession, userCartController.updateQuantity)
router.post('/cart/remove', auth.checkSession, userCartController.removeFromCart)
router.post('/cart/apply-coupon', auth.checkSession, userCartController.applyCoupon)

//---- user checkout management ----
router.get('/checkout', auth.checkSession, userCheckController.getCheckout);
router.post('/order/place', auth.checkSession, userOrderController.placeOrder);


//---- user order management 
router.get('/order/success/:orderId', auth.checkSession, userOrderController.getOrderSuccess);
router.get('/profile/orders/:orderId', auth.checkSession, userOrderController.getOrderDetails);
router.post('/profile/orders/:orderId/cancel', auth.checkSession, userOrderController.cancelOrder);

//---- search products ----
router.get('/search', userSearchController.searchProducts);


export default router
