import { couponModel } from "../../model/couponModel.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/appError.js";
import { validateCoupon } from "../../validators/coupon.validator.js";
import { AdminCouponErrorMessages } from "../../constants/errorMessages.js";
import { CouponSuccessMessages } from "../../constants/successMessage.js";
import { ADMIN_VIEW_PATHS } from "../../constants/viewPaths.js";
import {
  getPageNumber,
  getPaginationMeta,
} from "../../utils/controllerHelpers.js";

// get the coupons page
export const getCoupons = asyncHandler(async (req, res) => {
  const page = getPageNumber(req.query.page);
  const limit = 10;

  const totalCoupons = await couponModel.countDocuments();
  const { totalPages, hasNextPage, hasPrevPage, skip } = getPaginationMeta(
    page,
    totalCoupons,
    limit,
  );

  const coupons = await couponModel
    .find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const now = new Date();
  coupons.forEach((coupon) => {
    coupon.isExpired = new Date(coupon.expiryDate) < now;
  });

  res.render(ADMIN_VIEW_PATHS.Coupons, {
    coupons,
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    page: "coupons",
  });
});

// get the coupon details for edit modal
export const getCouponDetails = asyncHandler(async (req, res) => {
  const coupon = await couponModel.findById(req.params.couponId);
  if (!coupon) {
    throw new AppError(HttpStatus.NOT_FOUND, AdminCouponErrorMessages.Notfound);
  }
  res.json({ success: true, coupon });
});

export const addCoupon = asyncHandler(async (req, res) => {
  const { error, value } = validateCoupon(req.body);
  if (error) {
    throw new AppError(HttpStatus.BAD_REQUEST, error);
  }

  const {
    code,
    description,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    usageLimit,
    startDate,
    expiryDate,
  } = value;

  // Check the coupon code already exists
  const existingCoupon = await couponModel.findOne({ code: code });
  if (existingCoupon) {
    throw new AppError(HttpStatus.CONFLICT, AdminCouponErrorMessages.Conflict);
  }

  const newCoupon = new couponModel({
    code,
    description,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount: discountType === "PERCENTAGE" ? maxDiscount : 0,
    usageLimit,
    startDate,
    expiryDate,
    isActive: true,
  });

  await newCoupon.save();
  res.json({
    success: true,
    message: CouponSuccessMessages.Created,
    couponId: newCoupon._id,
  });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const { error, value } = validateCoupon(req.body, true);
  if (error) {
    throw new AppError(HttpStatus.BAD_REQUEST, error);
  }

  const {
    code,
    description,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    usageLimit,
    startDate,
    expiryDate,
  } = value;

  // Check for duplicate coupon code
  const existingCoupon = await couponModel.findOne({
    code: code,
    _id: { $ne: req.params.couponId },
  });

  if (existingCoupon) {
    throw new AppError(HttpStatus.CONFLICT, AdminCouponErrorMessages.Conflict);
  }

  const updatedCoupon = await couponModel.findByIdAndUpdate(
    req.params.couponId,
    {
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount: discountType === "PERCENTAGE" ? maxDiscount : 0,
      usageLimit,
      startDate,
      expiryDate,
    },
    { new: true },
  );

  if (!updatedCoupon) {
    throw new AppError(HttpStatus.NOT_FOUND, AdminCouponErrorMessages.Notfound);
  }

  res.json({
    success: true,
    message: CouponSuccessMessages.Updated,
  });
});

export const toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await couponModel.findById(req.params.couponId);
  if (!coupon) {
    throw new AppError(HttpStatus.NOT_FOUND, AdminCouponErrorMessages.Notfound);
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();
  res.json({
    success: true,
    message: coupon.isActive
      ? CouponSuccessMessages.Activated
      : CouponSuccessMessages.Deactivated,
  });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const result = await couponModel.findByIdAndDelete(req.params.couponId);
  if (!result) {
    throw new AppError(HttpStatus.NOT_FOUND, AdminCouponErrorMessages.Notfound);
  }
  res.json({ success: true, message: CouponSuccessMessages.Deleted });
});

