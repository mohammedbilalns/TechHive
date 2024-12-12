import userModel from '../model/userModel.js';
import cartModel from '../model/cartModel.js';
import addressModel from '../model/addressModel.js';
//import Order from '../models/orderModel.js';

const checkoutController = {
  getCheckout: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const user = await userModel.findById(userId);
      const cart = await cartModel.findOne({ user: userId }).populate('items.productId');
      const addresses = await addressModel.find({ userId: userId });
    
      if (!cart || cart.items.length === 0) {
        return res.redirect('/profile/cart');
      }

      // Calculate totals
      let subtotal = 0;
      let totalSavings = 0;

      cart.items.forEach(item => {
        const originalPrice = item.productId.price * item.quantity;
        const discountedPrice = originalPrice * (1 - item.productId.discount/100);
        subtotal += discountedPrice;
        totalSavings += originalPrice - discountedPrice;
      });

      const total = subtotal - (cart.discount || 0);

      res.render('user/checkout', {
        user,
        cart,
        addresses,
        subtotal,
        total,
        totalSavings
      });
    } catch (error) {
      console.error('Checkout error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  placeOrder: async (req, res) => {
    try {
      const userId = req.session.user_id;
      const { addressId, paymentMethod } = req.body;

      const cart = await cartModel.findOne({ user: userId }).populate('items.productId');
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }

      // Create order
    //   const order = new Order({
    //     user: userId,
    //     address: addressId,
    //     items: cart.items,
    //     paymentMethod,
    //     total: cart.total,
    //     discount: cart.discount || 0
    //   });

    //   await order.save();

      // Clear cart
      await cartModel.findOneAndUpdate(
        { user: userId },
        { $set: { items: [], total: 0, discount: 0 } }
      );

      res.json({ success: true, orderId: order._id });
    } catch (error) {
      console.error('Place order error:', error);
      res.status(500).json({ success: false, message: 'Error placing order' });
    }
  }
};

export default checkoutController;
