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
      'delivered': ['return requested'],
      'return requested': ['returned', 'delivered'], 
      'returned': [],
      'cancelled': []
    };

    if (!validTransitions[orderItem.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition' });
    }

    // Handle return approval or cancellation refund
    if ((status === 'returned' && orderItem.status === 'return requested') || 
        (status === 'cancelled' && order.paymentStatus === 'paid')) {
      // Calculate base refund amount for this item
      const itemPrice = orderItem.price;
      const itemDiscount = orderItem.discount;
      const quantity = orderItem.quantity;
      const baseRefundAmount = (itemPrice * (1 - itemDiscount/100)) * quantity;

      // Calculate coupon discount per item if coupon was applied
      let couponDiscountPerItem = 0;
      if (order.coupon && order.coupon.discount > 0) {
        // Distribute coupon discount equally among all items
        const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
        couponDiscountPerItem = (order.coupon.discount / totalItems) * quantity;
      }

      // Final refund amount after deducting proportional coupon discount
      const refundAmount = baseRefundAmount - couponDiscountPerItem;

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
              description: `Refund for ${status === 'cancelled' ? 'cancelled' : 'returned'} item in order ${order.orderId}`
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

    // Update status-specific dates
    if (status === 'shipped') {
      orderItem.shippedDate = new Date();
    } else if (status === 'delivered') {
      orderItem.deliveredDate = new Date();
    } else if (status === 'cancelled') {
      orderItem.cancelledDate = new Date();
    } else if (status === 'returned') {
      orderItem.returnedDate = new Date();
    } else if (status === 'return requested') {
      orderItem.return = {
        reason: req.body.reason || 'No reason provided',
        requestedAt: new Date()
      };
    }

    orderItem.status = status;
    await order.save();

    // Check if all items are delivered and update order payment status
    const allItemsDelivered = order.items.every(item => 
      item.status === 'delivered'
    );

    if (allItemsDelivered) {
      order.paymentStatus = 'paid';
      await order.save();
    }

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

