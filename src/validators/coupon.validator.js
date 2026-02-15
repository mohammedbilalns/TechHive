export const validateCoupon = ({
    code,
    description,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    usageLimit,
    startDate,
    expiryDate
}, isUpdate = false) => {

    code = code?.trim().toUpperCase();
    description = description?.trim();

    if (!code || !description || !discountType || !discountValue || !minPurchase || !maxDiscount || !usageLimit || !startDate || !expiryDate) {
        return 'All fields are required';
    }

    if (code.length < 3 || code.length > 10) {
        return 'Coupon code must be between 3 and 10 characters';
    }

    if (/^\d+$/.test(code)) {
        return 'Coupon code cannot contain numbers only';
    }

    if (!/^[A-Za-z0-9]{1,10}$/.test(code)) {
        return 'Invalid coupon code format';
    }

    if (description.length < 10 || description.length > 100) {
        return 'Description must be between 10 and 100 characters';
    }

    if (discountType === 'PERCENTAGE') {
        if (discountValue < 1 || discountValue > 99) {
            return 'Percentage discount must be between 1 and 99';
        }
        if (maxDiscount < 100) {
            return 'Maximum discount must be at least ₹100';
        }
    }

    if (minPurchase < 0) {
        return 'Minimum purchase cannot be negative';
    }

    if (usageLimit < 1) {
        return 'Usage limit must be at least 1';
    }

    const start = new Date(startDate);
    const expiry = new Date(expiryDate);
    const now = new Date();

    if (!isUpdate && start < now) {
        return 'Start date cannot be in the past';
    }

    if (expiry <= start) {
        return 'Expiry date must be after start date';
    }

    return null; 
};
