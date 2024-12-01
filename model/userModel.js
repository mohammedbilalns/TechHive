import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    fullname:{
        type: String , 
        required:true 
    },
    phonenumber:{
        type:Number,
        unique:true
    },
    email:{
        type:String, 
        required:true ,
        unique:true
    }, 
    googleId:{
        type: String 
    },
    password: {
        type: String, 
    },
    status:{
        type: String , 
        enum: ["pending","active", "blocked"]
        
    },

}, {timestamps: true})

userSchema.index({ email: 1 });
userSchema.index({ phonenumber: 1 });

export default mongoose.model("users", userSchema)

