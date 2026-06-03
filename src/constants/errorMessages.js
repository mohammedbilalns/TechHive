export const AuthErrorMessages = Object.freeze({
  INVALID_EMAIL_OR_PASSWORD:
    "Email or password is incorrect. Please try again.",
  INCOMPLETE_REGISTRATION:
    "Your registration was incomplete. Please sign up again.",
  ACCOUNT_BLOCKED: "Your account has been blocked. Please contact support.",
  REGISTERED_WITH_GOOGLE:
    "This email is registered with Google. Please use Google login.",
  EMAIL_ALREADY_REGISTERED: "Email already registered",
  INVALID_EMAIL: "Invalid email",
  PHONE_NUMBER_ALREADY_REGISTERED: "Phone number already registered",
  OTP_EXPIRED: "OTP has expired.Try again",
  OTP_ATTEMPTS_EXCEEDED:
    "You have exceeded the maximum OTP attempts. Please sign up again.",
  OTP_INVALID: "Invalid OTP, please try again",
  INVALID_REFERRAL_CODE: "Invalid referral code",
  YOU_CANNOT_USE_YOUR_OWN_REFERRAL_CODE:
    "You cannot use your own referral code",
  FAILED_TO_RESET_PASSWORD: "Failed to reset password",
  PASSWORDS_DO_NOT_MATCH: "Passwords do not match...",
  USER_NOT_FOUND: "User not found",
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect",
  NEW_PASSWORD_SAME_AS_CURRENT:
    "New password cannot be the same as current password",
  EMAIL_REQUIRED: "Email is required",
  PASSWORD_REQUIRED: "Password is required",
  INVALID_CREDENTIALS: "Invalid credentials",
});

export const ErrorMessages = {
  INVALID_INPUT: "Invalid input",
  TOO_MANY_ATTEMPTS: "Too many attempts. Please try again later.",
  INTERNAL_SERVER_ERROR: "Internal server error",
  SOMETHING_WENT_WRONG: "Something went wrong",
  PRODUCT_NOT_FOUND: "Product not found",
  PRODUCT_NOT_AVAILABLE: "Product is not available",
  PRODUCT_OUT_OF_STOCK: "Product is out of stock",
  MAX_QUANTITY_REACHED: "Maximum quantity limit reached",
  NOT_ENOUGH_STOCK: "Not enough stock available",
  ERROR_ADDING_TO_CART: "Error adding product to cart",
  CART_NOT_FOUND: "Cart not found",
  ERROR_REMOVING_FROM_CART: "Error removing product from cart",
  PRODUCT_NOT_IN_CART: "Product not found in cart",
  ERROR_UPDATING_CART: "Error updating cart quantity",
  ERROR_CLEARING_CART: "Error clearing cart",
  INVALID_COUPON: "Invalid or expired coupon",
  COUPON_LIMIT_EXCEEDED: "Coupon usage limit exceeded",
  ERROR_APPLYING_COUPON: "Error applying coupon",
  ERROR_REMOVING_COUPON: "Error removing coupon",
  INVALID_PRODUCT_ID: "Invalid product ID",
  ERROR_LOADING_REVIEWS: "Error loading reviews",
  INVALID_CATEGORY_ID: "Invalid category id",
  ERROR_LOADING_CATEGORY: "Error loading category",
  CART_EMPTY: "Cart is empty",
  COD_NOT_AVAILABLE:
    "Cash on Delivery is not available for orders above ₹1,000",
  INSUFFICIENT_WALLET_BALANCE: "Insufficient wallet balance",
  PAYMENT_INIT_FAILED: "Payment initialization failed",
  ORDER_PLACEMENT_FAILED: "Failed to place order",
  ORDER_NOT_FOUND: "Order not found",
  PAYMENT_VERIFICATION_FAILED: "Payment verification failed",
  ERROR_FETCHING_ORDERS: "Error fetching orders",
  ORDER_ITEM_NOT_FOUND: "Order item not found",
  ITEM_CANNOT_BE_CANCELLED: "Item cannot be cancelled",
  FAILED_TO_CANCEL_ITEM: "Failed to cancel item",
  RETURN_REASON_INVALID: "Return reason must be between 10 and 300 characters",
  ITEM_CANNOT_BE_RETURNED: "Item cannot be returned",
  FAILED_TO_PROCESS_RETURN: "Failed to process return request",
  PAYMENT_ALREADY_PROCESSED: "Payment already processed",
  INVOICE_NOT_AVAILABLE: "Invoice not available for this item",
  ERROR_ADDING_REVIEW: "Error adding review",
  REVIEW_NOT_FOUND: "Review not found",
  ERROR_FETCHING_REVIEW: "Error fetching review",
  ERROR_SEARCHING_PRODUCTS: "Error searching products",
  ERROR_FETCHING_WALLET: "Error fetching wallet details",
  INVALID_AMOUNT: "Invalid amount",
  ERROR_CREATING_PAYMENT: "Error creating payment order",
  WALLET_NOT_FOUND: "Wallet not found",
  ERROR_FETCHING_WISHLIST: "Error fetching wishlist",
  ERROR_ADDING_TO_WISHLIST: "Error adding product to wishlist",
  WISHLIST_NOT_FOUND: "Wishlist not found",
  ERROR_REMOVING_FROM_WISHLIST: "Error removing product from wishlist",
  MAX_ADDRESS_LIMIT: "Maximum limit of 4 addresses reached",
  ADDRESS_NOT_FOUND: "Address not found",
  FAILED_TO_UPDATE_ADDRESS: "Failed to update address",
  FAILED_TO_DELETE_ADDRESS: "Failed to delete address",
  FAILED_TO_FETCH_ADDRESS: "Failed to fetch address",
  ERROR_FETCHING_CATEGORIES: "Error fetching categories",
  FAILED_TO_DELETE_CATEGORY: "Failed to delete category",
  FAILED_TO_HIDE_CATEGORY: "Failed to hide category",
  FAILED_TO_UNHIDE_CATEGORY: "Failed to unhide category",
  CATEGORY_NAME_DESC_REQUIRED: "Category name and description are required",
  CATEGORY_NAME_LENGTH: "Category name must be between 3-100 characters",
  CATEGORY_DESC_LENGTH: "Description must be between 10-100 characters",
  CATEGORY_EXISTS: "Category with same name already exists",
  FAILED_TO_CREATE_CATEGORY: "Failed to create category",
  CATEGORY_NAME_EXISTS: "Category name already exists",
  FAILED_TO_UPDATE_CATEGORY: "Failed to update category",
  FAILED_TO_FETCH_COUPONS: "Failed to fetch coupons",
  COUPON_NOT_FOUND: "Coupon not found",
  FAILED_TO_FETCH_COUPON_DETAILS: "Failed to fetch coupon details",
  ALL_FIELDS_REQUIRED: "All fields are required",
  COUPON_CODE_LENGTH: "Coupon code must be between 3 and 10 characters",
  COUPON_CODE_NUMERIC: "Coupon code cannot contain numbers only",
  COUPON_CODE_FORMAT: "Invalid coupon code format",
  COUPON_DESC_LENGTH: "Description must be between 10 and 100 characters",
  DISCOUNT_PERCENTAGE_INVALID: "Percentage discount must be between 1 and 99",
  MAX_DISCOUNT_INVALID: "Maximum discount must be at least ₹100",
  MIN_PURCHASE_INVALID: "Minimum purchase cannot be negative",
  USAGE_LIMIT_INVALID: "Usage limit must be at least 1",
  START_DATE_PAST: "Start date cannot be in the past",
  EXPIRY_DATE_INVALID: "Expiry date must be after start date",
  COUPON_EXISTS: "Coupon code already exists",
  FAILED_TO_CREATE_COUPON: "Failed to create coupon",
  FAILED_TO_UPDATE_COUPON: "Failed to update coupon",
  FAILED_TO_UPDATE_COUPON_STATUS: "Failed to update coupon status",
  FAILED_TO_DELETE_COUPON: "Failed to delete coupon",
  ERROR_FETCHING_CUSTOMERS: "Error fetching customers",
  ERROR_FETCHING_DASHBOARD: "Error fetching dashboard data",
  ERROR_LOADING_DASHBOARD: "Error loading dashboard",
  OFFER_ID_REQUIRED: "Offer ID is required",
  OFFER_NOT_FOUND: "Offer not found",
  FAILED_TO_FETCH_OFFER: "Failed to fetch offer details",
  OFFER_NAME_LENGTH: "Offer name must be between 3 and 50 characters",
  OFFER_PERCENTAGE_INVALID: "Offer percentage must be between 1 and 99",
  START_DATE_GREATER: "Start date cannot be greater than end date",
  FAILED_TO_ADD_OFFER: "Failed to add offer",
  FAILED_TO_UPDATE_OFFER: "Failed to update offer",
  FAILED_TO_TOGGLE_OFFER: "Failed to toggle offer status",
  FAILED_TO_DELETE_OFFER: "Failed to delete offer",
  REFERRAL_VALUES_REQUIRED: "Both referrer and referee values are required",
  REFERRAL_VALUES_NEGATIVE: "Referral values cannot be negative",
  REFERRER_GREATER_THAN_REFEREE:
    "Referrer value cannot be greater than referee value",
  REFERRAL_VALUES_LIMIT: "Referral values cannot be greater than 100",
  FAILED_TO_UPDATE_REFERRAL: "Failed to update referral settings",
  INVALID_STATUS_TRANSITION: "Invalid status transition",
  ERROR_UPDATING_STATUS: "Error updating item status",
  FAILED_TO_DELETE_PRODUCT: "Failed to delete product",
  FAILED_TO_DEACTIVATE_PRODUCT: "Failed to deactivate product",
  FAILED_TO_ACTIVATE_PRODUCT: "Failed to activate product",
  FAILED_TO_ADD_PRODUCT: "Failed to add product",
  ERROR_LOADING_PRODUCT: "Error loading product",
  REQUIRED_FIELDS_MISSING: "Required fields are missing",
  PRODUCT_EXISTS: "Product with same name already exists",
  FAILED_TO_UPDATE_PRODUCT: "Failed to update product",
  ERROR_LOADING_SALES_REPORT: "Error loading sales report page",
  DATE_RANGE_REQUIRED: "Start date and end date are required",
  INVALID_DATE_RANGE: "Invalid date range: Start date cannot be after end date",
  FAILED_TO_GENERATE_REPORT: "Failed to generate sales report",
  FAILED_TO_DOWNLOAD_REPORT: "Failed to download report",
};

export const AdminCategoryErrorMessages = Object.freeze({
  Notfound: "Category not found",
  Conflict: "Category with the name already exists",
});
export const AdminCouponErrorMessages = Object.freeze({
  Notfound: "Coupon not found",
  Conflict: "Coupon with the code already exists",
});

export const AdminCustomerErrorMessages = Object.freeze({
  Notfound: "Customer not found",
});

export const AdminAuthErrorMessages = Object.freeze({
  INVALID_CREDENTIALS: AuthErrorMessages.INVALID_CREDENTIALS,
});

export const AdminOfferErrorMessages = Object.freeze({
  OFFER_ID_REQUIRED: ErrorMessages.OFFER_ID_REQUIRED,
  OFFER_NOT_FOUND: ErrorMessages.OFFER_NOT_FOUND,
  START_DATE_PAST: ErrorMessages.START_DATE_PAST,
  ACTIVE_OFFER_EXISTS: (offerType) =>
    `An active offer is already exists for some of the selected ${offerType}s`,
  ACTIVE_OFFER_EXISTS_DURING_PERIOD: (offerType) =>
    `An active offer already exists for some of the selected ${offerType}s during this period`,
  ACTIVE_OFFER_CONFLICT_ON_ACTIVATE: (offerType) =>
    `Cannot activate: offerModel is already active for some of the selected ${offerType}s`,
});

export const AdminProductErrorMessages = Object.freeze({
  PRODUCT_NOT_FOUND: ErrorMessages.PRODUCT_NOT_FOUND,
  PRODUCT_EXISTS: ErrorMessages.PRODUCT_EXISTS,
  INVALID_PRODUCT_ID: ErrorMessages.INVALID_PRODUCT_ID,
  FAILED_TO_UPDATE_PRODUCT: ErrorMessages.FAILED_TO_UPDATE_PRODUCT,
});

export const AdminOrderErrorMessages = Object.freeze({
  ORDER_NOT_FOUND: ErrorMessages.ORDER_NOT_FOUND,
  ORDER_ITEM_NOT_FOUND: ErrorMessages.ORDER_ITEM_NOT_FOUND,
  INVALID_STATUS_TRANSITION: ErrorMessages.INVALID_STATUS_TRANSITION,
});

export const AdminSalesReportErrorMessages = Object.freeze({
  DATE_RANGE_REQUIRED: ErrorMessages.DATE_RANGE_REQUIRED,
  INVALID_DATE_RANGE: ErrorMessages.INVALID_DATE_RANGE,
});


export const UserCheckoutErrorMessages = Object.freeze({
  PRODUCT_OUT_OF_STOCK: (productName) => `${productName} is out of stock`,
  MIN_PURCHASE_REQUIRED: (amount) => `Minimum purchase of ₹${amount} required`,
});

export const UserProductErrorMessages = Object.freeze({
  ERROR_LOADING_PRODUCTS: "Error loading products",
  INVALID_PRODUCT_ID: "Invalid product ID",
  INVALID_PRODUCT_ID_REDIRECT: "Invalid Product id",
  PRODUCT_NOT_FOUND: ErrorMessages.PRODUCT_NOT_FOUND,
  PRODUCT_NOT_FOUND_REDIRECT: "Product not found",
  ERROR_LOADING_REVIEWS: ErrorMessages.ERROR_LOADING_REVIEWS,
  ERROR_LOADING_PRODUCT: "Error loading product",
  INVALID_CATEGORY_ID: "Invalid category id",
  CATEGORY_NOT_FOUND: "Category not found",
  ERROR_LOADING_CATEGORY: ErrorMessages.ERROR_LOADING_CATEGORY,
});

export const UserReviewErrorMessages = Object.freeze({
  PRODUCT_NOT_FOUND: ErrorMessages.PRODUCT_NOT_FOUND,
  REVIEW_NOT_FOUND: ErrorMessages.REVIEW_NOT_FOUND,
  ERROR_ADDING_REVIEW: ErrorMessages.ERROR_ADDING_REVIEW,
  ERROR_FETCHING_REVIEW: ErrorMessages.ERROR_FETCHING_REVIEW,
});

export const UserOrderErrorMessages = Object.freeze({
  CART_EMPTY: ErrorMessages.CART_EMPTY,
  PRODUCT_OUT_OF_STOCK: (productName) => `${productName} is out of stock`,
  COD_NOT_AVAILABLE: ErrorMessages.COD_NOT_AVAILABLE,
  INSUFFICIENT_WALLET_BALANCE: ErrorMessages.INSUFFICIENT_WALLET_BALANCE,
  ORDER_PLACEMENT_FAILED: ErrorMessages.ORDER_PLACEMENT_FAILED,
  PAYMENT_INIT_FAILED: ErrorMessages.PAYMENT_INIT_FAILED,
  ORDER_NOT_FOUND: ErrorMessages.ORDER_NOT_FOUND,
  PAYMENT_VERIFICATION_FAILED: ErrorMessages.PAYMENT_VERIFICATION_FAILED,
  INVALID_ORDER_ID: "Invalid order id",
  ERROR_FETCHING_ORDERS: ErrorMessages.ERROR_FETCHING_ORDERS,
  FAILED_TO_LOAD_ORDERS: "Failed to load orders",
  ORDER_ITEM_NOT_FOUND: ErrorMessages.ORDER_ITEM_NOT_FOUND,
  ITEM_CANNOT_BE_CANCELLED: ErrorMessages.ITEM_CANNOT_BE_CANCELLED,
  FAILED_TO_CANCEL_ITEM: ErrorMessages.FAILED_TO_CANCEL_ITEM,
  RETURN_REASON_INVALID: ErrorMessages.RETURN_REASON_INVALID,
  ITEM_CANNOT_BE_RETURNED: ErrorMessages.ITEM_CANNOT_BE_RETURNED,
  FAILED_TO_PROCESS_RETURN: ErrorMessages.FAILED_TO_PROCESS_RETURN,
  PAYMENT_ALREADY_PROCESSED: ErrorMessages.PAYMENT_ALREADY_PROCESSED,
  INVOICE_NOT_AVAILABLE: ErrorMessages.INVOICE_NOT_AVAILABLE,
  FAILED_TO_INITIALIZE_PAYMENT: "Failed to initialize payment",
  FAILED_TO_GENERATE_INVOICE: "Failed to generate invoice",
});

export const UserAddressErrorMessages = Object.freeze({
  INVALID_ADDRESS_ID: "Invalid Address Id",
});

export const UserAuthErrorMessages = Object.freeze({
  SOMETHING_WENT_WRONG: ErrorMessages.SOMETHING_WENT_WRONG,
  AUTHENTICATION_FAILED: "Authentication failed",
  SESSION_ERROR: "Session error",
  SESSION_SAVE_ERROR: "Session save error",
});

export const UserProfileErrorMessages = Object.freeze({
  INVALID_PROFILE_DATA:"Invalid profile data"
})
