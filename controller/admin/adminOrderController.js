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
      'shipped': ['delivered', 'cancelled'],
      'delivered': ['return_requested'],
      'return_requested': ['returned', 'delivered'], // Can either approve or reject return
      'returned': [],
      'cancelled': []
    };

    if (!validTransitions[orderItem.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition' });
    }

    // Handle return approval
    if (status === 'returned' && orderItem.status === 'return_requested') {
      // Calculate refund amount
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
              description: `Refund for returned item in order ${order.orderId}`
            }
          }
        },
        { upsert: true }
      );

      // Update product stock
      await productModel.findOneAndUpdate(
        { name: orderItem.name },
        { $inc: { stock: orderItem.quantity } }
      );

      orderItem.paymentStatus = 'refunded';
    }

    orderItem.status = status;
    await order.save();

    // Check if all items are returned/cancelled and update order payment status
    const allItemsReturnedOrCancelled = order.items.every(item => 
      ['cancelled', 'returned'].includes(item.status)
    );

    if (allItemsReturnedOrCancelled && order.paymentStatus === 'paid') {
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

