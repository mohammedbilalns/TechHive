export const validateCoupon = (data, isUpdate = false) => {
  let {
    code,
    description,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    usageLimit,
    startDate,
    expiryDate,
  } = data;

  // Sanitization
  code = code?.trim().toUpperCase();
  description = description?.trim();

  discountValue = Number(discountValue);
  minPurchase = Number(minPurchase);
  maxDiscount = Number(maxDiscount);
  usageLimit = Number(usageLimit);

  if (
    !code ||
    !description ||
    !discountType ||
    isNaN(discountValue) ||
    isNaN(minPurchase) ||
    isNaN(maxDiscount) ||
    isNaN(usageLimit) ||
    !startDate ||
    !expiryDate
  ) {
    return { error: "All fields are required" };
  }

  if (code.length < 3 || code.length > 10) {
    return { error: "Coupon code must be between 3 and 10 characters" };
  }

  if (/^\d+$/.test(code)) {
    return { error: "Coupon code cannot contain numbers only" };
  }

  if (!/^[A-Za-z0-9]{1,10}$/.test(code)) {
    return { error: "Invalid coupon code format" };
  }

  if (description.length < 10 || description.length > 100) {
    return { error: "Description must be between 10 and 100 characters" };
  }

  if (discountType === "PERCENTAGE") {
    if (discountValue < 1 || discountValue > 99) {
      return { error: "Percentage discount must be between 1 and 99" };
    }
    if (maxDiscount < 100) {
      return { error: "Maximum discount must be at least ₹100" };
    }
  }

  if (minPurchase < 0) {
    return { error: "Minimum purchase cannot be negative" };
  }

  if (usageLimit < 1) {
    return { error: "Usage limit must be at least 1" };
  }

  const start = new Date(startDate);
  const expiry = new Date(expiryDate);
  const now = new Date();

  if (!isUpdate && start < now) {
    return { error: "Start date cannot be in the past" };
  }

  if (expiry <= start) {
    return { error: "Expiry date must be after start date" };
  }

  return {
    error: null,
    value: {
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      usageLimit,
      startDate,
      expiryDate,
    },
  };
};
