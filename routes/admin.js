import express from "express"
import { Router } from "express"
import adminController from "../controller/adminController.js"
import adminAuth from "../middlewares/adminAuth.js"
import Product from "../model/productModel.js"
import Category from "../model/categoryModel.js"
import multer from "multer"
import path from "path"
import fs from "fs"

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
router.post('/categories/delete/:categoryid',  adminController.deleteCategory)
router.post('/categories/hide/:categoryid', adminController.hideCategory)
router.post('/categories/unhide/:categoryid',  adminController.unhideCategory)
router.post('/categories/new',  adminController.addCategory)
router.post('/categories/edit/:categoryid', adminController.editCategory)

//---- products routes ---- 
router.get('/products', adminController.getProducts)
router.get('/products/delete/:productid', adminController.deleteProduct)
router.post('/products/activate/:productid', adminController.activateProduct)
router.post('/products/deactivate/:productid', adminController.deactivateProduct)
router.get(`/products/add`,adminController.getAddProduct )
router.post('/products/add', adminController.productUpload.array('mainImages', 4), adminController.addProduct);
router.get('/products/edit/:productid', adminController.getEditProduct);
router.post('/products/edit/:productid', adminController.productUpload.array('mainImages', 4), adminController.editProduct);

  
export default router

