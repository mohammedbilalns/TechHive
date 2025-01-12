import userModel from '../../model/userModel.js';
import cartModel from '../../model/cartModel.js';
import addressModel from '../../model/addressModel.js';
import walletModel from '../../model/walletModel.js';
import couponModel from '../../model/couponModel.js';
import { log } from 'mercedlogger';

const getCheckout = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const [user, cart, addresses, wallet] = await Promise.all([
      userModel.findById(userId),
      cartModel.findOne({ user: userId }).populate('items.productId'),
      addressModel.find({ userId: userId }),
      walletModel.findOne({ userId })
    ]);

    if (!cart || cart.items.length === 0) {
      delete req.session.coupon;
      return res.redirect('/profile/cart');
    }

    // Check stock availability
    for (const item of cart.items) {
      if (item.productId.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${item.productId.name} is out of stock`
        });
      }
    }

    // Calculate totals
    let originalPrice = 0;
    let totalSavings = 0;

    cart.items.forEach(item => {
      const itemOriginalPrice = item.productId.price * item.quantity;
      const discountedPrice = itemOriginalPrice * (1 - item.productId.discount / 100);
      originalPrice += itemOriginalPrice;
      totalSavings += itemOriginalPrice - discountedPrice;
    });

    const subtotal = originalPrice - totalSavings;
    let total = subtotal;

    // Apply coupon from session if exists
    const sessionCoupon = req.session.coupon;

    res.render('user/checkout', {
      user,
      cart,
      addresses,
      originalPrice,
      total,
      totalSavings,
      wallet: wallet || { balance: 0 },
      page: "cart",
      sessionCoupon
    });
  } catch (error) {
    log.red('CHECKOUT_ERROR', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.user.id;

    // Find cart and calculate total
    const cart = await cartModel.findOne({ user: userId }).populate('items.productId');
    let subtotal = 0;
    cart.items.forEach(item => {
      const itemPrice = item.productId.price * (1 - item.productId.discount / 100);
      subtotal += itemPrice * item.quantity;
    });

    // Find and validate coupon
    const coupon = await couponModel.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      expiryDate: { $gt: new Date() }
    });

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired coupon'
      });
    }

    // Check minimum purchase requirement
    if (subtotal < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of ₹${coupon.minPurchase} required`
      });
    }

    // Check usage limit
    const userUsageCount = coupon.usageHistory.filter(
      history => history.userId.toString() === userId
    ).length;

    if (userUsageCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit exceeded'
      });
    }

    // Calculate discount
    let discountAmount;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Store coupon in session
    req.session.coupon = {
      code: couponCode,
      discount: discountAmount
    };

    return res.status(200).json({
      success: true,
      couponCode: couponCode,
      discount: discountAmount,
      message: 'Coupon applied successfully'
    });

  } catch (error) {
    log.red('APPLY_COUPON_ERROR', error);
    return res.status(500).json({
      success: false,
      message: 'Error applying coupon'
    });
  }
};

const removeCoupon = async (req, res) => {
  try {
    // Remove coupon from session
    delete req.session.coupon;

    return res.status(200).json({
      success: true,
      message: 'Coupon removed successfully'
    });
  } catch (error) {
    log.red('REMOVE_COUPON_ERROR', error);
    return res.status(500).json({
      success: false,
      message: 'Error removing coupon'
    });
  }
};

export default {
  getCheckout,
  applyCoupon,
  removeCoupon
};

