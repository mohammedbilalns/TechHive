import express from "express"
import { Router } from "express"
import adminAuthController from "../controller/admin/adminAuthController.js"
import adminAuth from "../middlewares/adminAuth.js"
import adminCategoryController from "../controller/admin/adminCategoryController.js"
import adminProductController from "../controller/admin/adminProductController.js"
import adminOrderController from "../controller/admin/adminOrderController.js"
import adminCustomersController from "../controller/admin/adminCustomersController.js"
import adminCouponsController from "../controller/admin/adminCouponsController.js"
import adminOfferController from "../controller/admin/adminOfferController.js"
import adminSalesreportController from "../controller/admin/adminSalesreportController.js"
const router = Router()
router.use(express.static('static'));



//---- login routes ----

router.route('/login')
    .all(adminAuth.isLogin)
    .get(adminAuthController.loadLogin)
    .post(adminAuthController.verifyLogin)

router.use(adminAuth.checkSession)
router.get('/logout', adminAuthController.logoutAdmin)


//---- products routes ---- 
router.get('/products', adminProductController.getProducts)
router.delete('/products/delete/:productid', adminProductController.deleteProduct)
router.post('/products/activate/:productid', adminProductController.activateProduct)
router.post('/products/deactivate/:productid', adminProductController.deactivateProduct)
router.get(`/products/add`, adminProductController.getAddProduct)
router.post('/products/add', adminProductController.productUpload.array('mainImages', 4), adminProductController.addProduct);
router.get('/products/edit/:productid', adminProductController.getEditProduct);
router.post('/products/edit/:productid', adminProductController.productUpload.array('mainImages', 4), adminProductController.editProduct);


//---- categories routes ----
router.get('/categories', adminCategoryController.getCategories)
router.delete('/categories/:categoryid', adminCategoryController.deleteCategory)
router.post('/categories/hide/:categoryid', adminCategoryController.hideCategory)
router.post('/categories/unhide/:categoryid', adminCategoryController.unhideCategory)
router.post('/categories/new', adminCategoryController.addCategory)
router.post('/categories/edit/:categoryid', adminCategoryController.editCategory)


//---- orders routes ----
router.get('/orders', adminOrderController.getOrders)
router.post('/orders/:orderId/items/:itemId/update-status', adminOrderController.updateOrderItemStatus);

//---- coupons routes ----
router.get('/coupons', adminCouponsController.getCoupons)
router.get('/coupons/:couponId', adminCouponsController.getCouponDetails)
router.post('/coupons', adminCouponsController.addCoupon)
router.put('/coupons/:couponId', adminCouponsController.updateCoupon)
router.patch('/coupons/:couponId/toggle-status', adminCouponsController.toggleCouponStatus)
router.delete('/coupons/:couponId', adminCouponsController.deleteCoupon)

//---- offers routes ----
router.get('/offers', adminOfferController.getOffers)
router.get('/offers/:offerId', adminOfferController.getOfferDetails)
router.post('/offers', adminOfferController.addOffer)
router.put('/offers/:offerId', adminOfferController.updateOffer)
router.patch('/offers/:offerId/toggle-status', adminOfferController.toggleOfferStatus)
router.delete('/offers/:offerId', adminOfferController.deleteOffer)

//---- sales report routes ----
router.get('/sales-report', adminSalesreportController.renderSalesReport)
router.get('/sales-report/data', adminSalesreportController.getSalesReportData)
router.get('/sales-report/download', adminSalesreportController.downloadReport)


//---- customers routes ----
router.get('/customers', adminCustomersController.getCustomers)
router.post('/customers/block/:customerid', adminCustomersController.blockCustomer)
router.post('/customers/unblock/:customerid', adminCustomersController.unblockCustomer)


export default router

