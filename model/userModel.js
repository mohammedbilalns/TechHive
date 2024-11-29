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
        enum: ["pending","active", "blocked"]
    },

})

export default mongoose.model("users", userSchema)

