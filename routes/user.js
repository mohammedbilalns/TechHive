import express from "express"
import { Router } from "express"
import userController from "../controller/userController.js"
import auth from "../middlewares/auth.js"
const router = Router()

router.use(express.static('static'))

router.get('/login',auth.isLogin, userController.loadLogin)
router.get('/signup', auth.isLogin, userController.loadSignup)
router.get('/forgotpassword', auth.isLogin, userController.loadForgotpassword)
router.get('/resetpassword', auth.isLogin, userController.loadResetpassword)
router.get('/forgotpasswordotp', auth.isLogin, userController.loadResetpasswordotp)
router.get('/signupotp', auth.isLogin , userController.loadSignupotp)
export default router