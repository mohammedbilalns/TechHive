import {Router} from "express"
import { getCoupons,addCoupon,getCouponDetails,updateCoupon,deleteCoupon,toggleCouponStatus } from "../controller/admin/CouponsMangementController.js";

const router = Router();

router.get("/",getCoupons); // get all coupons page
router.post("/",addCoupon); // add coupon
router
  .route("/:couponId")
  .get(getCouponDetails) // get coupon details
  .put(updateCoupon) // update coupon
  .delete(deleteCoupon); // delete coupon
router.patch(
  "/:couponId/toggle-status",
  toggleCouponStatus,
); // toggle coupon status



export default router;
