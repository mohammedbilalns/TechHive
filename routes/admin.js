import express from "express"
import { Router } from "express"
import adminAuthController from "../controller/admin/adminAuthController.js"
import adminAuth from "../middlewares/adminAuth.js"
import adminCategoryController from "../controller/admin/adminCategoryController.js"
import adminProductController from "../controller/admin/adminProductsController.js"
import adminOrderController from "../controller/admin/adminOrdersController.js"
import adminCustomersController from "../controller/admin/adminCustomersController.js"
import adminCouponsController from "../controller/admin/adminCouponsController.js"
import adminOfferController from "../controller/admin/adminOffersController.js"
import adminSalesreportController from "../controller/admin/adminSalesReportController.js"
import adminDashboardController from "../controller/admin/adminDashboardController.js"
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
router.route('/products/add')
       .get(adminProductController.getAddProduct)
       .post(adminProductController.productUpload.array('mainImages',4), adminProductController.addProduct)
router.route('/products/edit/:productid')
       .get(adminProductController.getEditProduct)
       .post(adminProductController.productUpload.array('mainImages,4'), adminProductController.editProduct)


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
router.post('/coupons', adminCouponsController.addCoupon)
router.route('/coupons/:couponId')
      .get(adminCouponsController.getCouponDetails)
      .put(adminCouponsController.updateCoupon)
      .delete(adminCouponsController.deleteCoupon)
router.patch('/coupons/:couponId/toggle-status', adminCouponsController.toggleCouponStatus)

//---- offers routes ----
router.get('/offers', adminOfferController.getOffers)
router.post('/offers', adminOfferController.addOffer)
router.route('/offers/:offerId')
      .get(adminOfferController.getOfferDetails)
      .put(adminOfferController.updateOffer)
      .delete(adminOfferController.deleteOffer)
router.patch('/offers/:offerId/toggle-status', adminOfferController.toggleOfferStatus)

//---- sales report routes ----
router.get('/sales-report', adminSalesreportController.renderSalesReport)
router.get('/sales-report/data', adminSalesreportController.getSalesReportData)
router.get('/sales-report/download', adminSalesreportController.downloadReport)


//---- customers routes ----
router.get('/customers', adminCustomersController.getCustomers)
router.post('/customers/block/:customerid', adminCustomersController.blockCustomer)
router.post('/customers/unblock/:customerid', adminCustomersController.unblockCustomer)

// Dashboard routes
router.get('/dashboard', adminDashboardController.renderDashboard)
router.get('/dashboard/data', adminDashboardController.getDashboardData)

export default router

