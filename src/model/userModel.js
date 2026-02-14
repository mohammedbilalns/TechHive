import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    otpValue: {
        type: String,
       
    },
    otpExpiresAt: {
        type: Date,
    },
    otpAttempts: {
        type: Number,
        default: 0,
    },
});

const userSchema = new mongoose.Schema(
	{
		fullname: {
			type: String,
			required: true,
		},
		phonenumber: {
			type: Number,
			sparse: true
		},
		email: {
			type: String,
			required: true,
			unique: true 
		},
		googleId: {
			type: String,
		},
		password: {
			type: String,
		},
		status: {
			type: String,
			enum: ["Pending", "Active", "Blocked"],
		},
		otp: otpSchema,
		referralCode : {
			type: String,
			unique: true 
		}
	},
	{ timestamps: true }
);


export default mongoose.model("users", userSchema);


