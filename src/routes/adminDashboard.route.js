import {Router} from "express"
import { renderDashboard,getDashboardData } from "../controller/admin/adminDashboardController.js";

const router = Router();

router.get("/dashboard",renderDashboard); // render dashboard page
router.get("/dashboard/data",getDashboardData); // get dashboard data


export default router;
