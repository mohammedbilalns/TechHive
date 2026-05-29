import { Router } from "express";
import {
  renderSalesReportPage,
  getSalesReportData,
  downloadReport,
} from "../controller/admin/SalesReportController.js";

const router = Router();
router.get("/",renderSalesReportPage); // render sales report page
router.get("/data", getSalesReportData); // get sales report data
router.get("/download", downloadReport); // download sales report

export default router;
