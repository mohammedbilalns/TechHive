import Offer from '../../model/offerModel.js';
import Category from '../../model/categoryModel.js';
import Product from '../../model/productModel.js';

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


const getOffers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // Fetch offers with pagination
        const offers = await Offer.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

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

        // Format products to include category name
        const formattedProducts = products.map(product => ({
            _id: product._id,
            name: `${product.name} (${product.category.name}) - ₹${product.price}`,
        }));

        res.render('admin/offers', {
            offers,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            categories,
            page: 'offers',
            products: formattedProducts
        });
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// Get offer details
const getOfferDetails = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.offerId);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
        res.json({ success: true, offer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
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
        res.json({ success: true, message: 'Offer added successfully' });
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

        // Remove old discounts
        await updateProductDiscounts(oldOffer, true);

        const {
            name,
            offerType,
            offerPercentage,
            startDate,
            endDate,
            categories,
            products
        } = req.body;

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


export default { getOffers, getOfferDetails, addOffer, updateOffer, toggleOfferStatus, deleteOffer };


