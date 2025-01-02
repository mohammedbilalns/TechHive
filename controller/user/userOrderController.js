import orderModel from '../../model/orderModel.js';
import cartModel from '../../model/cartModel.js';
import productModel from '../../model/productModel.js';
import addressModel from '../../model/addressModel.js';
import { nanoid } from 'nanoid';
import couponModel from '../../model/couponModel.js';
import { configDotenv } from 'dotenv';
import razorpay from '../../utils/razorpayConfig.js';
import crypto from 'crypto';
import walletModel from '../../model/walletModel.js';
import mongoose from 'mongoose';
configDotenv()

const placeOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod, couponCode } = req.body;
    const userId = req.session.user.id;

    // Get  cart, address, and wallet
    const [cart, shippingAddress, wallet] = await Promise.all([
      cartModel.findOne({ user: userId }).populate('items.productId'),
      addressModel.findById(addressId),
      walletModel.findOne({ userId })
    ]);

    if (!cart || cart.items.length === 0) {
      return res.json({ success: false, message: 'Cart is empty' });
    }

    // Calculate totals after applying offers 
    const totalAmount = cart.items.reduce((total, item) => {
      const price = item.productId.price;
      const discount = item.productId.discount;
      const discountedPrice = price * (1 - discount/100);
      return total + (discountedPrice * item.quantity);
    }, 0);

    // Calculate coupon discount if coupon code exists
    let couponDiscount = 0;
    let finalAmount = totalAmount;
    
    if (couponCode) {
      const coupon = await couponModel.findOne({ code: couponCode });
      if (coupon) {
        if (coupon.discountType === 'PERCENTAGE') {
          couponDiscount = Math.min(
            (totalAmount * coupon.discountValue) / 100,
            coupon.maxDiscount || Infinity
          );
        } else {
          couponDiscount = coupon.discountValue;
        }
        finalAmount = totalAmount - couponDiscount;
      }
    }

    // Check wallet balance if payment method is wallet
    if (paymentMethod === 'wallet') {
      if (!wallet || wallet.balance < finalAmount) {
        return res.json({ 
          success: false, 
          message: 'Insufficient wallet balance' 
        });
      }
    }

    // Create order items array with product data 
    const orderItems = cart.items.map(item => {
      if (item.productId.stock < item.quantity) {
        return res.json({
          success:false ,
          message: 'Insufficient stock for some product'
        })
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

    // Generate order ID 
    const date = new Date();
    const dateString = date.getFullYear().toString() +
                      (date.getMonth() + 1).toString().padStart(2, '0') +
                      date.getDate().toString().padStart(2, '0');
    const orderId = 'ORD' + dateString + nanoid(6).toUpperCase();

    // Create new order
    const order = new orderModel({
      orderId,
      userId,
      items: orderItems.map(item => ({
        ...item,
        status: (paymentMethod === 'cod' || paymentMethod === 'wallet') ? 'processing' : 'pending'
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
        alternatePhone: shippingAddress.alternatePhone
      },
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'processing',
      paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'pending',
      coupon: couponCode && couponDiscount > 0 ? {
        code: couponCode,
        discount: couponDiscount
      } : undefined
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
              discountAmount: couponDiscount
            }
          }
        }
      );
    }

    // Update product stock and clear cart 
    if (paymentMethod === 'cod' || paymentMethod === 'wallet') {
      await Promise.all([
        ...cart.items.map(item => 
          productModel.findByIdAndUpdate(
            item.productId._id,
            { $inc: { stock: -item.quantity } }
          )
        ),
        cartModel.findOneAndUpdate(
          { user: userId },
          { $set: { items: [], discount: 0, couponCode: null } }
        )
      ]);
    }

    // If payment method is online, create Razorpay order
    if (paymentMethod === 'online') {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(finalAmount * 100),
        currency: 'INR',
        receipt: order._id.toString()
      });

      order.paymentDetails = {
        razorpayOrderId: razorpayOrder.id
      };
      await order.save();

      return res.json({
        success: true,
        orderId: order._id,
        amount: razorpayOrder.amount,
        razorpayOrderId: razorpayOrder.id
      });
    }

    // Handle wallet payment
    if (paymentMethod === 'wallet') {
      // Deduct amount from wallet
      const walletTransactionId = 'WTX' + nanoid(8).toUpperCase();
      
      await walletModel.findOneAndUpdate(
        { userId },
        {
          $inc: { balance: -finalAmount },
          $push: {
            transactions: {
              transactionId: walletTransactionId,
              type: 'DEBIT',
              amount: finalAmount,
              description: `Payment for order ${orderId}`
            }
          }
        }
      );

      // Update order payment status
      order.paymentStatus = 'paid';
      await order.save();


      return res.json({ 
        success: true, 
        orderId: order._id,
        displayOrderId: order.orderId
      });
    }

    
    res.json({ 
      success: true, 
      orderId: order._id,
      displayOrderId: order.orderId
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
    
    // Validate if orderId is a valid  ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.redirect('/notfound?alertType=error&message=Invalid+order+id');
    }

    const order = await orderModel.findById(orderId);
    
    if (!order) {
      return res.redirect('/home');
    }

    res.render('user/order-success', { 
      orderId: order.orderId
    });
  } catch (error) {
    console.error('Get order success error:', error);
    res.redirect('/home');
  }
};

const getOrders = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Create search query
    const searchQuery = {
      userId,
      $or: [
        { orderId: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } }
      ]
    };

    // Get total count for pagination
    const totalOrders = await orderModel.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalOrders / limit);

    // Get paginated orders
    const orders = await orderModel
      .find(searchQuery)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullname email');

    res.render('user/profile/orders', {
      user: req.session.user,
      orders,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      search,
      page: 'orders'
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.render('user/profile/orders', { 
      orders: [],
      message: 'Failed to load orders',
      alertType: 'error',
      page: 'orders'
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

const cancelOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const userId = req.session.user.id;

    const order = await orderModel.findOne({ _id: orderId, userId });

    if (!order) {
      return res.json({ success: false, message: 'Order not found' });
    }

    const orderItem = order.items.id(itemId);
    if (!orderItem) {
      return res.json({ success: false, message: 'Order item not found' });
    }

    // Check if item can be cancelled
    if (['delivered', 'cancelled', 'returned'].includes(orderItem.status)) {
      return res.json({ success: false, message: 'Item cannot be cancelled' });
    }

    // Update item status
    orderItem.status = 'cancelled';

    // Handle refund if payment was made
    if (order.paymentStatus === 'paid') {
      // Calculate  refund amount for this item
      const itemPrice = orderItem.price;
      const itemDiscount = orderItem.discount;
      const quantity = orderItem.quantity;
      const baseRefundAmount = (itemPrice * (1 - itemDiscount/100)) * quantity;

      let couponDiscount = 0;
      if (order.coupon && order.coupon.discount > 0) {
        // Distribute coupon discount
        const totalPrice = order.items.reduce((sum, item) => sum + (item.price*item.quantity), 0);          
        couponDiscount = (orderItem.quantity * orderItem.price/totalPrice) * order.coupon.discount

      }

      // Final refund amount after deducting proportional coupon discount
      const refundAmount = baseRefundAmount - couponDiscount;

      const walletTransactionId = 'WTX' + nanoid(8).toUpperCase();

      // Add refund to user's wallet
      await walletModel.findOneAndUpdate(
        { userId },
        {
          $inc: { balance: refundAmount },
          $push: {
            transactions: {
              transactionId: walletTransactionId,
              type: 'CREDIT',
              amount: refundAmount,
              description: `Refund for cancelled item in order ${order.orderId}`
            }
          }
        },
        { upsert: true }
      );

      // Set payment status to refunded for this item
      orderItem.paymentStatus = 'refunded';
    }

    await order.save();

    // Check if all items are cancelled/returned
    const allItemsCancelledOrReturned = order.items.every(item => 
      ['cancelled', 'returned'].includes(item.status)
    );

    // Update order payment status if all items are cancelled/returned
    if (allItemsCancelledOrReturned && order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
      await order.save();
    }

    // Restore stock for the cancelled item
    await productModel.findOneAndUpdate(
      { name: orderItem.name },
      { $inc: { stock: orderItem.quantity } }
    );

    res.json({ success: true, message: 'Item cancelled successfully' });

  } catch (error) {
    console.error('Cancel order item error:', error);
    res.json({ success: false, message: 'Failed to cancel item' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_order_id,
      razorpay_signature,
      orderId 
    } = req.body;

    // Verify payment signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Find order and update payment status and details
      const order = await orderModel.findById(orderId);
      if (!order) {
        return res.json({ success: false, message: 'Order not found' });
      }

      // Update order status and payment details
      order.items.forEach(item => item.status = 'processing')
      order.paymentStatus = 'paid';
      order.paymentDetails = {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      };
      await order.save();

      // Clear cart and update stock
      await Promise.all([
        cartModel.findOneAndUpdate(
          { user: order.userId },
          { $set: { items: [], discount: 0, couponCode: null } }
        ),
        ...order.items.map(item => 
          productModel.findOneAndUpdate(
            { name: item.name },
            { $inc: { stock: -item.quantity } }
          )
        )
      ]);

      res.json({ success: true });
    } else {
      res.json({ 
        success: false, 
        message: 'Payment verification failed' 
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.json({ 
      success: false, 
      message: 'Payment verification failed' 
    });
  }
};

const returnOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;
    const userId = req.session.user.id;

    // Validate return reason length
    if (!reason || reason.length < 10 || reason.length > 300) {
      return res.json({ 
        success: false, 
        message: 'Return reason must be between 10 and 300 characters' 
      });
    }

    const order = await orderModel.findOne({ _id: orderId, userId });

    if (!order) {
      return res.json({ success: false, message: 'Order not found' });
    }

    const orderItem = order.items.id(itemId);
    if (!orderItem) {
      return res.json({ success: false, message: 'Order item not found' });
    }

    // Check if item can be returned
    if (orderItem.status !== 'delivered') {
      return res.json({ success: false, message: 'Item cannot be returned' });
    }

    // Update item status to return_requested and add return information
    orderItem.status = 'return requested';
    orderItem.return = {
      reason: reason,
      requestedAt: new Date()
    };

    await order.save();

    res.json({ success: true, message: 'Return request submitted successfully' });

  } catch (error) {
    console.error('Return order item error:', error);
    res.json({ success: false, message: 'Failed to process return request' });
  }
};

export default {
  placeOrder,
  getOrderSuccess,
  getOrders,
  getOrderDetails,
  cancelOrderItem,
  verifyPayment,
  returnOrderItem
};
