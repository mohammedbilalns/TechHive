import Offer from '../../model/offerModel.js';
import Category from '../../model/categoryModel.js';
import Product from '../../model/productModel.js';
import Referral from '../../model/referralModel.js';
import {log} from "mercedlogger"

const updateProductDiscounts = async (offer, remove = false) => {
    if (!offer.isActive && !remove) return;

    const discountValue = remove ? 0 : offer.offerPercentage;

    if (offer.offerType === 'product') {
        await Product.updateMany(
            { _id: { $in: offer.applicableProducts } },
            { $set: { discount: discountValue } }
        );
    } else if (offer.offerType === 'category') {
        await Product.updateMany(
            { category: { $in: offer.applicableCategories } },
            { $set: { discount: discountValue } }
        );
    }
};

const checkExistingOffers = async (offerType, items, startDate, endDate, excludeOfferId = null) => {
    const query = {
        isActive: true,
        _id: { $ne: excludeOfferId },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
    };

    if (offerType === 'product') {
        query.applicableProducts = { $in: items };
    } else {
        query.applicableCategories = { $in: items };
    }

    const existingOffer = await Offer.findOne(query);
    return existingOffer;
};

const getOffers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // Fetch offers 
        const offers = await Offer.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); 

        
        const currentDate = new Date();
        offers.forEach(offer => {
            offer.isExpired = new Date(offer.endDate) < currentDate;
        });

        const totalOffers = await Offer.countDocuments();
        const totalPages = Math.ceil(totalOffers / limit);

        // Fetch active categories and products
        const categories = await Category.find({ status: 'Active' })
            .select('_id name')
            .sort({ name: 1 });

        const products = await Product.find({ status: 'Active' })
            .select('_id name price')
            .populate('category', 'name')
            .sort({ name: 1 });

        // Format products 
        const formattedProducts = products.map(product => ({
            _id: product._id,
            name: `${product.name} (${product.category.name}) - ₹${product.price}`,
        }));

        // Fetch referral settings
        let referralSettings = await Referral.findOne();
        if (!referralSettings) {
            referralSettings = await new Referral().save();
        }

        res.render('admin/offers', {
            offers,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            categories,
            products: formattedProducts,
            referralSettings,
            page: 'offers'
        });
    } catch (error) {
        log.red('ERROR_FETCHING_OFFERS', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// Get offer details
const getOfferDetails = async (req, res) => {
    try {

        if (!req.params.offerId) {
            return res.status(400).json({ success: false, message: 'Offer ID is required' });
        }

        const offer = await Offer.findById(req.params.offerId)
            .populate('applicableCategories', '_id name')
            .populate('applicableProducts', '_id name');


        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        const response = {
            success: true,
            offer: {
                _id: offer._id,
                name: offer.name,
                offerType: offer.offerType,
                offerPercentage: offer.offerPercentage,
                startDate: offer.startDate,
                endDate: offer.endDate,
                isActive: offer.isActive,
                applicableCategories: offer.applicableCategories.map(cat => cat._id),
                applicableProducts: offer.applicableProducts.map(prod => prod._id)
            }
        };

        res.json(response);
    } catch (error) {
        log.red('ERROR_FETCHING_OFFER_DETAILS', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch offer details',
            error: error.message
        });
    }
}

// Add new offer
const addOffer = async (req, res) => {
    try {
        const {
            name,
            offerType,
            offerPercentage,
            startDate,
            endDate,
            categories,
            products
        } = req.body;

        // Check for existing active offers
        const items = offerType === 'category' ? categories : products;
        const existingOffer = await checkExistingOffers(offerType, items, startDate, endDate);

        if (existingOffer) {
            return res.status(400).json({
                success: false,
                message: `An active offer is already exists for some of the selected ${offerType}s`
            });
        }

        const newOffer = new Offer({
            name,
            offerType,
            offerPercentage,
            startDate,
            endDate,
            applicableCategories: offerType === 'category' ? categories : [],
            applicableProducts: offerType === 'product' ? products : []
        });

        await newOffer.save();
        await updateProductDiscounts(newOffer);
        res.json({ 
            success: true, 
            message: 'Offer added successfully',
            offerId: newOffer._id
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add offer' });
    }
}

// Update offer
const updateOffer = async (req, res) => {
    try {
        const oldOffer = await Offer.findById(req.params.offerId);
        if (!oldOffer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        const {
            name,
            offerType,
            offerPercentage,
            startDate,
            endDate,
            categories,
            products
        } = req.body;

        // Check for existing offers, excluding the current offer being updated
        const items = offerType === 'category' ? categories : products;
        const existingOffer = await checkExistingOffers(
            offerType, 
            items, 
            startDate, 
            endDate,
            req.params.offerId  // Pass the current offer ID to exclude it from the check
        );

        if (existingOffer) {
            return res.status(400).json({
                success: false,
                message: `An active offer already exists for some of the selected ${offerType}s during this period`
            });
        }

        // Remove old discounts
        await updateProductDiscounts(oldOffer, true);

        const updatedOffer = await Offer.findByIdAndUpdate(
            req.params.offerId,
            {
                name,
                offerType,
                offerPercentage,
                startDate,
                endDate,
                applicableCategories: offerType === 'category' ? categories : [],
                applicableProducts: offerType === 'product' ? products : []
            },
            { new: true }
        );

        // Apply new discounts
        await updateProductDiscounts(updatedOffer);
        res.json({ success: true, message: 'Offer updated successfully' });
    } catch (error) {
        log.red('ERROR_UPDATING_OFFER', error);
        res.status(500).json({ success: false, message: 'Failed to update offer' });
    }
}

// Toggle offer status
const toggleOfferStatus = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.offerId);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        //  check for conflicts when activating
        if (!offer.isActive) {
            const items = offer.offerType === 'category' ?
                offer.applicableCategories :
                offer.applicableProducts;

            const existingOffer = await checkExistingOffers(
                offer.offerType,
                items,
                offer.startDate,
                offer.endDate,
                offer._id
            );

            if (existingOffer) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot activate: Offer is already active for some of the selected ${offer.offerType}s`
                });
            }
        }

        offer.isActive = !offer.isActive;
        await offer.save();

        // Update product discounts based on new status
        if (!offer.isActive) {
            await updateProductDiscounts(offer, true);
        } else {
            await updateProductDiscounts(offer);
        }

        res.json({ success: true, message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to toggle offer status' });
    }
}

// Delete offer
const deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.offerId);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        // Remove discounts before deleting
        await updateProductDiscounts(offer, true);
        await offer.deleteOne();

        res.json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete offer' });
    }
}

//  update referral settings
const updateReferralSettings = async (req, res) => {
    try {
        const { referrerValue, refereeValue } = req.body;

        if (!referrerValue || !refereeValue) {
            return res.status(400).json({
                success: false,
                message: 'Both referrer and referee values are required'
            });
        }

        if (referrerValue < 0 || refereeValue < 0) {
            return res.status(400).json({
                success: false,
                message: 'Referral values cannot be negative'
            });
        }
        if(referrerValue <= refereeValue){
            return res.status(400).json({
                success: false,
                message: 'Referrer value cannot be greater than referee value'
            });
        }

        if(referrerValue > 100 || refereeValue > 100){
            return res.status(400).json({
                success: false,
                message: 'Referral values cannot be greater than 100'
            });
        }
        
        let referralSettings = await Referral.findOne();
        
        if (!referralSettings) {
            referralSettings = new Referral({
                referrerValue,
                refereeValue
            });
        } else {
            referralSettings.referrerValue = referrerValue;
            referralSettings.refereeValue = refereeValue;
        }

        await referralSettings.save();

        res.json({
            success: true,
            message: 'Referral settings updated successfully'
        });
    } catch (error) {
        log.red('ERROR_UPDATE_REFERRAL_SETTINGS', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update referral settings'
        });
    }
};

export default { getOffers, getOfferDetails, addOffer, updateOffer, toggleOfferStatus, deleteOffer, updateReferralSettings };


