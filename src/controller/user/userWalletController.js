import { walletModel } from "../../model/walletModel.js";
import { UserModel } from "../../model/userModel.js";
import { nanoid } from "nanoid";
import razorpay from "../../utils/razorpayConfig.js";
import crypto from "crypto";
import { HttpStatus } from "../../constants/statusCodes.js";
import { AppError } from "../../utils/appError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ErrorMessages } from "../../constants/errorMessages.js";
import { SuccessMessage } from "../../constants/successMessage.js";
import logger from "../../utils/logger.js";
import { USER_VIEW_PATHS } from "../../constants/viewPaths.js";

const getWallet = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const wallet = await walletModel.findOne({ userId: req.session.user.id });
  const user = await UserModel.findOne({ _id: req.session.user.id });

  if (!wallet) {
    // Create wallet if it doesn't exist
    const newWallet = new walletModel({
      userId: req.session.user.id,
      balance: 0,
      transactions: [],
    });
    await newWallet.save();
    return res.render(USER_VIEW_PATHS.ProfileWallet, {
      wallet: newWallet,
      user,
      currentPage: 1,
      totalPages: 1,
      page: "wallet",
    });
  }

  // Get total count for pagination
  const totalTransactions = wallet.transactions.length;
  const totalPages = Math.ceil(totalTransactions / limit);

  // Get paginated transactions
  const transactions = wallet.transactions
    .sort((a, b) => b.date - a.date)
    .slice(skip, skip + limit);

  res.render(USER_VIEW_PATHS.ProfileWallet, {
    wallet: {
      ...wallet.toObject(),
      transactions,
    },
    user,
    currentPage: page,
    totalPages,
    page: "wallet",
  });
});

const addMoney = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const numAmount = parseFloat(amount);

  if (!numAmount || numAmount <= 0) {
    throw new AppError(HttpStatus.BAD_REQUEST, ErrorMessages.INVALID_AMOUNT);
  }

  // Create Razorpay order
  const orderOptions = {
    amount: Math.round(numAmount * 100), // Convert to paise
    currency: "INR",
    receipt: "wallet_" + nanoid(8),
  };

  logger.info("Creating Razorpay order with options:", orderOptions);

  try {
    const razorpayOrder = await razorpay.orders.create(orderOptions);
    logger.info("Razorpay order created:", razorpayOrder);

    res.status(HttpStatus.OK).json({
      success: true,
      amount: razorpayOrder.amount,
      razorpayOrderId: razorpayOrder.id,
    });
  } catch (error) {
    logger.error("CREATE_RAZORPAY_ORDER_ERROR", error);
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorMessages.ERROR_CREATING_PAYMENT,
    );
  }
});

const verifyWalletPayment = asyncHandler(async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } =
    req.body;

  // Verify signature
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    const wallet = await walletModel.findOne({ userId: req.session.user.id });

    if (!wallet) {
      throw new AppError(HttpStatus.NOT_FOUND, ErrorMessages.WALLET_NOT_FOUND);
    }

    // Add money to wallet
    const amountInRupees = amount / 100; // Convert from paise to rupees
    wallet.balance += amountInRupees;
    wallet.transactions.push({
      transactionId: "TXN" + nanoid(8).toUpperCase(),
      type: "CREDIT",
      amount: amountInRupees,
      description: "Added money to wallet",
      date: new Date(),
    });

    await wallet.save();

    res.status(HttpStatus.OK).json({
      success: true,
      message: SuccessMessage.PAYMENT_VERIFIED_WALLET_UPDATED,
      newBalance: wallet.balance,
    });
  } else {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      ErrorMessages.PAYMENT_VERIFICATION_FAILED,
    );
  }
});

export default {
  getWallet,
  addMoney,
  verifyWalletPayment,
};
