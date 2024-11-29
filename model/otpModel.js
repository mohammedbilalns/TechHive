import mongoose from "mongoose"

const otpSchema = new mongoose.Schema({
    email:String,
    otp:String,
    createdAt : {type: Date, default:Date.now, expires:28}
}, {timestamps: true})

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 28 }); // Ensure TTL index is set

const OTP = mongoose.model("OTP", otpSchema);

const saveOTP = async (email, otp) => {
  const newOTP = new OTP({ email, otp });
  await newOTP.save();
};


export default { OTP, saveOTP}