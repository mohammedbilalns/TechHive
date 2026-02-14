import mongoose from "mongoose";

const referralSchema = new mongoose.Schema({
	referrerValue: {
		type: Number,
		default: 100,
		required: true
	},
	refereeValue: {
		type: Number,
		default: 50,
		required: true
	}
}, { timestamps: true });

export default mongoose.model("referral", referralSchema);
