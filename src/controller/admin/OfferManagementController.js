import { offerModel } from "../../model/offerModel.js";
import { categoryModel } from "../../model/categoryModel.js";
import { productModel } from "../../model/productModel.js";
import { referralModel } from "../../model/referralModel.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/appError.js";
import { validateOffer } from "../../validators/offer.validator.js";
import { validateReferralSettings } from "../../validators/referral.validator.js";
import { AdminOfferErrorMessages } from "../../constants/errorMessages.js";
import { AdminOfferSuccessMessages } from "../../constants/successMessage.js";
import { ADMIN_VIEW_PATHS } from "../../constants/viewPaths.js";
import {
  getPageNumber,
  getPaginationMeta,
} from "../../utils/controllerHelpers.js";

const updateProductDiscounts = async (offer, remove = false) => {
  if (!offer.isActive && !remove) return;

  const discountValue = remove ? 0 : offer.offerPercentage;

  if (offer.offerType === "product") {
    await productModel.updateMany(
      { _id: { $in: offer.applicableProducts } },
      { $set: { discount: discountValue } },
    );
  } else if (offer.offerType === "category") {
    await productModel.updateMany(
      { category: { $in: offer.applicableCategories } },
      { $set: { discount: discountValue } },
    );
  }
};

const checkExistingOffers = async (
  offerType,
  items,
  startDate,
  endDate,
  excludeOfferId = null,
) => {
  const query = {
    isActive: true,
    _id: { $ne: excludeOfferId },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };

  if (offerType === "product") {
    query.applicableProducts = { $in: items };
  } else {
    query.applicableCategories = { $in: items };
  }

  const existingOffer = await offerModel.findOne(query).lean();
  return existingOffer;
};

export const renderOffersPage = asyncHandler(async (req, res) => {
  const page = getPageNumber(req.query.page);
  const limit = 10;
  const totalOffers = await offerModel.countDocuments();
  const { totalPages, hasNextPage, hasPrevPage, skip } = getPaginationMeta(
    page,
    totalOffers,
    limit,
  );

  let [offers, categories, products, referralSettings] = await Promise.all([
    offerModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    categoryModel
      .find({ status: "Active" })
      .select("_id name")
      .sort({ name: 1 })
      .lean(),
    productModel
      .find({ status: "Active" })
      .select("_id name price category")
      .populate("category", "name")
      .sort({ name: 1 })
      .lean(),
    referralModel.findOne().lean(),
  ]);

  const currentDate = new Date();
  offers.forEach((offer) => {
    offer.isExpired = new Date(offer.endDate) < currentDate;
  });

  const formattedProducts = products.map((product) => ({
    _id: product._id,
    name: `${product.name} (${product.category?.name}) - ₹${product.price}`,
  }));

  if (!referralSettings) {
    referralSettings = await new referralModel().save();
  }

  res.render(ADMIN_VIEW_PATHS.Offers, {
    offers,
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    categories,
    products: formattedProducts,
    referralSettings,
    page: "offers",
  });
});

// Get offer details
export const getOfferDetails = asyncHandler(async (req, res) => {
  if (!req.params.offerId) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      AdminOfferErrorMessages.OFFER_ID_REQUIRED,
    );
  }

  const offer = await offerModel
    .findById(req.params.offerId)
    .populate("applicableCategories", "_id name")
    .populate("applicableProducts", "_id name")
    .lean();

  if (!offer) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      AdminOfferErrorMessages.OFFER_NOT_FOUND,
    );
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
      applicableCategories: offer.applicableCategories.map((cat) => cat._id),
      applicableProducts: offer.applicableProducts.map((prod) => prod._id),
    },
  };

  res.json(response);
});

// Add new offer
export const addOffer = asyncHandler(async (req, res) => {
  const error = validateOffer(req.body);
  if (error) {
    throw new AppError(HttpStatus.BAD_REQUEST, error);
  }

  const {
    offerType,
    offerPercentage,
    startDate,
    endDate,
    categories,
    products,
  } = req.body;
  const name = req.body.name.trim();

  if (startDate < new Date()) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      AdminOfferErrorMessages.START_DATE_PAST,
    );
  }

  // Check for existing active offers
  const items = offerType === "category" ? categories : products;
  const existingOffer = await checkExistingOffers(
    offerType,
    items,
    startDate,
    endDate,
  );

  if (existingOffer) {
    throw new AppError(
      HttpStatus.CONFLICT,
      AdminOfferErrorMessages.ACTIVE_OFFER_EXISTS(offerType),
    );
  }

  const newOffer = new offerModel({
    name,
    offerType,
    offerPercentage,
    startDate,
    endDate,
    applicableCategories: offerType === "category" ? categories : [],
    applicableProducts: offerType === "product" ? products : [],
  });

  await newOffer.save();
  await updateProductDiscounts(newOffer);
  res.json({
    success: true,
    message: AdminOfferSuccessMessages.ADDED,
    offerId: newOffer._id,
  });
});

// Update offer
export const updateOffer = asyncHandler(async (req, res) => {
  const oldOffer = await offerModel.findById(req.params.offerId).lean();
  if (!oldOffer) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      AdminOfferErrorMessages.OFFER_NOT_FOUND,
    );
  }

  const error = validateOffer(req.body);
  if (error) {
    throw new AppError(HttpStatus.BAD_REQUEST, error);
  }

  const {
    offerType,
    offerPercentage,
    startDate,
    endDate,
    categories,
    products,
  } = req.body;
  const name = req.body.name.trim();

  // Check for existing offers, excluding the current offer being updated
  const items = offerType === "category" ? categories : products;
  const existingOffer = await checkExistingOffers(
    offerType,
    items,
    startDate,
    endDate,
    req.params.offerId,
  );

  if (existingOffer) {
    throw new AppError(
      HttpStatus.CONFLICT,
      AdminOfferErrorMessages.ACTIVE_OFFER_EXISTS_DURING_PERIOD(offerType),
    );
  }

  // Remove old discounts
  await updateProductDiscounts(oldOffer, true);

  const updatedOffer = await offerModel.findByIdAndUpdate(
    req.params.offerId,
    {
      name,
      offerType,
      offerPercentage,
      startDate,
      endDate,
      applicableCategories: offerType === "category" ? categories : [],
      applicableProducts: offerType === "product" ? products : [],
    },
    { new: true },
  );

  // Apply new discounts
  await updateProductDiscounts(updatedOffer);
  res.json({ success: true, message: AdminOfferSuccessMessages.UPDATED });
});

// Toggle offer status
export const toggleOfferStatus = asyncHandler(async (req, res) => {
  const offer = await offerModel.findById(req.params.offerId);
  if (!offer) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      AdminOfferErrorMessages.OFFER_NOT_FOUND,
    );
  }

  //  check for conflicts when activating
  if (!offer.isActive) {
    const items =
      offer.offerType === "category"
        ? offer.applicableCategories
        : offer.applicableProducts;

    const existingOffer = await checkExistingOffers(
      offer.offerType,
      items,
      offer.startDate,
      offer.endDate,
      offer._id,
    );

    if (existingOffer) {
      throw new AppError(
        HttpStatus.CONFLICT,
        AdminOfferErrorMessages.ACTIVE_OFFER_CONFLICT_ON_ACTIVATE(
          offer.offerType,
        ),
      );
    }
  }

  offer.isActive = !offer.isActive;
  await offer.save();

  // Update product discounts
  if (!offer.isActive) {
    await updateProductDiscounts(offer, true);
  } else {
    await updateProductDiscounts(offer);
  }

  res.json({
    success: true,
    message: offer.isActive
      ? AdminOfferSuccessMessages.ACTIVATED
      : AdminOfferSuccessMessages.DEACTIVATED,
  });
});

// Delete offer
export const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await offerModel.findById(req.params.offerId).lean();
  if (!offer) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      AdminOfferErrorMessages.OFFER_NOT_FOUND,
    );
  }

  // Remove discounts before deleting
  await updateProductDiscounts(offer, true);
  await offer.deleteOne();

  res.json({ success: true, message: AdminOfferSuccessMessages.DELETED });
});

//  update referral settings
export const updateReferralSettings = asyncHandler(async (req, res) => {
  const error = validateReferralSettings(req.body);
  if (error) {
    throw new AppError(HttpStatus.BAD_REQUEST, error);
  }

  const { referrerValue, refereeValue } = req.body;

  let referralSettings = await referralModel.findOne();

  if (!referralSettings) {
    referralSettings = new referralModel({
      referrerValue,
      refereeValue,
    });
  } else {
    referralSettings.referrerValue = referrerValue;
    referralSettings.refereeValue = refereeValue;
  }

  await referralSettings.save();

  res.json({
    success: true,
    message: AdminOfferSuccessMessages.REFERRAL_SETTINGS_UPDATED,
  });
});
