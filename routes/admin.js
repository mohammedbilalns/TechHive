import express from "express"
import { Router } from "express"
import adminController from "../controller/adminController.js"
import adminAuth from "../middlewares/adminAuth.js"
import categoryController from "../controller/categoryController.js"

const router = Router()
router.use(express.static('static'));



//---- login routes ----

router.route('/login')
    .all(adminAuth.isLogin)
    .get(adminController.loadLogin)
    .post(adminController.verifyLogin)

router.use(adminAuth.checkSession)
router.get('/logout', adminController.logoutAdmin)

//---- customers routes ----
router.get('/customers', adminController.getCustomers) 
router.post('/customers/block/:customerid', adminController.blockCustomer)
router.post('/customers/unblock/:customerid', adminController.unblockCustomer)


//---- categories routes ----
router.get('/categories', categoryController.getCategories) 
router.post('/categories/delete/:categoryid', categoryController.deleteCategory)
router.post('/categories/hide/:categoryid', categoryController.hideCategory)
router.post('/categories/unhide/:categoryid', categoryController.unhideCategory)
router.post('/categories/new', categoryController.addCategory)
router.post('/categories/edit/:categoryid', categoryController.editCategory)

//---- products routes ---- 
router.get('/products', adminController.getProducts)
router.get('/products/delete/:productid', adminController.deleteProduct)
router.post('/products/activate/:productid', adminController.activateProduct)
router.post('/products/deactivate/:productid', adminController.deactivateProduct)
router.get(`/products/add`, adminController.getAddProduct)
router.post('/products/add', adminController.productUpload.array('mainImages', 4), adminController.addProduct);
router.get('/products/edit/:productid', adminController.getEditProduct);
router.post('/products/edit/:productid', adminController.productUpload.array('mainImages', 4), adminController.editProduct);


export default router

