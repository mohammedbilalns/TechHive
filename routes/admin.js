import express from "express"
import { Router } from "express"
import adminController from "../controller/adminController.js"
import adminAuth from "../middlewares/adminAuth.js"

const router = Router()

router.use(express.static('static'))


//--login routes ---
router.get('/login', adminAuth.isLogin, adminController.loadLogin)
router.post('/login', adminAuth.isLogin, adminController.verifyLogin )


//-- customers routes----
router.get('/customers',  adminController.getCustomers) // add middleware to check session in this 

router.post('/customers/block/:customerid', adminController.blockCustomer)
router.post('/customers/unblock/:customerid', adminController.unblockCustomer)
export default router