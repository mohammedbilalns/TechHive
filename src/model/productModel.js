import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  specifications: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  discount:{
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  images: [{
    path: String,
    filename: String
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, { timestamps: true });

productSchema.pre('find', async function() {
  const now = new Date();

  // Find all active offers that have expired
  const Offer = mongoose.model('Offer');
  const expiredOffers = await Offer.find({
    isActive: true,
    endDate: { $lt: now }
  });

  // If there are expired offers, update the products
  if (expiredOffers.length > 0) {
    for (const offer of expiredOffers) {
      offer.isActive = false;
      await offer.save();

      if (offer.offerType === 'product') {
        await this.model.updateMany(
          { _id: { $in: offer.applicableProducts } },
          { $set: { discount: 0 } }
        );
      } else if (offer.offerType === 'category') {
        await this.model.updateMany(
          { category: { $in: offer.applicableCategories } },
          { $set: { discount: 0 } }
        );
      }
    }
  }
});

export default mongoose.model('Product', productSchema);