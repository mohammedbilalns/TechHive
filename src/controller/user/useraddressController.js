import userSchema from "../../model/userModel.js";
import { log } from "mercedlogger";
import addressSchema from "../../model/addressModel.js";
import mongoose from 'mongoose';
import { validateAddAddress } from "../../validators/address.validator.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { AppError } from "../../utils/appError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ErrorMessages } from "../../constants/errorMessages.js";
import { SuccessMessage } from "../../constants/successMessage.js";

// get all addresses of a user
export const getAddresses = async (req, res) => {
  try {
    let email = req.session.user.email;
    let user = await userSchema.findOne({ email });

    let addresses = await addressSchema.find({ userId: user._id });
    res.render('user/profile/addresses', { addresses, user, page: "addresses" });
  } catch (error) {
    log.red("FETCH_ADDRESSES_ERROR", error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).render("notfound");
  }
};

// Add a new address
export const addAddress = asyncHandler(async (req, res) => {
  const addressCount = await addressSchema.countDocuments({ userId: req.session.user.id });
  if (addressCount >= 4) {
    throw new AppError(HttpStatus.BAD_REQUEST, ErrorMessages.MAX_ADDRESS_LIMIT);
  }

  const { state, pincode, phone, alternatePhone, name, houseName, localityStreet, city } = req.body;

  const error = validateAddAddress({
    name,
    houseName,
    localityStreet,
    city,
    state,
    pincode,
    phone
  });

  if (error) {
    throw new AppError(HttpStatus.BAD_REQUEST, error);
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

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: SuccessMessage.ADDRESS_ADDED,
    address: savedAddress
  });
});

// Update an address
export const updateAddress = asyncHandler(async (req, res) => {
  const { name, houseName, localityStreet, city, state, pincode, phone, alternatePhone } = req.body;

  const error = validateAddAddress({
    name,
    houseName,
    localityStreet,
    city,
    state,
    pincode,
    phone,
  })

  if (error) {
    throw new AppError(HttpStatus.BAD_REQUEST, error);
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
    throw new AppError(HttpStatus.NOT_FOUND, ErrorMessages.ADDRESS_NOT_FOUND);
  }

  res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.ADDRESS_UPDATED,
    address
  });
});

// Delete an address
export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await addressSchema.findOneAndDelete({
    _id: req.params.id,
    userId: req.session.user.id
  });

  if (!address) {
    throw new AppError(HttpStatus.NOT_FOUND, ErrorMessages.ADDRESS_NOT_FOUND);
  }

  res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.ADDRESS_DELETED
  });
});

// get a single address
export const getAddress = asyncHandler(async (req, res) => {
  const addressId = req.params.id;
  const userId = req.session.user.id;

  // Validate if addressId is a valid  ObjectId
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.redirect("/notfound?message=Invalid+Address+Id&alertType=error");
  }

  const address = await addressSchema.findOne({
    _id: addressId,
    userId: userId
  });

  if (!address) {
    throw new AppError(HttpStatus.NOT_FOUND, ErrorMessages.ADDRESS_NOT_FOUND);
  }

  res.status(HttpStatus.OK).json({
    success: true,
    address
  });
});
