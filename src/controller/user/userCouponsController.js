import { couponModel } from "../../model/couponModel.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { USER_VIEW_PATHS } from "../../constants/viewPaths.js";
import logger from "../../utils/logger.js";
import {
  getCouponUsageCount,
  getCouponUsageForUser,
  getPageNumber,
  getPaginationMeta,
  getSessionUserId,
} from "../../utils/controllerHelpers.js";

const getCoupons = asyncHandler(async (req, res) => {
  const currentDate = new Date();
  const userId = getSessionUserId(req);
  const page = getPageNumber(req.query.page);
  const limit = 9;

  const allCoupons = await couponModel
    .find({
      isActive: true,
    })
    .lean();

  const categorizedCoupons = {
    available: [],
    used: [],
    expired: [],
  };

  allCoupons.forEach((coupon) => {
    try {
      const expiryDate = new Date(coupon.expiryDate);
      const startDate = new Date(coupon.startDate);

      // Count usage count of this coupon
      const userUsageCount = getCouponUsageCount(coupon, userId);

      // Calculate remaining uses for this user
      const remainingUses = coupon.usageLimit - userUsageCount;
      const userUsage = getCouponUsageForUser(coupon, userId);

      if (expiryDate < currentDate) {
        categorizedCoupons.expired.push({
          ...coupon,
          usedDate: userUsage?.usedAt,
          remainingUses,
        });
        return;
      }

      if (startDate > currentDate) {
        return;
      }

      // push the used coupons
      if (remainingUses <= 0) {
        categorizedCoupons.used.push({
          ...coupon,
          usedDate: userUsage?.usedAt,
          remainingUses: 0,
        });
        return;
      }

      // push the available coupons
      categorizedCoupons.available.push({
        ...coupon,
        remainingUses,
        userUsedDate: userUsage?.usedAt,
      });
    } catch (err) {
      logger.error("COUPON_PROCESSING_ERROR", err);
    }
  });

  // Combine all coupons in  order
  const combinedCoupons = [
    ...categorizedCoupons.available,
    ...categorizedCoupons.used,
    ...categorizedCoupons.expired,
  ];

  const totalCoupons = combinedCoupons.length;
  const { totalPages, hasNextPage, hasPrevPage, skip } = getPaginationMeta(
    page,
    totalCoupons,
    limit,
  );

  const paginatedCoupons = combinedCoupons.slice(skip, skip + limit);

  res.render(USER_VIEW_PATHS.ProfileCoupons, {
    user: req.session.user,
    title: "My Coupons",
    page: "coupons",
    coupons: paginatedCoupons,
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    currentDate,
  });
});

export default {
  getCoupons,
};
