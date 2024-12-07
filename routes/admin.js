import express from "express"
import { Router } from "express"
import adminController from "../controller/adminController.js"
import adminAuth from "../middlewares/adminAuth.js"
import multer from "multer"
import path from "path"

const router = Router()
router.use(express.static('static'));



//---- login routes ----
router.get('/login', adminAuth.isLogin, adminController.loadLogin)
router.post('/login', adminAuth.isLogin, adminController.verifyLogin )
router.get('/logout', adminAuth.isLogin ,adminController.logoutAdmin)

//---- customers routes ----
router.get('/customers',  adminController.getCustomers) // add middleware to check session in this 

router.post('/customers/block/:customerid',adminAuth.checkSession ,adminController.blockCustomer)
router.post('/customers/unblock/:customerid',adminAuth.checkSession ,adminController.unblockCustomer)


//---- categories routes ----
router.get('/categories', adminController.getCategories) // add middleware in this 
router.post('/categories/delete/:categoryid',adminAuth.checkSession,  adminController.deleteCategory)
router.post('/categories/hide/:categoryid',adminAuth.checkSession,  adminController.hideCategory)
router.post('/categories/unhide/:categoryid',adminAuth.checkSession,  adminController.unhideCategory)
router.post('/categories/new',adminAuth.checkSession,  adminController.addCategory)
router.post('/categories/edit/:categoryid',adminAuth.checkSession, adminController.editCategory)

//---- products routes ---- 
router.get('/products', adminController.getProducts)
router.get('/products/delete/:productid', adminController.deleteProduct)
router.post('/products/activate/:productid', adminController.activateProduct)
router.post('/products/deactivate/:productid', adminController.deactivateProduct)
router.get(`/products/add`,adminController.getAddProduct )
router.post('/products/add', adminController.productUpload.array('mainImages', 4), adminController.addProduct);


  
export default router