import bcrypt from "bcryptjs";
import referralCodeUtils from "../../utils/referralCode.js";
import { UserModel } from "../../model/userModel.js";
import { referralModel } from "../../model/referralModel.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { AppError } from "../../utils/appError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthErrorMessages, UserProfileErrorMessages } from "../../constants/errorMessages.js";
import { SuccessMessage } from "../../constants/successMessage.js";
import { USER_VIEW_PATHS } from "../../constants/viewPaths.js";
import {
  getSessionUserId,
  getUserFromSession,
  mapUserResponse,
} from "../../utils/controllerHelpers.js";

export const renderUserAccountPage = asyncHandler(async (req, res) => {
  const user = await getUserFromSession(req);

  // Generate referral code
  if (!user.referralCode) {
    user.referralCode = referralCodeUtils.generateReferralCode();
    await user.save();
  }

  // Fetch referral values
  const referralValues = (await referralModel.findOne({})) || {
    referrerValue: 100,
    refereeValue: 50,
  };

  res.render(USER_VIEW_PATHS.ProfileAccount, {
    user,
    page: "account",
    referralValues,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  let { fullname } = req.body;
  fullname = fullname.trim()
  if(!fullname) throw new AppError(HttpStatus.BAD_REQUEST, UserProfileErrorMessages.INVALID_PROFILE_DATA)
  let updatedUser = null;
  if(fullname){
    const userId = getSessionUserId(req);
    updatedUser = await UserModel.findByIdAndUpdate(

      userId,
      { fullname },
      { new: true },
    );
    if (!updatedUser) {
      throw new AppError(HttpStatus.NOT_FOUND, AuthErrorMessages.USER_NOT_FOUND);
    }

    // Update session
    req.session.user.fullname = updatedUser.fullname;
  }


  res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.PROFILE_UPDATED,
    user: mapUserResponse(updatedUser),
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = getSessionUserId(req);

  // Get user from database
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, AuthErrorMessages.USER_NOT_FOUND);
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      AuthErrorMessages.CURRENT_PASSWORD_INCORRECT,
    );
  }

  // Check if new password is same as current password
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      AuthErrorMessages.NEW_PASSWORD_SAME_AS_CURRENT,
    );
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password
  user.password = hashedPassword;
  await user.save();

  res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.PASSWORD_UPDATED,
  });
});
