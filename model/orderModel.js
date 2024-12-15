import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  images: [{ path: String, filename: String }],
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 }
});

const orderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'users', 
    required: true 
  },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['cod', 'card', 'bank_transfer', 'upi'], 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['paid', 'unpaid'], 
    default: 'unpaid' 
  },
  shippingAddress: {
    name: { type: String, required: true },
    houseName: { type: String, required: true },
    localityStreet: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true },
    alternatePhone: { type: String }
  },
  orderDate: { 
    type: Date, 
    default: Date.now 
  },
  expectedDeliveryDate: { 
    type: Date 
  },
  deliveryDate: { 
    type: Date 
  },
  deliveryStatus: { 
    type: String, 
    enum: ['pending', 'in_transit', 'delivered', 'failed'], 
    default: 'pending' 
  },
}, { 
  timestamps: true 
});

export default mongoose.model('order', orderSchema);


