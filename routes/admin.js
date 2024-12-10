import express from "express"
import { Router } from "express"
import adminAuthController from "../controller/adminAuthController.js"
import adminAuth from "../middlewares/adminAuth.js"
import adminCategoryController from "../controller/adminCategoryController.js"
import adminProductController from "../controller/adminProductController.js"
const router = Router()
router.use(express.static('static'));



//---- login routes ----

router.route('/login')
    .all(adminAuth.isLogin)
    .get(adminAuthController.loadLogin)
    .post(adminAuthController.verifyLogin)

router.use(adminAuth.checkSession)
router.get('/logout', adminAuthController.logoutAdmin)

//---- customers routes ----
router.get('/customers', adminAuthController.getCustomers) 
router.post('/customers/block/:customerid', adminAuthController.blockCustomer)
router.post('/customers/unblock/:customerid', adminAuthController.unblockCustomer)


//---- categories routes ----
router.get('/categories', adminCategoryController.getCategories) 
router.post('/categories/delete/:categoryid', adminCategoryController.deleteCategory)
router.post('/categories/hide/:categoryid', adminCategoryController.hideCategory)
router.post('/categories/unhide/:categoryid', adminCategoryController.unhideCategory)
router.post('/categories/new', adminCategoryController.addCategory)
router.post('/categories/edit/:categoryid', adminCategoryController.editCategory)

//---- products routes ---- 
router.get('/products', adminProductController.getProducts)
router.get('/products/delete/:productid', adminProductController.deleteProduct)
router.post('/products/activate/:productid', adminProductController.activateProduct)
router.post('/products/deactivate/:productid', adminProductController.deactivateProduct)
router.get(`/products/add`, adminProductController.getAddProduct)
router.post('/products/add', adminProductController.productUpload.array('mainImages', 4), adminProductController.addProduct);
router.get('/products/edit/:productid', adminProductController.getEditProduct);
router.post('/products/edit/:productid', adminProductController.productUpload.array('mainImages', 4), adminProductController.editProduct);


export default router

