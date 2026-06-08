import { orderModel } from "../../model/orderModel.js";
import { cartModel } from "../../model/cartModel.js";
import { productModel } from "../../model/productModel.js";
import { addressModel } from "../../model/addressModel.js";
import { nanoid } from "nanoid";
import { couponModel } from "../../model/couponModel.js";
import razorpay from "../../utils/razorpayConfig.js";
import crypto from "crypto";
import { walletModel } from "../../model/walletModel.js";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import logger from "../../utils/logger.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { env } from "../../utils/env.js";
import { UserOrderErrorMessages } from "../../constants/errorMessages.js";
import { UserOrderSuccessMessages } from "../../constants/successMessage.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { USER_VIEW_PATHS } from "../../constants/viewPaths.js";
import { getPageNumber } from "../../utils/controllerHelpers.js";
import path from "node:path";

export const placeOrder = asyncHandler(async (req, res) => {
  const { addressId, paymentMethod, couponCode } = req.body;
  const userId = req.session.user.id;

  // Get cart, address, and wallet
  const couponPromise = couponCode
    ? couponModel.findOne({ code: couponCode }).lean()
    : Promise.resolve(null);
  const [cart, shippingAddress, wallet, coupon] = await Promise.all([
    cartModel.findOne({ user: userId }).populate("items.productId").lean(),
    addressModel.findById(addressId).lean(),
    walletModel.findOne({ userId }).lean(),
    couponPromise,
  ]);

  if (!cart || cart.items.length === 0) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ success: false, message: UserOrderErrorMessages.CART_EMPTY });
  }

  // Check stock availability for all items
  for (const item of cart.items) {
    if (item.productId.stock < item.quantity) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: UserOrderErrorMessages.PRODUCT_OUT_OF_STOCK(
          item.productId.name,
        ),
      });
    }
  }

  // Calculate totals after applying offers
  const totalAmount = cart.items.reduce((total, item) => {
    const price = item.productId.price;
    const discount = item.productId.discount;
    const discountedPrice = price * (1 - discount / 100);
    return total + discountedPrice * item.quantity;
  }, 0);

  // Calculate coupon discount if coupon code exists
  let couponDiscount = 0;
  let finalAmount = totalAmount;

  if (coupon) {
    if (coupon.discountType === "PERCENTAGE") {
      couponDiscount = Math.min(
        (totalAmount * coupon.discountValue) / 100,
        coupon.maxDiscount || Infinity,
      );
    } else {
      couponDiscount = coupon.discountValue;
    }
    finalAmount = totalAmount - couponDiscount;
  }

  // Check if COD is allowed for this order amount
  if (paymentMethod === "cod" && finalAmount > 1000) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: UserOrderErrorMessages.COD_NOT_AVAILABLE,
    });
  }

  // Check wallet balance if payment method is wallet
  if (paymentMethod === "wallet") {
    if (!wallet || wallet.balance < finalAmount) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: UserOrderErrorMessages.INSUFFICIENT_WALLET_BALANCE,
      });
    }
  }

  // Create order items array with product data
  const orderItems = cart.items.map((item) => ({
    name: item.productId.name,
    brand: item.productId.brand,
    images: item.productId.images,
    quantity: item.quantity,
    price: item.productId.price,
    discount: item.productId.discount,
  }));

  // Generate order ID
  const date = new Date();
  const dateString =
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    date.getDate().toString().padStart(2, "0");
  const orderId = "ORD" + dateString + nanoid(6).toUpperCase();

  // Create new order
  const order = new orderModel({
    orderId,
    userId,
    items: orderItems.map((item) => ({
      ...item,
      status:
        paymentMethod === "cod" || paymentMethod === "wallet"
          ? "processing"
          : "pending",
    })),
    totalAmount: finalAmount,
    paymentMethod,
    shippingAddress: {
      name: shippingAddress.name,
      houseName: shippingAddress.houseName,
      localityStreet: shippingAddress.localityStreet,
      city: shippingAddress.city,
      state: shippingAddress.state,
      pincode: shippingAddress.pincode,
      phone: shippingAddress.phone,
      alternatePhone: shippingAddress.alternatePhone,
    },
    orderDate: new Date(),
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "processing",
    paymentStatus: paymentMethod === "cod" ? "unpaid" : "pending",
    coupon:
      couponCode && couponDiscount > 0
        ? {
            code: couponCode,
            discount: couponDiscount,
          }
        : undefined,
  });

  await order.save();

  // Update coupon usage history if coupon was applied
  if (couponCode && couponDiscount > 0) {
    await couponModel.findOneAndUpdate(
      { code: couponCode },
      {
        $push: {
          usageHistory: {
            userId,
            orderId: order._id,
            discountAmount: couponDiscount,
          },
        },
      },
    );
  }

  // Update product stock and clear cart
  if (paymentMethod === "cod" || paymentMethod === "wallet") {
    await Promise.all([
      ...cart.items.map((item) =>
        productModel.findByIdAndUpdate(item.productId._id, {
          $inc: { stock: -item.quantity },
        }),
      ),
      cartModel.findOneAndUpdate(
        { user: userId },
        { $set: { items: [], discount: 0, couponCode: null } },
      ),
    ]);
  }

  // If payment method is online, create Razorpay order
  if (paymentMethod === "online") {
    try {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(finalAmount * 100),
        currency: "INR",
        receipt: order._id.toString(),
      });

      logger.info("Razorpayorder", razorpayOrder);

      order.paymentDetails = {
        razorpayOrderId: razorpayOrder.id,
      };

      await order.save();

      return res.status(HttpStatus.OK).json({
        success: true,
        orderId: order._id,
        amount: razorpayOrder.amount,
        razorpayOrderId: razorpayOrder.id,
      });
    } catch (error) {
      // Save order with pending status
      logger.error("FAILED TO CREATE RAZORPAY ORDER", error);
      order.paymentStatus = "pending";
      order.items.forEach((item) => (item.status = "pending"));
      await order.save();

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        orderId: order._id,
        error: UserOrderErrorMessages.PAYMENT_INIT_FAILED,
      });
    }
  }

  // Handle wallet payment
  if (paymentMethod === "wallet") {
    // Deduct amount from wallet
    const walletTransactionId = "WTX" + nanoid(8).toUpperCase();

    await walletModel.findOneAndUpdate(
      { userId },
      {
        $inc: { balance: -finalAmount },
        $push: {
          transactions: {
            transactionId: walletTransactionId,
            type: "DEBIT",
            amount: finalAmount,
            description: `Payment for order ${orderId}`,
          },
        },
      },
    );

    // Update order payment status
    order.paymentStatus = "paid";
    await order.save();

    return res.status(HttpStatus.OK).json({
      success: true,
      orderId: order._id,
      displayOrderId: order.orderId,
    });
  }

  res.status(HttpStatus.OK).json({
    success: true,
    orderId: order._id,
    displayOrderId: order.orderId,
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    orderId,
  } = req.body;

  // Verify payment signature
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: UserOrderErrorMessages.ORDER_NOT_FOUND,
      });
    }

    // Check stock availability for all items
    const products = await Promise.all(
      order.items.map((item) => productModel.findOne({ name: item.name }).lean()),
    );

    for (const [index, item] of order.items.entries()) {
      const product = products[index];
      if (!product || product.stock < item.quantity) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: UserOrderErrorMessages.PRODUCT_OUT_OF_STOCK(item.name),
        });
      }
    }

    // Update order status and payment details
    order.items.forEach((item) => (item.status = "processing"));
    order.paymentStatus = "paid";
    order.paymentDetails = {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    };
    await order.save();

    // Update product stock
    await Promise.all(
      order.items.map((item) =>
        productModel.findOneAndUpdate(
          { name: item.name },
          { $inc: { stock: -item.quantity } },
        ),
      ),
    );

    res.status(HttpStatus.OK).json({ success: true });
  } else {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: UserOrderErrorMessages.PAYMENT_VERIFICATION_FAILED,
    });
  }
});

export const renderOrderSuccessPage = asyncHandler(async (req, res) => {
  const orderId = req.params.orderId;

  // Validate if orderId is a valid  ObjectId
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.redirect(
      `/notfound?alertType=error&message=${encodeURIComponent(UserOrderErrorMessages.INVALID_ORDER_ID)}`,
    );
  }

  const order = await orderModel.findById(orderId).lean();

  if (!order) {
    return res.redirect("/home");
  }

  res.render(USER_VIEW_PATHS.OrderSuccess, {
    orderId: order.orderId,
  });
});

export const renderUserOrdersPage = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  const page = getPageNumber(req.query.page);
  const limit = 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";

  // Create search query
  const searchQuery = {
    userId,
    $or: [
      { orderId: { $regex: search, $options: "i" } },
      { "items.name": { $regex: search, $options: "i" } },
      { "shippingAddress.name": { $regex: search, $options: "i" } },
    ],
  };

  // Get total count for pagination
  const [totalOrders, orders] = await Promise.all([
    orderModel.countDocuments(searchQuery),
    orderModel
      .find(searchQuery)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);
  const totalPages = Math.ceil(totalOrders / limit);

  if (req.xhr) {
    return res.status(HttpStatus.OK).json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  }

  res.render(USER_VIEW_PATHS.ProfileOrders, {
    user: req.session.user,
    orders,
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    search,
    page: "orders",
  });
});

export const cancelOrderItem = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const userId = req.session.user.id;

  const order = await orderModel.findOne({ _id: orderId, userId });

  if (!order) {
    return res.status(HttpStatus.NOT_FOUND).json({
      success: false,
      message: UserOrderErrorMessages.ORDER_NOT_FOUND,
    });
  }

  const orderItem = order.items.id(itemId);
  if (!orderItem) {
    return res.status(HttpStatus.NOT_FOUND).json({
      success: false,
      message: UserOrderErrorMessages.ORDER_ITEM_NOT_FOUND,
    });
  }

  // Check if item can be cancelled
  if (["delivered", "cancelled", "returned"].includes(orderItem.status)) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: UserOrderErrorMessages.ITEM_CANNOT_BE_CANCELLED,
    });
  }

  // Update item status and set cancelled date
  orderItem.status = "cancelled";
  orderItem.cancelledDate = new Date();

  // Handle refund if payment was made
  if (order.paymentStatus === "paid") {
    // Calculate  refund amount for this item
    const itemPrice = orderItem.price;
    const itemDiscount = orderItem.discount;
    const quantity = orderItem.quantity;
    const baseRefundAmount = itemPrice * (1 - itemDiscount / 100) * quantity;

    let couponDiscount = 0;
    if (order.coupon && order.coupon.discount > 0) {
      // Distribute coupon discount
      const totalPrice = order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      couponDiscount =
        ((orderItem.quantity * orderItem.price) / totalPrice) *
        order.coupon.discount;
    }

    // Final refund amount after deducting proportional coupon discount
    const refundAmount = baseRefundAmount - couponDiscount;

    const walletTransactionId = "WTX" + nanoid(8).toUpperCase();

    // Add refund to user's wallet
    await walletModel.findOneAndUpdate(
      { userId },
      {
        $inc: { balance: refundAmount },
        $push: {
          transactions: {
            transactionId: walletTransactionId,
            type: "CREDIT",
            amount: refundAmount,
            description: `Refund for cancelled item in order ${order.orderId}`,
          },
        },
      },
      { upsert: true },
    );

    // Set payment status to refunded for this item
    orderItem.paymentStatus = "refunded";
  }

  await order.save();

  // Check if all items are cancelled/returned
  const allItemsCancelledOrReturned = order.items.every((item) =>
    ["cancelled", "returned"].includes(item.status),
  );

  // Update order payment status if all items are cancelled/returned
  if (allItemsCancelledOrReturned && order.paymentStatus === "paid") {
    order.paymentStatus = "refunded";
    await order.save();
  }

  // Restore stock for the cancelled item
  await productModel.findOneAndUpdate(
    { name: orderItem.name },
    { $inc: { stock: orderItem.quantity } },
  );

  res
    .status(HttpStatus.OK)
    .json({ success: true, message: UserOrderSuccessMessages.ITEM_CANCELLED });
});

export const returnOrderItem = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { reason } = req.body;
  const userId = req.session.user.id;

  // Validate return reason length
  if (!reason || reason.length < 10 || reason.length > 300) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: UserOrderErrorMessages.RETURN_REASON_INVALID,
    });
  }

  const order = await orderModel.findOne({ _id: orderId, userId });

  if (!order) {
    return res.status(HttpStatus.NOT_FOUND).json({
      success: false,
      message: UserOrderErrorMessages.ORDER_NOT_FOUND,
    });
  }

  const orderItem = order.items.id(itemId);
  if (!orderItem) {
    return res.status(HttpStatus.NOT_FOUND).json({
      success: false,
      message: UserOrderErrorMessages.ORDER_ITEM_NOT_FOUND,
    });
  }

  // Check if item can be returned
  if (orderItem.status !== "delivered") {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: UserOrderErrorMessages.ITEM_CANNOT_BE_RETURNED,
    });
  }

  // Update item status to return_requested and add return information
  orderItem.status = "return requested";
  orderItem.return = {
    reason: reason,
    requestedAt: new Date(),
  };

  await order.save();

  res.status(HttpStatus.OK).json({
    success: true,
    message: UserOrderSuccessMessages.RETURN_REQUEST_SUBMITTED,
  });
});

export const retryPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.session.user.id;

  const order = await orderModel.findOne({ _id: orderId, userId });

  if (!order) {
    return res.status(HttpStatus.NOT_FOUND).json({
      success: false,
      message: UserOrderErrorMessages.ORDER_NOT_FOUND,
    });
  }

  if (order.paymentStatus !== "pending") {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: UserOrderErrorMessages.PAYMENT_ALREADY_PROCESSED,
    });
  }

  // Check stock availability for all items before proceeding
  const products = await Promise.all(
    order.items.map((item) => productModel.findOne({ name: item.name }).lean()),
  );

  for (const [index, item] of order.items.entries()) {
    const product = products[index];
    if (!product || product.stock < item.quantity) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: UserOrderErrorMessages.PRODUCT_OUT_OF_STOCK(item.name),
      });
    }
  }

  // Create new Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(order.totalAmount * 100),
    currency: "INR",
    receipt: order._id.toString(),
  });

  // Update order with new Razorpay order ID
  order.paymentDetails = {
    razorpayOrderId: razorpayOrder.id,
  };
  await order.save();

  res.status(HttpStatus.OK).json({
    success: true,
    orderId: order._id,
    amount: razorpayOrder.amount,
    razorpayOrderId: razorpayOrder.id,
  });
});

export const renderPaymentFailedPage = asyncHandler(async (req, res) => {
  const orderId = req.params.orderId;

  // Validate if orderId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.redirect(
      `/notfound?alertType=error&message=${encodeURIComponent(UserOrderErrorMessages.INVALID_ORDER_ID)}`,
    );
  }

  const order = await orderModel.findById(orderId).lean();

  if (!order) {
    return res.redirect("/home");
  }

  res.render(USER_VIEW_PATHS.PaymentFailed, {
    orderId: order.orderId,
    user: req.session.user,
  });
});

export const downloadInvoice = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const userId = req.session.user.id;

  const order = await orderModel
    .findOne({
      _id: orderId,
      userId,
    })
    .populate("userId", "fullname email")
    .lean();

  if (!order) {
    return res.status(HttpStatus.NOT_FOUND).json({
      success: false,
      message: UserOrderErrorMessages.ORDER_NOT_FOUND,
    });
  }

  const orderItem = order.items.find((item) => item._id.toString() === itemId);
  if (!orderItem) {
    return res.status(HttpStatus.NOT_FOUND).json({
      success: false,
      message: UserOrderErrorMessages.ORDER_ITEM_NOT_FOUND,
    });
  }

  // Check if item status is valid for invoice
  if (
    !["delivered", "return requested", "returned"].includes(orderItem.status)
  ) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: UserOrderErrorMessages.INVOICE_NOT_AVAILABLE,
    });
  }

  // Calculate item amount
  const itemPrice = orderItem.price;
  const itemDiscount = orderItem.discount;
  const quantity = orderItem.quantity;
  const baseAmount = itemPrice * (1 - itemDiscount / 100) * quantity;

  // Calculate proportional coupon discount
  let couponDiscount = 0;
  if (order.coupon && order.coupon.discount > 0) {
    const totalOrderPrice = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    couponDiscount =
      ((orderItem.quantity * orderItem.price) / totalOrderPrice) *
      order.coupon.discount;
  }

  // Final amount after all discounts
  const finalAmount = baseAmount - couponDiscount;

  // Calculate GST components (9% each for SGST and CGST)
  const baseAmountBeforeTax = baseAmount / 1.18; // Since total tax is 18%
  const sgst = baseAmountBeforeTax * 0.09;
  const cgst = baseAmountBeforeTax * 0.09;

  // Generate PDF
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${order.orderId}-${itemId}.pdf`,
  );

  doc.pipe(res);

  // Register fonts
  const fontsDir = path.join(process.cwd(), "static", "fonts");
  doc.registerFont("NotoSans", path.join(fontsDir, "NotoSans-Regular.ttf"));
  doc.registerFont("NotoSans-Bold", path.join(fontsDir, "NotoSans-Bold.ttf"));
  doc.registerFont(
    "NotoSans-Italic",
    path.join(fontsDir, "NotoSans-Italic.ttf"),
  );

  // Header
  doc
    .fontSize(24)
    .font("NotoSans-Bold")
    .text("TechHive", 40, 40, { align: "center" })
    .moveDown(0.5);

  // Invoice title
  doc.fontSize(20).text("Tax Invoice", { align: "center" }).moveDown(1);

  // Order and customer details
  doc
    .fontSize(12)
    .font("NotoSans")
    .text(`Invoice Date: ${new Date().toLocaleDateString()}`)
    .text(`Order ID: ${order.orderId}`)
    .text(`Customer Name: ${order.userId.fullname}`)
    .text(`Email: ${order.userId.email}`)
    .moveDown(0.5);

  // Shipping address
  doc
    .fontSize(12)
    .font("NotoSans-Bold")
    .text("Shipping Address:")
    .font("NotoSans")
    .text(order.shippingAddress.name)
    .text(order.shippingAddress.houseName)
    .text(order.shippingAddress.localityStreet)
    .text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`)
    .text(`PIN: ${order.shippingAddress.pincode}`)
    .text(`Phone: ${order.shippingAddress.phone}`)
    .moveDown(1);

  // Item details table
  const tableTop = doc.y + 20;
  const columns = [
    { header: "Item", width: 200, align: "left" },
    { header: "Quantity", width: 70, align: "center" },
    { header: "Price", width: 80, align: "right" },
    { header: "Discount", width: 80, align: "right" },
    { header: "Total", width: 80, align: "right" },
  ];

  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const rowHeight = 60;

  // Draw table header background
  doc
    .rect(40, tableTop - 5, totalWidth, 25) // Header height
    .fillColor("#f3f4f6")
    .fill();

  // Draw table borders
  doc.strokeColor("#d1d5db").lineWidth(1);

  // Draw header row
  let xPos = 40;
  doc.fillColor("#000000").font("NotoSans-Bold").fontSize(10);
  columns.forEach((column) => {
    doc.text(column.header, xPos + 4, tableTop, {
      width: column.width - 8,
      align: column.align,
    });
    xPos += column.width;
  });

  // Draw horizontal line below header
  doc
    .moveTo(40, tableTop + 20)
    .lineTo(40 + totalWidth, tableTop + 20)
    .stroke();

  // Draw item row
  const rowTop = tableTop + 25;
  xPos = 40;
  doc.font("NotoSans").fontSize(10);

  const rowData = [
    {
      text: orderItem.name,
      align: "left",
      options: { width: columns[0].width - 8, align: "left", lineGap: 2 }, // Added lineGap for better line spacing
    },
    {
      text: orderItem.quantity.toString(),
      align: "center",
      options: { width: columns[1].width - 8, align: "center" },
    },
    {
      text: `₹${orderItem.price.toFixed(2)}`,
      align: "right",
      options: { width: columns[2].width - 8, align: "right" },
    },
    {
      text: `${orderItem.discount}%`,
      align: "right",
      options: { width: columns[3].width - 8, align: "right" },
    },
    {
      text: `₹${baseAmount.toFixed(2)}`,
      align: "right",
      options: { width: columns[4].width - 8, align: "right" },
    },
  ];

  // Draw vertical lines
  columns.forEach((col, i) => {
    const x = 40 + columns.slice(0, i).reduce((sum, col) => sum + col.width, 0);
    doc
      .moveTo(x, tableTop - 5)
      .lineTo(x, rowTop + rowHeight)
      .stroke();
  });

  // Draw last vertical line
  doc
    .moveTo(40 + totalWidth, tableTop - 5)
    .lineTo(40 + totalWidth, rowTop + rowHeight)
    .stroke();

  // Draw row data
  xPos = 40;
  rowData.forEach((data, i) => {
    doc.text(
      data.text,
      xPos + 4,
      rowTop + 5, // Added padding from top
      data.options,
    );
    xPos += columns[i].width;
  });

  // Draw bottom border
  doc
    .moveTo(40, rowTop + rowHeight)
    .lineTo(40 + totalWidth, rowTop + rowHeight)
    .stroke();

  // Summary section
  doc.y = rowTop + rowHeight + 20;

  // Create a summary box
  const summaryWidth = 300; // Increased width
  const summaryX = doc.page.width - summaryWidth - 40;
  const summaryStartY = doc.y;

  // Draw summary box background
  doc
    .rect(summaryX, summaryStartY, summaryWidth, 160)
    .fillColor("#f8f9fa")
    .fill();

  // Reset position and color for text
  doc.fillColor("#000000").fontSize(12);

  // Summary title
  doc
    .font("NotoSans-Bold")
    .text("Summary", summaryX + 20, summaryStartY + 15, {
      width: summaryWidth - 40,
    })
    .moveDown(0.5);

  // Summary content with aligned values
  const leftColX = summaryX + 20;
  const rightColX = summaryX + summaryWidth - 120;
  let currentY = doc.y;

  // Helper function for summary rows
  const addSummaryRow = (label, value, isBold = false) => {
    doc
      .font(isBold ? "NotoSans-Bold" : "NotoSans")
      .text(label, leftColX, currentY)
      .text(value, rightColX, currentY, { align: "right" });
    currentY += 20;
  };

  // Add summary rows
  addSummaryRow("Subtotal (before tax):", `₹${baseAmountBeforeTax.toFixed(2)}`);
  addSummaryRow("SGST (9%):", `₹${sgst.toFixed(2)}`);
  addSummaryRow("CGST (9%):", `₹${cgst.toFixed(2)}`);
  addSummaryRow("Subtotal (inc. tax):", `₹${baseAmount.toFixed(2)}`);

  if (couponDiscount > 0) {
    addSummaryRow("Coupon Discount:", `- ₹${couponDiscount.toFixed(2)}`);
  }

  // Draw a line before final amount
  doc
    .moveTo(summaryX + 20, currentY)
    .lineTo(summaryX + summaryWidth - 20, currentY)
    .strokeColor("#000000")
    .stroke();

  currentY += 10;

  // Final amount in bold
  addSummaryRow("Final Amount:", `₹${finalAmount.toFixed(2)}`, true);

  // Reset position for rest of the document
  doc.moveDown(2);

  // Footer
  doc
    .fontSize(8)
    .font("NotoSans-Italic")
    .text("This is a computer generated invoice.", 40, doc.page.height - 40, {
      align: "center",
    });

  doc.end();
});

export const getOrderDetails = asyncHandler(async (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.session.user.id;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.redirect(
      `/notfound?message=${encodeURIComponent(UserOrderErrorMessages.INVALID_ORDER_ID)}&alertType=error`,
    );
  }

  const order = await orderModel
    .findOne({
      _id: orderId,
      userId,
    })
    .populate("userId", "fullname email");

  if (!order) {
    return res.redirect(
      `/notfound?message=${encodeURIComponent(UserOrderErrorMessages.ORDER_NOT_FOUND)}`,
    );
  }

  res.render(USER_VIEW_PATHS.ProfileOrderDetails, {
    user: req.session.user,
    order,
    page: "orders",
  });
});
