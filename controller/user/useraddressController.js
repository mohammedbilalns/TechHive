import userSchema from "../../model/userModel.js";
import { log } from "mercedlogger";
import addressSchema from "../../model/addressModel.js";
import mongoose from 'mongoose';

// get all addresses of a user
const getAddresses = async (req, res) => {
    try {
        let email = req.session.user.email
        let user = await userSchema.findOne({ email })

        let addresses = await addressSchema.find({ userId: user._id })
        res.render('user/profile/addresses', { addresses, user, page: "addresses" })
    } catch (error) {
        log.red("FETCH_ADDRESSES_ERROR", error)
        res.status(500).render("notfound")
    }
}
let a = 10 
let b = 15 
// Add a new address
const addAddress = async (req, res) => {
    try {

        const addressCount = await addressSchema.countDocuments({ userId: req.session.user.id });
        if (addressCount >= 4) {
            return res.status(400).json({
                success: false,
                message: "Maximum limit of 4 addresses reached"
            });
        }

        const { name, houseName, localityStreet, city, state, pincode, phone, alternatePhone } = req.body;

        // Validate required fields
        if (!name || !houseName || !localityStreet || !city || !state || !pincode || !phone) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const newAddress = new addressSchema({
            userId: req.session.user.id,
            name,
            houseName,
            localityStreet,
            city,
            state,
            pincode,
            phone,
            alternatePhone
        });

        const savedAddress = await newAddress.save();

        res.status(201).json({
            success: true,
            message: "Address added successfully",
            address: savedAddress
        });
    } catch (error) {
        log.red("ADD_ADDRESS_ERROR", error); 
        res.status(500).json({
            success: false,
            message: "Failed to add address: " + error.message,
            error: error.toString()
        });
    }
};

// Update an address
const updateAddress = async (req, res) => {
    try {
        const { name, houseName, localityStreet, city, state, pincode, phone, alternatePhone } = req.body;

        if (!name || !houseName || !localityStreet || !city || !state || !pincode || !phone) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const address = await addressSchema.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.session.user.id
            },
            {
                name,
                houseName,
                localityStreet,
                city,
                state,
                pincode,
                phone,
                alternatePhone
            },
            { new: true }
        );

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        res.json({
            success: true,
            message: 'Address updated successfully',
            address
        });
    } catch (error) {
        log.red("UPDATE_ADDRESS_ERROR", error);
        res.status(500).json({
            success: false,
            message: 'Failed to update address'
        });
    }
};

// Delete an address
const deleteAddress = async (req, res) => {
    try {
        const address = await addressSchema.findOneAndDelete({
            _id: req.params.id,
            userId: req.session.user.id
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        res.json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        log.red("DELETE_ADDRESS_ERROR", error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete address'
        });
    }
};

// get a single address
const getAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const userId = req.session.user.id;

        // Validate if addressId is a valid  ObjectId
        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.redirect("/notfound?message=Invalid+Address+Id&alertType=error")
        }

        const address = await addressSchema.findOne({
            _id: addressId,
            userId: userId
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        res.json({
            success: true,
            address
        });
    } catch (error) {
        log.red("GET_ADDRESS_ERROR", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch address'
        });
    }
};

export default {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    getAddress
}
