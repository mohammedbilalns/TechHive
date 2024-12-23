import mongoose, { Schema } from "mongoose";

const couponSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    discountType: {
        type: String,
        required: true,
        enum: ['PERCENTAGE', 'FIXED']  
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    minPurchase: {
        type: Number,
        default: 0
    },
    maxDiscount: {
        type: Number,
        default: null
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageLimit: {
        type: Number,
        default: 1
    },
    usageHistory: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        usedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

export default mongoose.model('Coupon', couponSchema);