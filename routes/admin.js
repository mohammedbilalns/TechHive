import express from "express";
import { Router } from "express";
import adminAuthController from "../controller/admin/adminAuthController.js";
import adminAuth from "../middlewares/adminAuth.js";
import adminCategoryController from "../controller/admin/adminCategoryController.js";
import adminProductController from "../controller/admin/adminProductsController.js";
import adminOrderController from "../controller/admin/adminOrdersController.js";
import adminCustomersController from "../controller/admin/adminCustomersController.js";
import adminCouponsController from "../controller/admin/adminCouponsController.js";
import adminOfferController from "../controller/admin/adminOffersController.js";
import adminSalesreportController from "../controller/admin/adminSalesReportController.js";
import adminDashboardController from "../controller/admin/adminDashboardController.js";
import adminOffersController from "../controller/admin/adminOffersController.js";

const router = Router();
router.use(express.static('static'));

//---- login routes ----
router.route('/login')
      .all(adminAuth.isLogin)
      .get(adminAuthController.loadLogin) // load login page 
      .post(adminAuthController.verifyLogin); // verify login 

router.use(adminAuth.checkSession);
router.get('/logout', adminAuthController.logoutAdmin);

//---- products routes ---- 
router.get('/products', adminProductController.getProducts); // get all products page 
router.delete('/products/delete/:productid', adminProductController.deleteProduct); // delete product 
router.post('/products/activate/:productid', adminProductController.activateProduct); // activate product 
router.post('/products/deactivate/:productid', adminProductController.deactivateProduct); // deactivate product 
router.route('/products/add')
      .get(adminProductController.getAddProduct) // get add product page 
      .post(adminProductController.productUpload.array('mainImages', 4), adminProductController.addProduct); // add product 
router.route('/products/edit/:productid')
      .get(adminProductController.getEditProduct) // get edit product page 
      .post(adminProductController.productUpload.array('mainImages', 4), adminProductController.editProduct);

//---- categories routes ----
router.get('/categories', adminCategoryController.getCategories); // get all categories page 
router.delete('/categories/:categoryid', adminCategoryController.deleteCategory); // delete category 
router.post('/categories/hide/:categoryid', adminCategoryController.hideCategory); // hide category 
router.post('/categories/unhide/:categoryid', adminCategoryController.unhideCategory); // unhide category 
router.post('/categories/new', adminCategoryController.addCategory); // add category 
router.post('/categories/edit/:categoryid', adminCategoryController.editCategory); // edit category 

//---- orders routes ----
router.get('/orders', adminOrderController.getOrders); // get all orders page 
router.post('/orders/:orderId/items/:itemId/update-status', adminOrderController.updateOrderItemStatus); // update order item status 

//---- coupons routes ----
router.get('/coupons', adminCouponsController.getCoupons); // get all coupons page 
router.post('/coupons', adminCouponsController.addCoupon); // add coupon 
router.route('/coupons/:couponId')
      .get(adminCouponsController.getCouponDetails) // get coupon details     
      .put(adminCouponsController.updateCoupon) // update coupon 
      .delete(adminCouponsController.deleteCoupon); // delete coupon 
router.patch('/coupons/:couponId/toggle-status', adminCouponsController.toggleCouponStatus); // toggle coupon status 

//---- offers routes ----
router.get('/offers', adminOfferController.getOffers); // get all offers page 
router.post('/offers', adminOfferController.addOffer); // add offer 
router.route('/offers/:offerId')
      .get(adminOfferController.getOfferDetails) // get offer details 
      .put(adminOfferController.updateOffer) // update offer 
      .delete(adminOfferController.deleteOffer); // delete offer 
router.patch('/offers/:offerId/toggle-status', adminOfferController.toggleOfferStatus); // toggle offer status 
router.post('/referral-settings', adminOffersController.updateReferralSettings); // update referral settings 

//---- sales report routes ----
router.get('/sales-report', adminSalesreportController.renderSalesReport); // render sales report page 
router.get('/sales-report/data', adminSalesreportController.getSalesReportData); // get sales report data 
router.get('/sales-report/download', adminSalesreportController.downloadReport); // download sales report 

//---- customers routes ----  
router.get('/customers', adminCustomersController.getCustomers); // get all customers page 
router.post('/customers/block/:customerid', adminCustomersController.blockCustomer); // block customer 
router.post('/customers/unblock/:customerid', adminCustomersController.unblockCustomer); // unblock customer 

// Dashboard routes
router.get('/dashboard', adminDashboardController.renderDashboard); // render dashboard page 
router.get('/dashboard/data', adminDashboardController.getDashboardData); // get dashboard data  

export default router;
