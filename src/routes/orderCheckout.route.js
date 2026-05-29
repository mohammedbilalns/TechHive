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

router.get("/checkout", renderOrderCheckoutPage); // get checkout
router.post("/checkout/placeorder", placeOrder); // place order
router.post("/checkout/verifypayment", verifyPayment); // verify payment
router.post("/checkout/apply-coupon", applyCoupon); // apply coupon
router.post("/checkout/remove-coupon", removeCoupon); // remove coupon
router.get("/checkout/failed/:orderId", renderPaymentFailedPage); // get payment failed

export default router;
