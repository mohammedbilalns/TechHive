import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    fullname:{
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

export default mongoose.model("users", userSchema)

