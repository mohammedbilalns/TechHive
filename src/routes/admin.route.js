import express from "express";
import { Router } from "express";
import { updateReferralSettings } from "../controller/admin/OfferManagementController.js";
import categoryManagementRouter from "./categoryManagement.route.js";
import couponManagementRouter from "./couponManagement.route.js";
import customerManagementRouter from "./customerManagement.route.js";
import offerManagementRouter from "./offerManagement.route.js";
import productManagementRouter from "./productManagement.route.js";
import adminDashboardRouter from "./adminDashboard.route.js";
import orderManagementRouter from "./orderManagement.route.js";
import salesReportRouter from "./salesReport.route.js";
import { renderAdminLoginPage } from "../controller/authentication/authViewsController.js";
import {
  loginAdmin,
  logoutAdmin,
} from "../controller/authentication/adminAuthController.js";
import {
  checkAdminSession,
  isAdminLoggedIn,
} from "../middlewares/adminAuth.js";

const router = Router();
router.use(express.static("static"));

//---- login routes ----
router
  .route("/auth/login")
  .all(isAdminLoggedIn)
  .get(renderAdminLoginPage) // load login page
  .post(loginAdmin); // verify login

router.use(checkAdminSession);
router.get("/auth/logout", logoutAdmin);
router.use("/products", productManagementRouter);
router.use("/categories", categoryManagementRouter);
router.use("/coupons", couponManagementRouter);
router.use("/offers", offerManagementRouter);
router.use("/customers", customerManagementRouter);
router.use("/dashboard", adminDashboardRouter);
router.use("/orders", orderManagementRouter);
router.use("/sales-report", salesReportRouter);
router.post("/referral-settings", updateReferralSettings);

export default router;
