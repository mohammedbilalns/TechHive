import { Router } from "express";
import { getOrders, updateOrderItemStatus } from "../controller/admin/OrderManagementController.js";

const router = Router();
router.get("/", getOrders); // get all orders page
router.post(
  "/:orderId/items/:itemId/update-status",
  updateOrderItemStatus,
); // update order item status

export default router;
