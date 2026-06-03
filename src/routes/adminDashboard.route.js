import { Router } from "express";
import {
  renderDashboard,
  getDashboardData,
} from "../controller/admin/adminDashboardController.js";

const router = Router();

router.get("/", renderDashboard); // render dashboard page
router.get("/data", getDashboardData); // get dashboard data

export default router;
