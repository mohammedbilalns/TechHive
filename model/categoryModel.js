import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    status: { type: String, required: true, enum: ['Active', 'Inactive'] },
},{ timestamps: true });

export default mongoose.model('Category', categorySchema);