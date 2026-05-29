import { cartModel } from "../../model/cartModel.js";
import { addressModel } from "../../model/addressModel.js";
import { walletModel } from "../../model/walletModel.js";
import { couponModel } from "../../model/couponModel.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { AppError } from "../../utils/appError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  ErrorMessages,
  UserCheckoutErrorMessages,
} from "../../constants/errorMessages.js";
import { SuccessMessage } from "../../constants/successMessage.js";
import { USER_VIEW_PATHS } from "../../constants/viewPaths.js";
import {
  calculateCartTotals,
  calculateCouponDiscount,
  getCouponUsageCount,
  getSessionUserId,
  getUserFromSession,
} from "../../utils/controllerHelpers.js";

export const renderOrderCheckoutPage = asyncHandler(async (req, res) => {
  const userId = getSessionUserId(req);
  const [user, cart, addresses, wallet] = await Promise.all([
    getUserFromSession(req),
    cartModel.findOne({ user: userId }).populate("items.productId"),
    addressModel.find({ userId: userId }),
    walletModel.findOne({ userId }),
  ]);

  if (!cart || cart.items.length === 0) {
    delete req.session.coupon;
    return res.redirect("/profile/cart");
  }

  // Check stock availability
  for (const item of cart.items) {
    if (item.productId.stock < item.quantity) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: UserCheckoutErrorMessages.PRODUCT_OUT_OF_STOCK(
          item.productId.name,
        ),
      });
    }
  }

  const { originalPrice, totalSavings, total } = calculateCartTotals(
    cart.items,
  );

  // Apply coupon from session if exists
  const sessionCoupon = req.session.coupon;

  res.render(USER_VIEW_PATHS.Checkout, {
    user,
    cart,
    addresses,
    originalPrice,
    total,
    totalSavings,
    wallet: wallet || { balance: 0 },
    page: "cart",
    sessionCoupon,
  });
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;
  const userId = getSessionUserId(req);

  // Find cart and calculate total
  const cart = await cartModel
    .findOne({ user: userId })
    .populate("items.productId");
  const { subtotal } = calculateCartTotals(cart.items);

  // Find and validate coupon
  const coupon = await couponModel.findOne({
    code: couponCode.toUpperCase(),
    isActive: true,
    expiryDate: { $gt: new Date() },
  });

  if (!coupon) {
    throw new AppError(HttpStatus.BAD_REQUEST, ErrorMessages.INVALID_COUPON);
  }

  // Check minimum purchase requirement
  if (subtotal < coupon.minPurchase) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      UserCheckoutErrorMessages.MIN_PURCHASE_REQUIRED(coupon.minPurchase),
    );
  }

  // Check usage limit
  const userUsageCount = getCouponUsageCount(coupon, userId);

  if (userUsageCount >= coupon.usageLimit) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      ErrorMessages.COUPON_LIMIT_EXCEEDED,
    );
  }

  const discountAmount = calculateCouponDiscount(coupon, subtotal);

  // Store coupon in session
  req.session.coupon = {
    code: couponCode,
    discount: discountAmount,
  };

  return res.status(HttpStatus.OK).json({
    success: true,
    couponCode: couponCode,
    discount: discountAmount,
    message: SuccessMessage.COUPON_APPLIED,
  });
});

export const removeCoupon = asyncHandler(async (req, res) => {
  // Remove coupon from session
  delete req.session.coupon;

  return res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.COUPON_REMOVED,
  });
});
