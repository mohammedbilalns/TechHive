import mongoose from "mongoose";


const offerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    offerPercentage: {
        type: Number,
        required: true,
    },
    offerType: {
        type: String,
        enum: ["category", "product"],
        required: true,
    },
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    }],
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    }],
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export default mongoose.model("Offer", offerSchema);