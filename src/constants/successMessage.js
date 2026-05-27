
export const SuccessMessage = {
  "LOGIN_SUCCESS": "Login successful",
  "LOGGED_OUT_SUCCESS": "Logged out successfully",
  "OTP_SENT_SUCCESS": "OTP sent successfully",
  "OTP_VERIFIED_SUCCESS": "OTP verified successfully",
  "REFERRAL_CODE_APPLIED_SUCCESS": "Referral code applied successfully",
  "PASSWORD_RESET_SUCCESS": "Password reset successful",
  "PROFILE_UPDATED": "Profile updated successfully",
  "PASSWORD_UPDATED": "Password updated successfully",
  "PRODUCT_ADDED_TO_CART": "Product added to cart successfully",
  "ITEM_REMOVED_FROM_CART": "Item removed successfully",
  "CART_UPDATED": "Cart updated successfully",
  "CART_CLEARED": "Cart cleared successfully",
  "COUPON_APPLIED": "Coupon applied successfully",
  "COUPON_REMOVED": "Coupon removed successfully",
  "ITEM_CANCELLED": "Item cancelled successfully",
  "RETURN_REQUEST_SUBMITTED": "Return request submitted successfully",
  "REVIEW_UPDATED": "Review updated successfully",
  "REVIEW_ADDED": "Review added successfully",
  "PAYMENT_VERIFIED_WALLET_UPDATED": "Payment verified and wallet updated successfully",
  "PRODUCT_ADDED_TO_WISHLIST": "Product added to wishlist successfully",
  "PRODUCT_REMOVED_FROM_WISHLIST": "Product removed from wishlist successfully",
  "ADDRESS_ADDED": "Address added successfully",
  "ADDRESS_UPDATED": "Address updated successfully",
  "ADDRESS_DELETED": "Address deleted successfully",
  "CATEGORY_DELETED": "Category deleted successfully",
  "CATEGORY_HIDDEN": "Category and associated products hidden successfully",
  "CATEGORY_UNHIDDEN": "Category and associated products unhidden successfully",
  "CATEGORY_CREATED": "Category created successfully",
  "CATEGORY_UPDATED": "Category updated successfully",
  "COUPON_CREATED": "Coupon created successfully",
  "COUPON_UPDATED": "Coupon updated successfully",
  "COUPON_DELETED": "Coupon deleted successfully",
  "CUSTOMER_BLOCKED": "Customer blocked successfully",
  "CUSTOMER_UNBLOCKED": "Customer unblocked successfully",
  "OFFER_ADDED": "Offer added successfully",
  "OFFER_UPDATED": "Offer updated successfully",
  "OFFER_DELETED": "Offer deleted successfully",
  "REFERRAL_SETTINGS_UPDATED": "Referral settings updated successfully",
  "ITEM_STATUS_UPDATED": "Item status updated successfully",
  "PRODUCT_DELETED": "Product deleted successfully",
  "PRODUCT_DEACTIVATED": "Product deactivated successfully",
  "PRODUCT_ACTIVATED": "Product activated successfully",
  "PRODUCT_ADDED": "Product added successfully",
  "PRODUCT_UPDATED": "Product updated successfully"
};

export const CategorySuccessMessages = Object.freeze({
  Created: "Category created successfully",
  Updated: "Category updated successfully",
  Deleted: "Category deleted successfully",
  Disabled: "Category disabled successfully",
  Enabled: "Category enabled successfully",
})

export const CouponSuccessMessages = Object.freeze({
  Created: "Coupon created successfully",
  Updated: "Coupon updated successfully",
  Deleted: "Coupon deleted successfully",
  Deactivated: "Coupon deactivated successfully",
  Activated: "Coupon activated successfully",
})

export const AdminCustomerSuccessMessages = Object.freeze({
  Blocked: "Customer blocked successfully",
  Unblocked: "Customer unblocked successfully",
})

export const AdminAuthSuccessMessages = Object.freeze({
  LOGIN_SUCCESS: SuccessMessage.LOGIN_SUCCESS,
  LOGOUT_SUCCESS: SuccessMessage.LOGGED_OUT_SUCCESS,
});

export const AdminOfferSuccessMessages = Object.freeze({
  ADDED: SuccessMessage.OFFER_ADDED,
  UPDATED: SuccessMessage.OFFER_UPDATED,
  ACTIVATED: "Offer activated successfully",
  DEACTIVATED: "Offer deactivated successfully",
  DELETED: SuccessMessage.OFFER_DELETED,
  REFERRAL_SETTINGS_UPDATED: SuccessMessage.REFERRAL_SETTINGS_UPDATED,
});

export const AdminProductSuccessMessages = Object.freeze({
  DELETED: SuccessMessage.PRODUCT_DELETED,
  DEACTIVATED: SuccessMessage.PRODUCT_DEACTIVATED,
  ACTIVATED: SuccessMessage.PRODUCT_ACTIVATED,
  ADDED: SuccessMessage.PRODUCT_ADDED,
  UPDATED: SuccessMessage.PRODUCT_UPDATED,
});

export const AdminOrderSuccessMessages = Object.freeze({
  ITEM_STATUS_UPDATED: SuccessMessage.ITEM_STATUS_UPDATED,
});

export const UserReviewSuccessMessages = Object.freeze({
  REVIEW_UPDATED: SuccessMessage.REVIEW_UPDATED,
  REVIEW_ADDED: SuccessMessage.REVIEW_ADDED,
});

export const UserOrderSuccessMessages = Object.freeze({
  ITEM_CANCELLED: SuccessMessage.ITEM_CANCELLED,
  RETURN_REQUEST_SUBMITTED: SuccessMessage.RETURN_REQUEST_SUBMITTED,
});
