import { log } from "mercedlogger";
import Coupon from "../../model/couponModel.js";

const getCoupons = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalCoupons = await Coupon.countDocuments();
        const totalPages = Math.ceil(totalCoupons / limit);

        const coupons = await Coupon.find()
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
    } catch (error) {
        log.red('GET_COUPONS_ERROR', error);
        res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
    }
};

// get the coupon details for edit modal 
const getCouponDetails = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        res.json({ success: true, coupon });
    } catch (error) {
        log.red('GET_COUPON_DETAILS_ERROR', error);
        res.status(500).json({ success: false, message: 'Failed to fetch coupon details' });
    }
};

const addCoupon = async (req, res) => {
    try {
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
        } = req.body;

        // Validate coupon code format and length 
        if (!/^[A-Za-z0-9]{1,10}$/.test(code)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coupon code format'
            });
        }

        // Validate description length
        if (description.length < 10 || description.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Description must be between 10 and 100 characters'
            });
        }

        // Validate discount value based on type
        if (discountType === 'PERCENTAGE') {
            if (discountValue < 1 || discountValue > 99) {
                return res.status(400).json({
                    success: false,
                    message: 'Percentage discount must be between 1 and 99'
                });
            }
            // Validate maximum discount 
            if (maxDiscount < 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum discount must be at least ₹100'
                });
            }
        }

        // Validate dates
        const start = new Date(startDate);
        const expiry = new Date(expiryDate);
        const now = new Date();

        if (start < now) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be in the past'
            });
        }

        if (expiry <= start) {
            return res.status(400).json({
                success: false,
                message: 'Expiry date must be after start date'
            });
        }

        // Check the coupon code already exists 
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }

        const newCoupon = new Coupon({
            code: code.toUpperCase(),
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
        res.json({ success: true, message: 'Coupon created successfully' });
    } catch (error) {
        log.red('ADD_COUPON_ERROR', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create coupon'
        });
    }
};

const updateCoupon = async (req, res) => {
    try {
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
        } = req.body;

        // Basic validations
        if (!/^[A-Za-z0-9]{1,10}$/.test(code)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coupon code format'
            });
        }

        if (description.length < 10 || description.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Description must be between 10 and 100 characters'
            });
        }

        if (discountType === 'PERCENTAGE') {
            if (discountValue < 1 || discountValue > 99) {
                return res.status(400).json({
                    success: false,
                    message: 'Percentage discount must be between 1 and 99'
                });
            }
            if (maxDiscount < 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum discount must be at least ₹100'
                });
            }
        }

        // Only validate that expiry date is after start date
        const start = new Date(startDate);
        const expiry = new Date(expiryDate);

        if (expiry <= start) {
            return res.status(400).json({
                success: false,
                message: 'Expiry date must be after start date'
            });
        }

        // Check for duplicate coupon code
        const existingCoupon = await Coupon.findOne({
            code: code.toUpperCase(),
            _id: { $ne: req.params.couponId }
        });

        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            req.params.couponId,
            {
                code: code.toUpperCase(),
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
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.json({
            success: true,
            message: 'Coupon updated successfully'
        });
    } catch (error) {
        log.red('UPDATE_COUPON_ERROR', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update coupon'
        });
    }
};

const toggleCouponStatus = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();
        res.json({
            success: true,
            message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        log.red('TOGGLE_COUPON_STATUS_ERROR', error);
        res.status(500).json({ success: false, message: 'Failed to update coupon status' });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const result = await Coupon.findByIdAndDelete(req.params.couponId);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        log.red('DELETE_COUPON_ERROR', error);
        res.status(500).json({ success: false, message: 'Failed to delete coupon' });
    }
};

export default {
    getCoupons,
    getCouponDetails,
    addCoupon,
    updateCoupon,
    toggleCouponStatus,
    deleteCoupon
};
