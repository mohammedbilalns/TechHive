import { Router } from "express";
import {
  renderOrderManagementPage,
  updateOrderItemStatus,
} from "../controller/admin/OrderManagementController.js";

const router = Router();
router.get("/",renderOrderManagementPage); // get all orders page
router.post("/:orderId/items/:itemId/update-status", updateOrderItemStatus); // update order item status

export default router;
