import orderModel from '../model/orderModel.js';
import cartModel from '../model/cartModel.js';

const userOrderController = {
  async placeOrder(req, res) {
    try {
      const { addressId, paymentMethod } = req.body;
      const userId = req.session.user.id;

      // Get user's cart
      const cart = await cartModel.findOne({ user: userId })
        .populate('items.productId');

        console.log(cart)

      if (!cart || cart.items.length === 0) {
        return res.json({ 
          success: false, 
          message: 'Cart is empty' 
        });
      }

      // Calculate totals
      const totalAmount = cart.items.reduce((total, item) => {
        const price = item.productId.price;
        const discount = item.productId.discount;
        const discountedPrice = price * (1 - discount/100);
        return total + (discountedPrice * item.quantity);
      }, 0);

      // Create order items array
      const orderItems = cart.items.map(item => ({
        product: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price,
        discount: item.productId.discount
      }));

      // Create new order
      const order = new orderModel({
        userId,
        items: orderItems,
        totalAmount,
        paymentMethod,
        shippingAddress: addressId,
        orderDate: new Date(),
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending',
        paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'paid'
      });

      await order.save();

      // Clear the cart
      await cartModel.findOneAndUpdate(
        { userId },
        { $set: { items: [], discount: 0 } }
      );

      res.json({ 
        success: true, 
        orderId: order._id,
        message: 'Order placed successfully' 
      });

    } catch (error) {
      console.error('Place order error:', error);
      res.json({ 
        success: false, 
        message: 'Failed to place order' 
      });
    }
  },

  async getOrderSuccess(req, res) {
    try {
      const orderId = req.params.orderId;
      res.render('user/order-success', { orderId });
    } catch (error) {
      console.error('Get order success error:', error);
      res.redirect('/home');
    }
  }
};

export default userOrderController;
