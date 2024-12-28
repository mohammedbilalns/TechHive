import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    rating: {
        type: Number,
        required: true, 
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        minLength: 10,
        maxLength: 100
    }
}, { timestamps: true });

export default mongoose.model("review", reviewSchema);