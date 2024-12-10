
import mongoose from "mongoose"

const addressSchema = new mongoose.Schema({
    userId: {   
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    houseName: {
        type: String,
        required: true,
    },
    localityStreet: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    alternatePhone: {
        type: String,
    }
}, { timestamps: true })

export default mongoose.model('Address', addressSchema)