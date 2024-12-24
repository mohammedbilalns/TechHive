import userModel from '../../model/userModel.js';
import cartModel from '../../model/cartModel.js';
import addressModel from '../../model/addressModel.js';
//import Order from '../models/orderModel.js';

const getCheckout = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await userModel.findById(userId);
    const cart = await cartModel.findOne({ user: userId }).populate('items.productId');
    const addresses = await addressModel.find({ userId: userId });
    
    if (!cart || cart.items.length === 0) {
      return res.redirect('/profile/cart');
    }

    // Check stock availability
    let stockError = false;
    let outOfStockItems = [];

    for (const item of cart.items) {
      if (item.productId.stock < item.quantity) {
        stockError = true;
        outOfStockItems.push({
          name: item.productId.name,
          available: item.productId.stock,
          requested: item.quantity
        });
      }
    }

    if (stockError) {
      req.flash('error', 'Some items in your cart are out of stock');
      return res.redirect('/profile/cart');
    }

    // Calculate totals
    let originalPrice = 0;
    let totalSavings = 0;

    cart.items.forEach(item => {
      const itemOriginalPrice = item.productId.price * item.quantity;
      const discountedPrice = itemOriginalPrice * (1 - item.productId.discount/100);
      originalPrice += itemOriginalPrice;
      totalSavings += itemOriginalPrice - discountedPrice;
    });

    const total = originalPrice - totalSavings - (cart.discount || 0);

    res.render('user/checkout', {
      user,
      cart,
      addresses,
      originalPrice,
      total,
      totalSavings
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { addressId, paymentMethod } = req.body;

    const cart = await cartModel.findOne({ user: userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Check stock availability before placing order
    for (const item of cart.items) {
      const product = item.productId;
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sorry, ${product.name} only has ${product.stock} units available`
        });
      }
    }

    // Update product stock
    for (const item of cart.items) {
      await userModel.findByIdAndUpdate(
        item.productId._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Clear cart
    await cartModel.findOneAndUpdate(
      { user: userId },
      { $set: { items: [], total: 0, discount: 0 } }
    );

    // Create order with coupon information
    const order = new Order({
      // ... existing order fields ...
      coupon: cart.discount > 0 ? {
        code: cart.couponCode,
        discount: cart.discount
      } : undefined,
      // ... rest of the order fields ...
    });

    res.json({ success: true, orderId: order._id });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ success: false, message: 'Error placing order' });
  }
};

export default {
  getCheckout,
  placeOrder
};

