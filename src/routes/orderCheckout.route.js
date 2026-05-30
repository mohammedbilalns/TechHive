import { Router } from "express";
import {
  renderPaymentFailedPage,
  placeOrder,
  verifyPayment,
} from "../controller/user/userOrdersController.js";
import {
  renderOrderCheckoutPage,
  removeCoupon,
  applyCoupon,
} from "../controller/user/userCheckoutController.js";

const router = Router();

router.get("/", renderOrderCheckoutPage); // get checkout
router.post("/placeorder", placeOrder); // place order
router.post("/verifypayment", verifyPayment); // verify payment
router.post("/apply-coupon", applyCoupon); // apply coupon
router.post("/remove-coupon", removeCoupon); // remove coupon
router.get("/failed/:orderId", renderPaymentFailedPage); // get payment failed

export default router;
