import userSchema from "../../model/userModel.js";
import bcrypt from "bcryptjs";
import cryptoUtils from "../../services/crypto.js";
import passport from "passport";
import referralSchema from "../../model/referralModel.js";
import walletSchema from "../../model/walletModel.js";
import referralUtils from "../../utils/referralCode.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { validateLogin, validateRegister, validateResetPassword } from "../../validators/auth.validator.js";
import { AppError } from "../../utils/appError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthErrorMessages, ErrorMessages } from "../../constants/errorMessages.js";
import { SuccessMessage } from "../../constants/successMessage.js";
import { WalletTransactionDescriptions } from "../../constants/walletTransactionDescriptions.js";
import { sendOTPEmail } from "../../services/mail.js";
import logger from "../../utils/logger.js";

// ---- User Login ----  
export const loadLogin = (req, res) => {
  const { message, alertType } = req.query;
  res.render('user/auth/login', { message, alertType });
};

// Verify user login 
export const verifyLogin = asyncHandler(async (req, res) => {
  let { email, password } = req.body;

  const error = validateLogin({
    email,
    password
  });

  if (error) throw new AppError(HttpStatus.BAD_REQUEST, error);

  const user = await userSchema.findOne({ email });

  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, AuthErrorMessages.INVALID_EMAIL_OR_PASSWORD);
  }

  // Check if user's status is pending and delete if found
  if (user.status === "Pending") {
    await userSchema.deleteOne({ _id: user._id });
    throw new AppError(HttpStatus.UNAUTHORIZED, AuthErrorMessages.INCOMPLETE_REGISTRATION);
  }

  //check the user is active 
  if (user.status != "Active") throw new AppError(HttpStatus.UNAUTHORIZED, AuthErrorMessages.ACCOUNT_BLOCKED);


  // Check if the user used Google login
  if (!user.password) {
    throw new AppError(HttpStatus.UNAUTHORIZED, AuthErrorMessages.REGISTERED_WITH_GOOGLE);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError(HttpStatus.UNAUTHORIZED, AuthErrorMessages.INVALID_EMAIL_OR_PASSWORD);
  }

  req.session.user = {
    id: user._id,
    fullname: user.fullname,
    email: user.email
  };

  res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.LOGIN_SUCCESS
  });

});

// ---- User Signup ----  
export const loadSignup = (_req, res) => {
  res.render('user/auth/signup');
};

// Register a new user
export const registerUser = asyncHandler(async (req, res) => {
  let { fullname, phonenumber, email, password } = req.body;

  const error = validateRegister({
    fullname,
    phonenumber,
    email,
    password,
  });

  if (error) {
    throw new AppError(HttpStatus.BAD_REQUEST, error);
  }

  const otp = cryptoUtils.generateOTP();

  // Check if a user already exists with the given email or phone number
  const existingUser = await userSchema.findOne({
    $or: [
      { email },
      { phonenumber }
    ]
  });

  // If the user already exists, return an error message
  if (existingUser && existingUser.status == "Pending") {
    await userSchema.findOneAndDelete({ email });

  } else if (existingUser) {
    let message;
    if (!existingUser.password) {
      message = AuthErrorMessages.REGISTERED_WITH_GOOGLE;
    } else {
      message = existingUser.email === email ? AuthErrorMessages.EMAIL_ALREADY_REGISTERED : AuthErrorMessages.PHONE_NUMBER_ALREADY_REGISTERED;
    }
    throw new AppError(HttpStatus.CONFLICT, message);
  }

  // Hash the password 
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate a unique referral code
  let referralCode;
  let isUnique = false;
  while (!isUnique) {
    referralCode = referralUtils.generateReferralCode();
    const existingUserWithCode = await userSchema.findOne({ referralCode });
    if (!existingUserWithCode) {
      isUnique = true;
    }
  }

  // Create a new user document
  const newUser = new userSchema({
    fullname,
    phonenumber,
    email,
    password: hashedPassword,
    status: "Pending",
    createdAt: new Date(),
    referralCode,
    otp: {
      otpValue: otp,
      otpExpiresAt: Date.now() + 60000,
      otpAttempts: 0,
    },
  });
  // Save the new user to the database
  await newUser.save();

  setTimeout(async () => {
    try {
      await userSchema.deleteOne({
        email,
        status: "Pending",
        createdAt: { $lt: new Date(Date.now() - 3 * 60 * 1000) }
      });
    } catch (error) {
      logger.error("Error deleting pending user:", error);
    }
  }, 3 * 60 * 1000);

  // Send OTP email to the user
  await sendOTPEmail(email, otp);

  return res.status(HttpStatus.OK).json({
    success: true,
    email: email
  });

});

// Verify OTP entered by the user 
export const verifyOTP = asyncHandler(async (req, res) => {
  const { otp1, otp2, otp3, otp4, email } = req.body;
  const userOTP = otp1 + otp2 + otp3 + otp4;
  const user = await userSchema.findOne({ email });
  const currentTime = Date.now();

  if (currentTime > user.otp.otpExpiresAt) {
    throw new AppError(HttpStatus.BAD_REQUEST, AuthErrorMessages.OTP_EXPIRED);
  }

  if (user.otp.otpValue === userOTP) {
    user.status = "Active";
    user.otp = undefined;
    await user.save();

    req.session.user = { id: user._id, fullname: user.fullname, email: user.email };

    return res.status(HttpStatus.OK).json({
      success: true,
      message: SuccessMessage.OTP_VERIFIED_SUCCESS
    });
  } else {
    if (user.otp.otpAttempts >= 4) {
      await userSchema.findOneAndDelete({ email });
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: AuthErrorMessages.OTP_ATTEMPTS_EXCEEDED,
        maxAttemptsExceeded: true
      });
    }

    user.otp.otpAttempts += 1;
    await user.save();

    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: AuthErrorMessages.OTP_INVALID
    });
  }

});


// Resend OTP 
export const resendOTP = asyncHandler(async (req, res) => {
  let { email } = req.body;
  email = email.trim();

  const user = await userSchema.findOne({ email });

  if (user.otp.otpAttempts >= 3) {
    await userSchema.findOneAndDelete({ email });
    return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
      success: false,
      message: ErrorMessages.TOO_MANY_ATTEMPTS,
      maxAttemptsExceeded: true
    });

  }

  const otp = cryptoUtils.generateOTP();

  user.otp.otpValue = otp;
  user.otp.otpExpiresAt = Date.now() + 60000;
  user.otp.otpAttempts += 1;
  await user.save();

  await sendOTPEmail(email, otp);

  return res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.OTP_SENT_SUCCESS
  });

});


// ---- Google OAuth ----
// Redirect the user to Google for authentication
export const authGoogle = (req, res) => {
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })(req, res);
};

// Callback for Google OAuth, handle success or failure
export const authGoogleCallback = (req, res) => {
  passport.authenticate("google", { failureRedirect: "/login" }, (err, user, info) => {
    if (err) {
      logger.error("Google Auth Callback Error:", err);
      return res.redirect("/login?message=Something+went+wrong&alertType=error");
    }

    if (!user) {
      const message = info?.message || "Authentication failed";
      return res.redirect(`/login?message=${message}&alertType=error`);
    }

    req.logIn(user, (err) => {
      if (err) {
        logger.error("Session Error:", err);
        return res.redirect("/login?message=Session+error&alertType=error");
      }

      req.session.user = {
        id: user.id,
        fullname: user.fullname,
        email: user.email
      };

      req.session.save((err) => {
        if (err) {
          logger.error("Session Save Error:", err);
          return res.redirect("/login?message=Session+save+error&alertType=error");
        }
        res.redirect('/home');
      });
    });
  })(req, res);
};


// ---- user logout --- 

export const logoutUser = (req, res) => {

  try {
    delete req.session.user;
    res.render('user/auth/login', { message: SuccessMessage.LOGGED_OUT_SUCCESS, alertType: "success" });

  } catch (error) {
    logger.error('Error destroying session', error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Unable to log out');
  }
};



// ---- forgot password ---- 
export const loadForgotpassword = (req, res) => {
  const { message, alertType, email } = req.query;
  res.render('user/auth/forgotpassword', { message, alertType, email });
};


export const processForgotPassword = asyncHandler(async (req, res) => {
  let { email } = req.body;
  email = email.trim();
  const user = await userSchema.findOne({ email });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, AuthErrorMessages.INVALID_EMAIL_OR_PASSWORD);
  }

  if (!user.password) {
    throw new AppError(HttpStatus.BAD_REQUEST, AuthErrorMessages.REGISTERED_WITH_GOOGLE);
  }

  const otp = cryptoUtils.generateOTP();

  user.otp = {
    otpValue: otp,
    otpExpiresAt: Date.now() + 60000, // 1 minute expiry
    otpAttempts: 0,
  };
  await user.save();

  await sendOTPEmail(email, otp);

  return res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.OTP_SENT_SUCCESS
  });

});

export const verifyForgotPasswordOTP = asyncHandler(async (req, res) => {
  const { otp1, otp2, otp3, otp4, email } = req.body;
  const userOTP = otp1 + otp2 + otp3 + otp4;

  const user = await userSchema.findOne({ email });
  const currentTime = Date.now();

  if (!user) {
    throw new AppError(HttpStatus.CONFLICT, ErrorMessages.INVALID_INPUT);
  }

  if (currentTime > user?.otp?.otpExpiresAt) {
    throw new AppError(HttpStatus.CONFLICT, AuthErrorMessages.OTP_EXPIRED);
  }

  if (user.otp.otpValue === userOTP) {
    user.otp = undefined;
    await user.save();

    return res.status(HttpStatus.OK).json({
      success: true,
      message: SuccessMessage.OTP_VERIFIED_SUCCESS
    });
  } else {
    if (user.otp.otpAttempts >= 3) {
      user.otp = undefined;
      await user.save();
      return res.status(HttpStatus.CONFLICT).json({
        success: false,
        message: ErrorMessages.TOO_MANY_ATTEMPTS,
        maxAttemptsExceeded: true
      });
    }

    user.otp.otpAttempts += 1;
    await user.save();

    return res.status(HttpStatus.CONFLICT).json({
      success: false,
      message: "Invalid OTP, please try again"
    });
  }
});

export const resendForgotPasswordOTP = asyncHandler(async (req, res) => {
  let { email } = req.body;
  email = email.trim();

  const user = await userSchema.findOne({ email });

  if (user.otp?.otpAttempts >= 3) {
    user.otp = undefined;
    await user.save();
    return res.render("user/auth/forgotpassword", {
      message: ErrorMessages.TOO_MANY_ATTEMPTS,
      alertType: "error",
    });
  }

  const otp = cryptoUtils.generateOTP();
  user.otp = {
    otpValue: otp,
    otpExpiresAt: Date.now() + 60000,
    otpAttempts: user.otp ? user.otp.otpAttempts + 1 : 1,
  };
  await user.save();

  await sendOTPEmail(email, otp);


  res.render("user/auth/forgotpasswordotp", {
    email,
    message: SuccessMessage.OTP_SENT_SUCCESS,
    alertType: "success",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  let { email, password} = req.body;

  const error = validateResetPassword(req.body);
  if (error) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: error
    });
  }

  const user = await userSchema.findOne({ email });

  if (!user) {
    return res.status(HttpStatus.CONFLICT).json({
      success: false,
      message: AuthErrorMessages.INVALID_EMAIL
    });
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  await user.save();

  return res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.PASSWORD_RESET_SUCCESS
  });
});

export const applyReferral = asyncHandler(async (req, res) => {
  const { referralCode } = req.body;
  const currentUser = await userSchema.findById(req.session.user.id);
  // Find referrer
  const referrer = await userSchema.findOne({ referralCode });

  if (!referrer) {
    throw new AppError(HttpStatus.CONFLICT, AuthErrorMessages.INVALID_REFERRAL_CODE);
  }

  if (referrer._id.toString() === currentUser._id.toString()) {
    throw new AppError(HttpStatus.CONFLICT, AuthErrorMessages.YOU_CANNOT_USE_YOUR_OWN_REFERRAL_CODE);

  }

  // Get referral values
  const referralValues = await referralSchema.findOne({});
  const referrerAmount = referralValues.referrerValue;
  const refereeAmount = referralValues.refereeValue;

  // Handle referrer's wallet
  let referrerWallet = await walletSchema.findOne({ userId: referrer._id });
  if (!referrerWallet) {
    referrerWallet = new walletSchema({
      userId: referrer._id,
      balance: 0
    });
  }

  referrerWallet.balance += referrerAmount;
  referrerWallet.transactions.push({
    transactionId: `REF${Date.now()}`,
    type: "CREDIT",
    amount: referrerAmount,
    description: WalletTransactionDescriptions.REFERRAL(currentUser.fullname)
  });
  await referrerWallet.save();

  // Handle current user's wallet
  let userWallet = await walletSchema.findOne({ userId: currentUser._id });
  if (!userWallet) {
    userWallet = new walletSchema({
      userId: currentUser._id,
      balance: 0
    });
  }

  userWallet.balance += refereeAmount;
  userWallet.transactions.push({
    transactionId: `REF${Date.now()}`,
    type: "CREDIT",
    amount: refereeAmount,
    description: WalletTransactionDescriptions.REFERRAL(referrer.fullname)
  });
  await userWallet.save();

  return res.status(HttpStatus.OK).json({
    success: true,
    message: SuccessMessage.REFERRAL_CODE_APPLIED_SUCCESS
  });

});
