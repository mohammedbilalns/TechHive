import orderModel from '../../model/orderModel.js';
import cartModel from '../../model/cartModel.js';
import productModel from '../../model/productModel.js';
import addressModel from '../../model/addressModel.js';

const placeOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod } = req.body;
    const userId = req.session.user.id;

    // Get user's cart and address
    const [cart, shippingAddress] = await Promise.all([
      cartModel.findOne({ user: userId }).populate('items.productId'),
      addressModel.findById(addressId)
    ]);

    if (!cart || cart.items.length === 0) {
      return res.json({ success: false, message: 'Cart is empty' });
    }

    // Calculate totals
    const totalAmount = cart.items.reduce((total, item) => {
      const price = item.productId.price;
      const discount = item.productId.discount;
      const discountedPrice = price * (1 - discount/100);
      return total + (discountedPrice * item.quantity);
    }, 0);

    // Create order items array with product data 
    const orderItems = cart.items.map(item => {
      if (item.productId.stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${item.productId.name}`);
      }
      
      return {
        name: item.productId.name,
        brand: item.productId.brand,
        images: item.productId.images,
        quantity: item.quantity,
        price: item.productId.price,
        discount: item.productId.discount
      };
    });

    // Create new order with address 
    const order = new orderModel({
      userId,
      items: orderItems,
      totalAmount,
      paymentMethod,
      shippingAddress: {
        name: shippingAddress.name,
        houseName: shippingAddress.houseName,
        localityStreet: shippingAddress.localityStreet,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        phone: shippingAddress.phone,
        alternatePhone: shippingAddress.alternatePhone
      },
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
      status: 'processing',
      paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'paid'
    });

    await order.save();

    // Update product stock
    for (const item of cart.items) {
      await productModel.findByIdAndUpdate(
        item.productId._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Clear the cart
    await cartModel.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } }
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
      message: error.message || 'Failed to place order' 
    });
  }
};

const getOrderSuccess = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    res.render('user/order-success', { orderId });
  } catch (error) {
    console.error('Get order success error:', error);
    res.redirect('/home');
  }
};

const getOrders = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const orders = await orderModel.find({ userId })
      .sort({ orderDate: -1 });

    res.render('user/profile/orders', { 
      orders,
      user: req.session.user, 
      page: 'orders'
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.render('user/profile/orders', { 
      message: 'Failed to load orders',
      alertType: 'error',
      orders: [] 
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.session.user.id;

    const order = await orderModel.findOne({ _id: orderId, userId });

    if (!order) {
      return res.json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check if order can be cancelled (not delivered/already cancelled)
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.json({ 
        success: false, 
        message: 'Order cannot be cancelled' 
      });
    }

    order.status = 'cancelled';
    await order.save();

    // Restore stock for each product
    for (const item of order.items) {
      await productModel.findOneAndUpdate(
        { name: item.name },
        { $inc: { stock: item.quantity } }
      );
    }

    res.json({ 
      success: true, 
      message: 'Order cancelled successfully' 
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.json({ 
      success: false, 
      message: 'Failed to cancel order' 
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.session.user.id;

    const order = await orderModel.findOne({ _id: orderId, userId })
      .populate({
        path: 'items.product',
        select: 'name images price'
      })
      .populate('shippingAddress');

    if (!order) {
      return res.render('user/order-details', {
        message: 'Order not found',
        alertType: 'error'
      });
    }

    res.render('user/order-details', { order });

  } catch (error) {
    console.error('Get order details error:', error);
    res.render('user/order-details', {
      message: 'Failed to load order details',
      alertType: 'error'
    });
  }
};

export default {
  placeOrder,
  getOrderSuccess,
  getOrders,
  cancelOrder,
  getOrderDetails
};
