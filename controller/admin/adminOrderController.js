import orderModel from '../../model/orderModel.js';
import productModel from '../../model/productModel.js';
import walletModel from '../../model/walletModel.js';
import { nanoid } from 'nanoid';
// Get all orders
const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalOrders = await orderModel.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);

    // Get paginated orders
    const orders = await orderModel.find()
      .populate('userId', 'fullname email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render('admin/orders', {
      orders,
      page: 'orders',
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

const updateOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const orderItem = order.items.id(itemId);
    if (!orderItem) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['processing', 'shipped', 'delivered', 'cancelled'],
      'processing': ['shipped', 'delivered', 'cancelled'],
      'shipped': ['delivered', 'cancelled', 'returned']
    };

    if (!validTransitions[orderItem.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition' });
    }

    orderItem.status = status;

    // Handle refund for cancelled/returned items if payment was made
    if (['cancelled', 'returned'].includes(status) && order.paymentStatus === 'paid') {
      // Calculate refund amount for this item
      const itemPrice = orderItem.price;
      const itemDiscount = orderItem.discount;
      const quantity = orderItem.quantity;
      const refundAmount = (itemPrice * (1 - itemDiscount/100)) * quantity;

      // Create wallet transaction ID
      const walletTransactionId = 'WTX' + nanoid(8).toUpperCase();

      // Add refund to user's wallet
      await walletModel.findOneAndUpdate(
        { userId: order.userId },
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

    // Handle stock restoration for cancelled/returned items
    if (['cancelled', 'returned'].includes(status)) {
      await productModel.findOneAndUpdate(
        { name: orderItem.name },
        { $inc: { stock: orderItem.quantity } }
      );
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

    res.json({ success: true, message: 'Item status updated successfully' });
  } catch (error) {
    console.error('Update order item status error:', error);
    res.status(500).json({ success: false, message: 'Error updating item status' });
  }
};

export default {
  getOrders,
  updateOrderItemStatus
};