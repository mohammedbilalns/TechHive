import { couponModel } from "../../model/couponModel.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/appError.js";
import { validateCoupon } from "../../validators/coupon.validator.js";

// get the coupons page 
const getCoupons = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalCoupons = await couponModel.countDocuments();
    const totalPages = Math.ceil(totalCoupons / limit);

    const coupons = await couponModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const now = new Date();
    coupons.forEach(coupon => {
        coupon.isExpired = new Date(coupon.expiryDate) < now;
    });

    res.render('admin/coupons', {
        coupons,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        page: 'coupons'
    });
});

// get the coupon details for edit modal 
const getCouponDetails = asyncHandler(async (req, res) => {
    const coupon = await couponModel.findById(req.params.couponId);
    if (!coupon) {
        throw new AppError(HttpStatus.NOT_FOUND, 'couponModel not found');
    }
    res.json({ success: true, coupon });
});

const addCoupon = asyncHandler(async (req, res) => {
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
        expiryDate
    } = value;

    // Check the coupon code already exists 
    const existingCoupon = await couponModel.findOne({ code: code });
    if (existingCoupon) {
        throw new AppError(HttpStatus.CONFLICT, 'couponModel code already exists');
    }

    const newCoupon = new couponModel({
        code,
        description,
        discountType,
        discountValue,
        minPurchase,
        maxDiscount: discountType === 'PERCENTAGE' ? maxDiscount : 0,
        usageLimit,
        startDate,
        expiryDate,
        isActive: true
    });

    await newCoupon.save();
    res.json({
        success: true,
        message: 'couponModel created successfully',
        couponId: newCoupon._id
    });
});

const updateCoupon = asyncHandler(async (req, res) => {
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
        expiryDate
    } = value;

    // Check for duplicate coupon code
    const existingCoupon = await couponModel.findOne({
        code: code,
        _id: { $ne: req.params.couponId }
    });

    if (existingCoupon) {
        throw new AppError(HttpStatus.CONFLICT, 'couponModel code already exists');
    }

    const updatedCoupon = await couponModel.findByIdAndUpdate(
        req.params.couponId,
        {
            code,
            description,
            discountType,
            discountValue,
            minPurchase,
            maxDiscount: discountType === 'PERCENTAGE' ? maxDiscount : 0,
            usageLimit,
            startDate,
            expiryDate
        },
        { new: true }
    );

    if (!updatedCoupon) {
        throw new AppError(HttpStatus.NOT_FOUND, 'couponModel not found');
    }

    res.json({
        success: true,
        message: 'couponModel updated successfully'
    });
});

const toggleCouponStatus = asyncHandler(async (req, res) => {
    const coupon = await couponModel.findById(req.params.couponId);
    if (!coupon) {
        throw new AppError(HttpStatus.NOT_FOUND, 'couponModel not found');
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({
        success: true,
        message: `couponModel ${coupon.isActive ? 'activated' : 'deactivated'} successfully`
    });
});

const deleteCoupon = asyncHandler(async (req, res) => {
    const result = await couponModel.findByIdAndDelete(req.params.couponId);
    if (!result) {
        throw new AppError(HttpStatus.NOT_FOUND, 'couponModel not found');
    }
    res.json({ success: true, message: 'couponModel deleted successfully' });
});

export default {
    getCoupons,
    getCouponDetails,
    addCoupon,
    updateCoupon,
    toggleCouponStatus,
    deleteCoupon
};
