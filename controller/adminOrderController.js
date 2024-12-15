import orderModel from '../model/orderModel.js';

// Get all orders
const getOrders = async (req, res) => {
  try {
    const orders = await orderModel.find()
      .populate('userId', 'fullname email')
      .sort({ createdAt: -1 });

    res.render('admin/orders', { orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching orders' 
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is in a final state
    if (['cancelled', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update order in final state'
      });
    }

    const validTransitions = {
      'pending': ['processing', 'shipped', 'delivered', 'cancelled'],
      'processing': ['shipped', 'delivered', 'cancelled'],
      'shipped': ['delivered', 'cancelled']
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status transition'
      });
    }

    order.status = status;
    
    // Update payment status to paid when order is delivered
    if (status === 'delivered') {
      order.paymentStatus = 'paid';
    }
    
    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
};

export default {
  getOrders,
  updateOrderStatus
};