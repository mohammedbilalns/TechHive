import userSchema from "../model/userModel.js";
import { log } from "mercedlogger";
import Address from "../model/addressModel.js";
import addressSchema from "../model/addressModel.js";

const getAddresses = async(req,res)=>{
    try{
        let email = req.session.user.email
        let user = await userSchema.findOne({email})

        let addresses = await addressSchema.find({userId: user._id})
        res.render('user/addresses', {addresses, user, page:"addresses"}) 

    }catch(error){
        log.red("FETCH_ADDRESSES_ERROR", error)
    }
}
// Add a new address
const addAddress = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ 
                success: false, 
                message: "User not authenticated" 
            });
        }

        // Check existing address count
        const addressCount = await Address.countDocuments({ userId: req.session.user.id });
        if (addressCount >= 5) {
            return res.status(400).json({ 
                success: false, 
                message: "Maximum limit of 5 addresses reached" 
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

        const newAddress = new Address({
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
        console.log("Detailed error:", error); // Debug log
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
        
        // Validate required fields
        if (!name || !houseName || !localityStreet || !city || !state || !pincode || !phone) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields" 
            });
        }

        // Validate pincode and phone number format
        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid pincode format" 
            });
        }

        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid phone number format" 
            });
        }

        // If alternate phone is provided, validate its format
        if (alternatePhone && !/^\d{10}$/.test(alternatePhone)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid alternate phone number format" 
            });
        }

        const address = await Address.findOneAndUpdate(
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
        log.red("ERROR", error);
        res.status(500).json({
            success: false,
            message: 'Failed to update address'
        });
    }
};

// Delete an address
const deleteAddress = async (req, res) => {
    try {
        const address = await Address.findOneAndDelete({
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
        log.red("ERROR", error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete address'
        });
    }
};

// Add this new function to get a single address
const getAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const userId = req.session.user.id;

        const address = await Address.findOne({
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
        log.red("ERROR", error);
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