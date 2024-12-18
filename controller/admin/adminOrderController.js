import orderModel from '../../model/orderModel.js';
import productModel from '../../model/productModel.js';
// Get all orders
const getOrders = async (req, res) => {
  try {
    const orders = await orderModel.find()
      .populate('userId', 'fullname email')
      .sort({ createdAt: -1 });

    res.render('admin/orders', { orders, page: 'orders' });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

// Update order status
// const updateOrderStatus = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { status } = req.body;

//     const order = await orderModel.findById(orderId);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     // Check if order is in a final state
//     if (['cancelled', 'delivered'].includes(order.status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Cannot update order in final state'
//       });
//     }

//     const validTransitions = {
//       'pending': ['processing', 'shipped', 'delivered', 'cancelled'],
//       'processing': ['shipped', 'delivered', 'cancelled'],
//       'shipped': ['delivered', 'cancelled']
//     };

//     if (!validTransitions[order.status]?.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid status transition'
//       });
//     }

//     order.status = status;

//     // Update payment status to paid when order is delivered
//     if (status === 'delivered') {
//       order.paymentStatus = 'paid';
//     }

//     // Restore stocks for each product 
//     if (status === "cancelled") {
//       for (const item of order.items) {
//         await productModel.findOneAndUpdate(
//           { name: item.name },
//           { $inc: { stock: item.quantity } }
//         );
//       }
//     }

//     await order.save();

//     res.json({
//       success: true,
//       message: 'Order status updated successfully'
//     });
//   } catch (error) {
//     console.error('Error updating order status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating order status'
//     });
//   }
// };

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

    // Handle stock restoration for cancelled/returned items
    if (['cancelled', 'returned'].includes(status)) {
      await productModel.findOneAndUpdate(
        { name: orderItem.name },
        { $inc: { stock: orderItem.quantity } }
      );
    }

    await order.save();

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