import express from "express"
import { Router } from "express"
import userController from "../controller/userController.js"
import auth from "../middlewares/auth.js"
import passport from "passport"

const router = Router()

router.use(express.static('static'))

// user login 
router.get('/login', auth.isLogin, userController.loadLogin)
router.post('/login', userController.verifyLogin)
// user signup 
router.get('/signup', auth.isLogin, userController.loadSignup)
router.post('/signup', userController.registerUser)


router.post('/verify-otp', auth.isLogin, userController.verifyOTP)
//router.post('/resend-otp',  userController.resendOTP)// todo 


//user logout 
//router.post('/logout', userController.logoutUser) //todo 

//home page 
//router.get('/home',auth.checkSession, userController.home)


//router.get('/forgotpassword', auth.isLogin, userController.loadForgotpassword)
//router.get('/resetpassword', auth.isLogin, userController.loadResetpassword)
//router.get('/forgotpasswordotp', auth.isLogin, userController.loadResetpasswordotp)
//router.get('/signupotp', auth.isLogin , userController.loadSignupotp)
router.get('/home', auth.checkSession, userController.loadHome)

router.get("/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
   (req, res) =>{
    req.session.user = {
      id: req.user._id,
      fullname: req.user.fullname,
      email: req.user.email,
  };
  res.redirect('/home');
   }  );

export default router