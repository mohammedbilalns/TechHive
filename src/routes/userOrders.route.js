import { Router } from "express";
import {
  renderUserOrdersPage,
  renderOrderSuccessPage,
  getOrderDetails,
  cancelOrderItem,
  returnOrderItem,
  downloadInvoice,
  retryPayment,
} from "../controller/user/userOrdersController.js";

const router = Router();

router.get("/success/:orderId", renderOrderSuccessPage); // get order success
//router.get("/order/success/:orderId", renderOrderSuccessPage); 
router.get("/", renderUserOrdersPage); // get all orders page
router.get("/:orderId", getOrderDetails); // get single order details
router.post("/:orderId/items/:itemId/cancel", cancelOrderItem); // cancel ordered item
router.post("/:orderId/items/:itemId/return", returnOrderItem); // return ordered item
router.get("/:orderId/items/:itemId/invoice", downloadInvoice); // download invoice

router.post("/:orderId/retry-payment", retryPayment); // retry payment
export default router;
