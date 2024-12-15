import userSchema from "../../model/userModel.js";
import { log } from "mercedlogger";
import bcrypt from "bcryptjs";
import authUtils from "../../utils/authUtils.js";
import { config } from "dotenv";
import passport from "passport"; 
config();

// ---- User Login ----  
const loadLogin = (req, res) => {
    let message = req.query.message 
    let alertType = req.query.alertType
    let email = req.query.email
    res.render('user/login', {message, alertType, email});
};

// Verify user login 
const verifyLogin = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.trim()
        password = password.trim()
        const user = await userSchema.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email or password is incorrect. Please try again.'
            });
        }

        // Check if user's status is pending and delete if found
        if (user.status === "Pending") {
            await userSchema.deleteOne({ _id: user._id });
            return res.status(401).json({
                success: false,
                message: 'Your registration was incomplete. Please sign up again.'
            });
        }

        //check the user is active 
        if(user.status != "Active") {
            return res.status(401).json({
                success: false,
                message: 'Your account has been blocked. Please contact support.'
            });
        }
        
        // Check if the user used Google login
        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: 'This email is registered with Google. Please use Google login.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email or password is incorrect. Please try again.'
            });
        }

        // Store user information in the session upon successful login
        req.session.user = {
            id: user._id,
            fullname: user.fullname,
            email: user.email
        };

        res.json({
            success: true,
            message: 'Login successful'
        });
        
    } catch (error) {
        log.red("ERROR", error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

// ---- User Signup ----  
const loadSignup = (req, res) => {
    res.render('user/signup');
};

// Register a new user
const registerUser = async (req, res) => {
    try {
        let { fullname, phonenumber, email, password } = req.body;
        fullname = fullname.trim() 
        phonenumber = phonenumber.trim()
        email = email.trim()
        password = password.trim()
        const otp = authUtils.generateOTP();

        // Check if a user already exists with the given email or phone number
        const existingUser = await userSchema.findOne({
            $or: [
                { email },
                { phonenumber }
            ]
        });

        // If the user already exists, return an error message
        if (existingUser) {
            let message;
            if (existingUser.status === "Pending") {
                message = "You recently had a failed attempt. Please try again after some time.";
            } else if (!existingUser.password) {
                message = "This email is linked to a Google login. Please log in with Google.";
            } else {
                message = existingUser.email === email ? "Email already registered" : "Phone number already registered";
            }
            
            return res.render('user/signup', {
                message,
                alertType: "error",
                fullname,
                email,
                phonenumber
            });
        }

        // Hash the user's password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user document
        const newUser = new userSchema({
            fullname,
            phonenumber,
            email,
            password: hashedPassword,
            status: "Pending",
            createdAt: new Date(),
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
                log.red("Error deleting pending user:", error);
            }
        }, 3 * 60 * 1000);

        // Send OTP email to the user
        await authUtils.sendOTPEmail(email, otp);
        res.render('user/signupotp', {email});  // Render OTP verification page
    } catch (error) {
        log.red('ERROR', error);
        res.status(500).render('user/signup', { message: "Something went wrong", alertType: "error" });
    }
};

// Verify OTP entered by the user during signup
const verifyOTP = async (req, res) => {
    const { otp1, otp2, otp3, otp4, email, timeRem } = req.body;
    const userOTP = otp1 + otp2 + otp3 + otp4;

    try {
        const user = await userSchema.findOne({ email });
        const currentTime = Date.now();

        if (currentTime > user.otp.otpExpiresAt) {
            return res.render("user/signupotp", {
                email,
                message: "OTP has expired.",
                alertType: "error",
                timeRem: parseInt(timeRem),
            });
        }

        // Check if the OTP matches
        if (user.otp.otpValue === userOTP) {
            user.status = "Active";
            user.otp = undefined;
            await user.save();

            req.session.user = { fullname: user.fullname, email: user.email };

            // Redirect to home with success message
            res.redirect('/home');
        } else {
            // Check OTP attempts only when wrong OTP is entered
            if (user.otp.otpAttempts >= 3) {
                await userSchema.findOneAndDelete({ email });
                return res.render("user/signup", {
                    message: "You have exceeded the maximum OTP attempts. Please try again later.",
                    alertType: "error",
                });
            }

            user.otp.otpAttempts += 1;
            await user.save();

            res.render("user/signupotp", {
                email,
                message: "Invalid OTP, try again",
                alertType: "error",
                timeRemaining: timeRem,
            });
        }
    } catch (error) {
        log.red("ERROR", error);
        res.status(500).render("user/signupotp", {
            email,
            message: "Something went wrong",
            alertType: "error",
            timeRem: parseInt(timeRem),
        });
    }
};


// Resend OTP functionality
const resendOTP = async (req, res) => {
    console.log(req.body)
    let { email } = req.body; 
    email = email.trim()
    console.log("email: ", email)
    try {
        // Find the user by email
        const user = await userSchema.findOne({ email });
        console.log("user: ", user)
      
        if (user.otp.otpAttempts >= 3) {
            await userSchema.findOneAndDelete({ email });
            return res.render("user/signup", {
                message: "You have exceeded the maximum OTP attempts. Please try again later.",
                alertType: "error",
            });
        }

        // Generate a new OTP and update the user's document
        const otp = authUtils.generateOTP();
        user.otp.otpValue = otp;
        user.otp.otpExpiresAt = Date.now() + 60000;  
        user.otp.otpAttempts += 1;  
        await user.save();

        // Send the new OTP email to the user
        await authUtils.sendOTPEmail(email, otp);

        res.render("user/signupotp", {
            email,
            message: "OTP sent to your email.",
            alertType: "success",
        });

    } catch (error) {
        log.red("ERROR", error);
        res.status(500).render("user/signupotp", {
            email,
            message: "Something went wrong while resending OTP. Please try again.",
            alertType: "error",
        });
    }
}; 


// ---- Google OAuth ----
// Redirect the user to Google for authentication
const authGoogle = (req, res) => {
    passport.authenticate("google", {
        scope: ["email", "profile"],
    })(req, res);
};

// Callback for Google OAuth, handle success or failure
const authGoogleCallback = (req, res) => {
    passport.authenticate("google", { failureRedirect: "/login" }, (err, user, info) => {
        if (err) {
            return res.redirect("/login?message=Something+went+wrong&alertType=error");
        }
        
        if (!user) {
            // Handle blocked user case
            return res.redirect("/login?message=Your+account+is+currently+blocked&alertType=error");
        }

        req.session.user = {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
        };

        res.redirect('/home');
    })(req, res);
};


// ---- user logout --- 

const logoutUser = (req,res)=>{

      try{
        delete req.session.user 
        res.render('user/login',{message:"Logged out successfully", alertType:"success"});
        
      }catch(error){
        log.red('Error destroying session', err);
        return res.status(500).send('Unable to log out');

      }

}



// ---- forgot password ---- 
const loadForgotpassword = (req, res) => {
    let message = req.query.message;
    let alertType = req.query.alertType;
    let email = req.query.email;
    res.render('user/forgotpassword', { message, alertType, email });
};
const loadResetpassword = (req, res) => {
    let email = req.query.email;
    res.render('user/resetpassword', { email });
};

const processForgotPassword = async (req, res) => {
    try {
        let { email } = req.body;
        email = email.trim();
        const user = await userSchema.findOne({ email });

        if (!user) {
            return res.render('user/forgotpassword', {
                message: "Email not found",
                alertType: "error",
                email
            });
        }

        // Check if user is a Google auth user
        if (!user.password) {
            return res.redirect('/login?message=Google+accounts+cannot+reset+password.+Please+login+with+Google&alertType=error');
        }

        const otp = authUtils.generateOTP();

        // Update user with new OTP details
        user.otp = {
            otpValue: otp,
            otpExpiresAt: Date.now() + 60000, // 1 minute
            otpAttempts: 0,
        };
        await user.save();

        // Send OTP email
        await authUtils.sendOTPEmail(email, otp);
        res.render('user/forgotpasswordotp', { email });

    } catch (error) {
        log.red('ERROR', error);
        res.render('user/forgotpassword', {
            message: "Something went wrong",
            alertType: "error",
            email: req.body.email
        });
    }
};

const verifyForgotPasswordOTP = async (req, res) => {
    const { otp1, otp2, otp3, otp4, email, timeRem } = req.body;
    const userOTP = otp1 + otp2 + otp3 + otp4;

    try {
        const user = await userSchema.findOne({ email });
        const currentTime = Date.now();

        if (currentTime > user.otp.otpExpiresAt) {
            return res.render("user/forgotpasswordotp", {
                email,
                message: "OTP has expired",
                alertType: "error",
                timeRemaining: 0,
            });
        }

        if (user.otp.otpValue === userOTP) {
            user.otp = undefined;
            await user.save();
            res.redirect(`/reset-password?email=${email}`);
        } else {
            if (user.otp.otpAttempts >= 3) {
                user.otp = undefined;
                await user.save();
                return res.render("user/forgotpassword", {
                    message: "Too many attempts. Please try again.",
                    alertType: "error",
                });
            }

            user.otp.otpAttempts += 1;
            await user.save();

            const remainingTime = Math.max(0, Math.floor((user.otp.otpExpiresAt - currentTime) / 1000));

            res.render("user/forgotpasswordotp", {
                email,
                message: "Invalid OTP",
                alertType: "error",
                timeRemaining: remainingTime,
            });
        }
    } catch (error) {
        log.red("ERROR", error);
        res.render("user/forgotpasswordotp", {
            email,
            message: "Something went wrong",
            alertType: "error",
            timeRemaining: parseInt(timeRem),
        });
    }
};

const resendForgotPasswordOTP = async (req, res) => {
    let { email } = req.body;
    email = email.trim();

    try {
        const user = await userSchema.findOne({ email });
        
        if (user.otp?.otpAttempts >= 3) {
            user.otp = undefined;
            await user.save();
            return res.render("user/forgotpassword", {
                message: "Too many attempts. Please try again later.",
                alertType: "error",
            });
        }

        const otp = authUtils.generateOTP();
        user.otp = {
            otpValue: otp,
            otpExpiresAt: Date.now() + 60000,
            otpAttempts: user.otp ? user.otp.otpAttempts + 1 : 1,
        };
        await user.save();

        await authUtils.sendOTPEmail(email, otp);

        res.render("user/forgotpasswordotp", {
            email,
            message: "New OTP sent",
            alertType: "success",
        });

    } catch (error) {
        log.red("ERROR", error);
        res.render("user/forgotpasswordotp", {
            email,
            message: "Failed to resend OTP",
            alertType: "error",
        });
    }
};

const resetPassword = async (req, res) => {
    let { email, password } = req.body;
    email = email.trim();
    try {
        const user = await userSchema.findOne({ email });
        console.log("user: ", user)
        if (!user) {
            return res.render('user/resetpassword', {
                message: "Invalid reset attempt",
                alertType: "error",
                email
            });
            
        }


        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        res.redirect('/login?message=Password+reset+successful&alertType=success');
    } catch (error) {
        log.red("ERROR", error);
        res.render('user/resetpassword', {
            message: "Failed to reset password",
            alertType: "error",
        });
    }
};


const getDashboard = (req, res)=>{
    try{
        
    }catch(error){
        log.red("FETCH_DASHBOARD_ERROR", error)
    }
}
const getAccountDetails = async (req,res)=>{
    try{
        let email = req.session.user.email
        let user = await userSchema.findOne({email})
        res.render('user/account', {user, page:"account"})
    }catch(error){
        log.red("FETCH_ACCOUNT_DETAILS_ERROR", error)
    }
}


const getWishlist = (req,res)=>{
    try{

    }catch(error){
        log.red("FETCH_WISHLIST_ERROR", error)
    }
}
const getOrders = (req,res)=>{
    try{

    }catch(error){
        log.red("FETCH_ORDERS_ERROR", error)
    }
}
const getWallet = (req,res)=>{
    try{

    }catch(error){
        log.red("FETCH_WALLET_ERROR", error)
    }
}




export default {
    loadLogin, verifyLogin,
    loadSignup, verifyOTP, resendOTP,
    loadForgotpassword, processForgotPassword, verifyForgotPasswordOTP,
    resendForgotPasswordOTP, resetPassword, loadResetpassword,
     registerUser, authGoogle, authGoogleCallback,
    logoutUser, getDashboard, getAccountDetails, getWishlist, getOrders, getWallet,
}


