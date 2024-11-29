import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    username:{
        type: String , 
        required:true 
    },
    phonenumber:{
        type:Number,
   
    },
    email:{
        type:String, 
        required:true 
    }, 
    password: {
        type: String, 
        required: true
    },
    status:{
        type: String , 
        enum: ["active", "blocked"]
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    otp: String,
      otpExpiry: {
        type: Date,
        index: { expires: '1m' }, 
    }
})


export default mongoose.model("users", userSchema)