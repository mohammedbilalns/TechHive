import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    items: [{
       productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
       },
       quantity: {
        type: Number,
        required: true
       }
    }]
}, { timestamps: true });

export default mongoose.model("cart", cartSchema);