import { UserModel } from "../model/userModel.js";

export const getPageNumber = (value, fallback = 1) => {
  const page = Number.parseInt(value, 10);
  return Number.isNaN(page) || page < 1 ? fallback : page;
};

export const getPaginationMeta = (page, totalItems, limit) => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    skip: (page - 1) * limit,
  };
};

export const getSessionUserId = (req) => req.session.user.id;

export const getUserFromSession = (req) =>
  UserModel.findById(getSessionUserId(req));

export const calculateCartTotals = (items = [], appliedDiscount = 0) => {
  const totals = items.reduce(
    (acc, item) => {
      const itemOriginalPrice = item.productId.price * item.quantity;
      const discountedPrice =
        itemOriginalPrice * (1 - item.productId.discount / 100);

      acc.originalPrice += itemOriginalPrice;
      acc.subtotal += discountedPrice;
      acc.totalQuantity += item.quantity;

      return acc;
    },
    {
      subtotal: 0,
      originalPrice: 0,
      totalQuantity: 0,
    },
  );

  const totalDiscount = totals.originalPrice - totals.subtotal;
  const total = totals.subtotal - appliedDiscount;

  return {
    ...totals,
    totalDiscount,
    totalSavings: totalDiscount,
    total,
  };
};

export const getCouponUsageCount = (coupon, userId) => {
  return (
    coupon.usageHistory?.filter(
      (history) => history.userId?.toString() === userId.toString(),
    ).length || 0
  );
};

export const getCouponUsageForUser = (coupon, userId) => {
  return coupon.usageHistory?.find(
    (usage) => usage.userId?.toString() === userId.toString(),
  );
};

export const calculateCouponDiscount = (coupon, subtotal) => {
  if (coupon.discountType === "PERCENTAGE") {
    const percentageDiscount = (subtotal * coupon.discountValue) / 100;
    return coupon.maxDiscount
      ? Math.min(percentageDiscount, coupon.maxDiscount)
      : percentageDiscount;
  }

  return coupon.discountValue;
};

export const mapUserResponse = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  const { password, otp, __v, ...sanitizedUser } = userObj;
  return sanitizedUser;
};
