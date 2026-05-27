import { UserModel } from "../../model/userModel.js";
import bcrypt from 'bcryptjs';
import referralCodeUtils from '../../utils/referralCode.js';
import { referralModel } from "../../model/referralModel.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { AppError } from "../../utils/appError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthErrorMessages } from "../../constants/errorMessages.js";
import { SuccessMessage } from "../../constants/successMessage.js";


export const getAccountDetails = async (req, res) => {
  let email = req.session.user.email;
  let user = await UserModel.findOne({ email });

  // Generate referral code 
  if (!user.referralCode) {
    user.referralCode = referralCodeUtils.generateReferralCode();
    await user.save();
  }

  // Fetch referral values
  const referralValues = await referralModel.findOne({}) || {
    referrerValue: 100,
    refereeValue: 50
  };

  res.render('user/profile/account', {
    user,
    page: "account",
    referralValues
  });
};

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullname } = req.body;
  const userId = req.session.user.id;
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { fullname },
    { new: true }
  );
  if (!updatedUser) {
    throw new AppError(HttpStatus.NOT_FOUND, AuthErrorMessages.USER_NOT_FOUND);
  }

  res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.PROFILE_UPDATED,
    user: updatedUser
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.user.id;

  // Get user from database
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, AuthErrorMessages.USER_NOT_FOUND);
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError(HttpStatus.BAD_REQUEST, AuthErrorMessages.CURRENT_PASSWORD_INCORRECT);
  }

  // Check if new password is same as current password
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new AppError(HttpStatus.BAD_REQUEST, AuthErrorMessages.NEW_PASSWORD_SAME_AS_CURRENT);
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password
  user.password = hashedPassword;
  await user.save();

  res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.PASSWORD_UPDATED
  });
});
