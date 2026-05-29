import { Router } from "express";
import {
  getOrderSuccess,
  getOrders,
  getOrderDetails,
  cancelOrderItem,
  returnOrderItem,
  downloadInvoice,
  retryPayment,
} from "../controller/user/userOrdersController.js";

const router = Router();

router.get("/success/:orderId", getOrderSuccess); // get order success
router.get("/", getOrders); // get all orders page
router.get("/:orderId", getOrderDetails); // get single order details
router.post("/:orderId/items/:itemId/cancel", cancelOrderItem); // cancel ordered item
router.post("/:orderId/items/:itemId/return", returnOrderItem); // return ordered item
router.get("/:orderId/items/:itemId/invoice", downloadInvoice); // download invoice

router.post("/:orderId/retry-payment", retryPayment); // retry payment
export default router;
