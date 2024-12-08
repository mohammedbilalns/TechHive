import express from "express"
import { Router } from "express"
import userController from "../controller/userController.js"
import auth from "../middlewares/auth.js"


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

// User Home
router.get('/home', auth.checkSession, userController.loadHome)
//router.get('/forgot-password', userController.loadForgotpassword)
//router.post('/forgot-password', userController.validateReset)
router.get('/forgot-password', userController.loadForgotpassword);
router.post('/forgot-password', userController.processForgotPassword);
router.post('/verify-forgot-password-otp', userController.verifyForgotPasswordOTP);
router.post('/resend-forgot-password-otp', userController.resendForgotPasswordOTP);
router.get('/reset-password', userController.loadResetpassword);
router.post('/reset-password', userController.resetPassword);


router.get('/allproducts',  userController.loadAllProducts)

// Add this new route
router.get('/product/:id',  userController.viewProduct)
router.get('/' , auth.isLogin, userController.loadLanding)
export default router
