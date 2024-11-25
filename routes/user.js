import express from "express"
import { Router } from "express"
import userController from "../controller/userController.js"
import auth from "../middlewares/auth.js"
const router = Router()

router.use(express.static('static'))

router.get('/login',auth.isLogin, userController.loadLogin)
router.get('/signup', auth.isLogin, userController.loadSignup)

export default router