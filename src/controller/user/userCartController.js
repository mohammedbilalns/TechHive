import { cartModel } from "../../model/cartModel.js";
import { productModel } from "../../model/productModel.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { AppError } from "../../utils/appError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ErrorMessages } from "../../constants/errorMessages.js";
import { SuccessMessage } from "../../constants/successMessage.js";
import { USER_VIEW_PATHS } from "../../constants/viewPaths.js";
import {
  calculateCartTotals,
  getSessionUserId,
} from "../../utils/controllerHelpers.js";

export const renderUserCartPage = asyncHandler(async (req, res) => {
  delete req.session.coupon;

  const userId = getSessionUserId(req);
  let cart = await cartModel
    .findOne({ user: userId })
    .populate("items.productId");

  // Create cart if not found
  if (!cart) {
    cart = await cartModel.create({
      user: userId,
      items: [],
    });
  }

  const { subtotal, originalPrice, totalDiscount, total } = calculateCartTotals(
    cart.items,
  );
  const shipping = 0;

  res.render(USER_VIEW_PATHS.ProfileCart, {
    cart,
    subtotal: subtotal.toFixed(2),
    shipping: shipping.toFixed(2),
    total: total.toFixed(2),
    originalPrice: originalPrice.toFixed(2),
    totalDiscount: totalDiscount.toFixed(2),
    user: req.session.user,
    page: "cart",
  });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const userId = getSessionUserId(req);

  // Check if product exists, has stock, and is active
  const product = await productModel.findById(productId);
  if (!product || product.stock <= 0 || product.status !== "Active") {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      !product
        ? ErrorMessages.PRODUCT_NOT_FOUND
        : product.status !== "Active"
          ? ErrorMessages.PRODUCT_NOT_AVAILABLE
          : ErrorMessages.PRODUCT_OUT_OF_STOCK,
    );
  }

  // Find and create cart
  let cart = await cartModel.findOne({ user: userId });
  if (!cart) {
    cart = await cartModel.create({
      user: userId,
      items: [],
    });
  }

  // Check if product already in cart
  const existingItem = cart.items.find(
    (item) => item.productId.toString() === productId,
  );

  if (existingItem) {
    if (existingItem.quantity >= 4) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ErrorMessages.MAX_QUANTITY_REACHED,
      );
    }
    if (existingItem.quantity >= product.stock) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ErrorMessages.NOT_ENOUGH_STOCK,
      );
    }
    existingItem.quantity += 1;
  } else {
    cart.items.push({
      productId,
      quantity: 1,
    });
  }

  await cart.save();

  const totalQuantity = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.PRODUCT_ADDED_TO_CART,
    totalQuantity,
  });
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = getSessionUserId(req);

  const cart = await cartModel
    .findOne({ user: userId })
    .populate("items.productId");

  if (!cart) {
    throw new AppError(HttpStatus.NOT_FOUND, ErrorMessages.CART_NOT_FOUND);
  }

  // Remove the item from cart
  cart.items = cart.items.filter(
    (item) => item.productId._id.toString() !== productId,
  );

  await cart.save();

  const { subtotal, originalPrice, totalDiscount, total, totalQuantity } =
    calculateCartTotals(cart.items, cart.discount || 0);

  res.status(HttpStatus.OK).json({
    success: true,
    totalQuantity,
    subtotal: subtotal.toFixed(2),
    total: total.toFixed(2),
    originalPrice: originalPrice.toFixed(2),
    totalDiscount: totalDiscount.toFixed(2),
    message: SuccessMessage.ITEM_REMOVED_FROM_CART,
  });
});

export const updateQuantity = asyncHandler(async (req, res) => {
  const { productId, action } = req.body;
  const userId = getSessionUserId(req);

  // Find cart and populate product details
  const cart = await cartModel
    .findOne({ user: userId })
    .populate("items.productId");

  if (!cart) {
    throw new AppError(HttpStatus.NOT_FOUND, ErrorMessages.CART_NOT_FOUND);
  }

  // Find product
  const product = await productModel.findById(productId);
  if (!product) {
    throw new AppError(HttpStatus.NOT_FOUND, ErrorMessages.PRODUCT_NOT_FOUND);
  }

  // Find item in cart
  const cartItem = cart.items.find(
    (item) => item.productId._id.toString() === productId,
  );

  if (!cartItem) {
    throw new AppError(HttpStatus.NOT_FOUND, ErrorMessages.PRODUCT_NOT_IN_CART);
  }

  // Update quantity
  let newQuantity = cartItem.quantity;
  if (action === "increase") {
    if (cartItem.quantity >= 4) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ErrorMessages.MAX_QUANTITY_REACHED,
      );
    }
    if (cartItem.quantity >= product.stock) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ErrorMessages.NOT_ENOUGH_STOCK,
      );
    }
    newQuantity = cartItem.quantity + 1;
  } else if (action === "decrease") {
    if (cartItem.quantity <= 1) {
      cart.items = cart.items.filter(
        (item) => item.productId._id.toString() !== productId,
      );
    } else {
      newQuantity = cartItem.quantity - 1;
    }
  }

  // Update cart item quantity if not removed
  if (cart.items.find((item) => item.productId._id.toString() === productId)) {
    cartItem.quantity = newQuantity;
  }

  // Save cart
  await cart.save();

  const { subtotal, originalPrice, totalDiscount, total, totalQuantity } =
    calculateCartTotals(cart.items, cart.discount || 0);

  return res.status(HttpStatus.OK).json({
    success: true,
    subtotal: subtotal.toFixed(2),
    total: total.toFixed(2),
    originalPrice: originalPrice.toFixed(2),
    totalDiscount: totalDiscount.toFixed(2),
    totalQuantity,
    message: SuccessMessage.CART_UPDATED,
  });
});

export const clearCart = asyncHandler(async (req, res) => {
  const userId = getSessionUserId(req);

  // Find and remove all items from cart
  const cart = await cartModel.findOne({ user: userId });
  if (!cart) {
    throw new AppError(HttpStatus.NOT_FOUND, ErrorMessages.CART_NOT_FOUND);
  }

  cart.items = [];
  await cart.save();

  return res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.CART_CLEARED,
  });
});
