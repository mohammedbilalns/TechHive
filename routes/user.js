import express from "express"
import { Router } from "express"
import userController from "../controller/userController.js"
import auth from "../middlewares/auth.js"

const router = Router()

router.use(express.static('static'))

// user login 
router.get('/login',auth.isLogin, userController.loadLogin)
//router.post('/login', userController.verifyLogin )
// user signup 
router.get('/signup', auth.isLogin, userController.loadSignup)
router.post('/signup', userController.registerUser)

//router.get('/verify-otp',auth.isLogin, userController.loadVerifyOtp )
//router.post('/verify-otp', auth.isLogin, userController.verifyOTP) // todo 
//router.post('/resend-otp',  userController.resendOTP)// todo 


//user logout 
//router.post('/logout', userController.logoutUser) //todo 

//home page 
//router.get('/home',auth.checkSession, userController.home)


//router.get('/forgotpassword', auth.isLogin, userController.loadForgotpassword)
//router.get('/resetpassword', auth.isLogin, userController.loadResetpassword)
//router.get('/forgotpasswordotp', auth.isLogin, userController.loadResetpasswordotp)
//router.get('/signupotp', auth.isLogin , userController.loadSignupotp)
//router.get('/home', userController.loadHome)

export default router