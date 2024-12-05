import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
   
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories", 
        required: true,
    },
    variants: [
        {
            price: { type: Number, required: true }, // Price of the variant
            rating: { type: Number, default: 0 },

            images: {
                type: [String], // Array of image URLs
                validate: {
                    validator: (arr) => arr.length === 4, // Ensure exactly 4 images
                    message: "Variants must have exactly 4 images.",
                },
            },
    discount: {
        type:Number ,
        min: 0 , 
        max:100 , 
        default:0 
    },
    discountPrice:{
        type:Number , 
        default:0 
    },stock: {
        type: Number,
        required: true,
    },
        },
     
    ]
}, { timestamps: true });

export default mongoose.model("products", productSchema);
