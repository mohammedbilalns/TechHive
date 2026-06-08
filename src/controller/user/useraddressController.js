import { addressModel } from "../../model/addressModel.js";
import mongoose from "mongoose";
import { validateAddAddress } from "../../validators/address.validator.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { AppError } from "../../utils/appError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  ErrorMessages,
  UserAddressErrorMessages,
} from "../../constants/errorMessages.js";
import { SuccessMessage } from "../../constants/successMessage.js";
import { USER_VIEW_PATHS } from "../../constants/viewPaths.js";
import {
  getSessionUserId,
  getUserFromSession,
} from "../../utils/controllerHelpers.js";

// get all addresses of a user
export const renderUserAddressesPage = asyncHandler(async (req, res) => {
  const user = await getUserFromSession(req);

  let addresses = await addressModel.find({ userId: user._id }).lean();
  res.render(USER_VIEW_PATHS.ProfileAddresses, {
    addresses,
    user,
    page: "addresses",
  });
});

// Add a new address
export const addAddress = asyncHandler(async (req, res) => {
  const userId = getSessionUserId(req);
  const addressCount = await addressModel.countDocuments({ userId });
  if (addressCount >= 4) {
    throw new AppError(HttpStatus.BAD_REQUEST, ErrorMessages.MAX_ADDRESS_LIMIT);
  }

  const {
    state,
    pincode,
    phone,
    alternatePhone,
    name,
    houseName,
    localityStreet,
    city,
  } = req.body;

  const error = validateAddAddress({
    name,
    houseName,
    localityStreet,
    city,
    state,
    pincode,
    phone,
  });

  if (error) {
    throw new AppError(HttpStatus.BAD_REQUEST, error);
  }

  const newAddress = new addressModel({
    userId,
    name,
    houseName,
    localityStreet,
    city,
    state,
    pincode,
    phone,
    alternatePhone,
  });

  const savedAddress = await newAddress.save();

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: SuccessMessage.ADDRESS_ADDED,
    address: savedAddress,
  });
});

// Update an address
export const updateAddress = asyncHandler(async (req, res) => {
  const {
    name,
    houseName,
    localityStreet,
    city,
    state,
    pincode,
    phone,
    alternatePhone,
  } = req.body;

  const error = validateAddAddress({
    name,
    houseName,
    localityStreet,
    city,
    state,
    pincode,
    phone,
  });

  if (error) {
    throw new AppError(HttpStatus.BAD_REQUEST, error);
  }

  const address = await addressModel.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: getSessionUserId(req),
    },
    {
      name,
      houseName,
      localityStreet,
      city,
      state,
      pincode,
      phone,
      alternatePhone,
    },
    { new: true },
  ).lean();

  if (!address) {
    throw new AppError(HttpStatus.NOT_FOUND, ErrorMessages.ADDRESS_NOT_FOUND);
  }

  res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.ADDRESS_UPDATED,
    address,
  });
});

// Delete an address
export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await addressModel.findOneAndDelete({
    _id: req.params.id,
    userId: getSessionUserId(req),
  }).lean();

  if (!address) {
    throw new AppError(HttpStatus.NOT_FOUND, ErrorMessages.ADDRESS_NOT_FOUND);
  }

  res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.ADDRESS_DELETED,
  });
});

// get a single address
export const getAddress = asyncHandler(async (req, res) => {
  const addressId = req.params.id;
  const userId = getSessionUserId(req);

  // Validate if addressId is a valid  ObjectId
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    return res.redirect(
      `/notfound?message=${encodeURIComponent(UserAddressErrorMessages.INVALID_ADDRESS_ID)}&alertType=error`,
    );
  }

  const address = await addressModel.findOne({
    _id: addressId,
    userId: userId,
  }).lean();

  if (!address) {
    throw new AppError(HttpStatus.NOT_FOUND, ErrorMessages.ADDRESS_NOT_FOUND);
  }

  res.status(HttpStatus.OK).json({
    success: true,
    address,
  });
});
