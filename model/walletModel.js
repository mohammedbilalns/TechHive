import mongoose, { mongo } from "mongoose";

const walletSchema = new mongoose.Schema({

    balance: {
        type: Number,
        required: true,
        default: 0
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    transactions: [
        {
            transactionId: {
                type: String,
                required: true
            },
            type: {
                type: String,
                enum: ["DEBIT", "CREDIT"],
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            date: {
                type: Date,
                default: Date.now,
                required: true
            }
        }
    ]
}, { timestamps: true })


export default mongoose.model("wallet", walletSchema)