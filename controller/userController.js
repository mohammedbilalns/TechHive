import userSchema from "../model/userModel.js";
import { log } from "mercedlogger";
import bcrypt from "bcryptjs";
import authUtils from "../utils/authUtils.js";
import { config } from "dotenv";
import passport from "passport";

// Configure environment variables
config();

// ---- User Login ----  
const loadLogin = (req, res) => {
    res.render('user/login');
};

// Verify user login credentials
const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists with the given email
        const user = await userSchema.findOne({ email });

        // If no user is found, show an error message
        if (!user) return res.render('user/login', { message: "Invalid credentials", alertType: "error" });

        // Check if the user used Google login
        if (!user.password) return res.render('user/login', { message: "Please use Google login", alertType: "error" });

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.render("user/login", { message: "Invalid credentials", alertType: "error", email: email });

        // Store user information in the session upon successful login
        req.session.user = {
            id: user._id,
            fullname: user.fullname,
            email: user.email
        };

        // Redirect to the home page after successful login
        res.render('user/home');
    } catch (error) {
        log.red("ERROR", error);
        res.render('user/login', { message: "Something went wrong", alertType: "error" });
    }
};

// ---- User Signup ----  
const loadSignup = (req, res) => {
    res.render('user/signup');
};

// Register a new user
const registerUser = async (req, res) => {
    try {
        const { fullname, phonenumber, email, password } = req.body;
        const otp = authUtils.generateOTP();  // Generate OTP for email verification

        // Check if a user already exists with the given email or phone number
        const existingUser = await userSchema.findOne({
            $or: [
                { email },
                { phonenumber }
            ]
        });

        // If the user already exists, return an error message
        if (existingUser) {
            let message = existingUser.email === email ? "Email already registered" : "Phone number already registered";
            if (!existingUser.password) {
                message = "This email is linked to a Google login. Please log in with Google.";
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
            status: "pending",  // Set initial status as "pending"
        });

        // Save the new user to the database
        await newUser.save();

        // Store OTP and its expiry in the session
        req.session.userOTP = {
            otp,
            fullname,
            email,
            expiryTime: Date.now() + 60000, // OTP expiry time set to 1 minute from now
            userId: newUser._id
        };

        // Send OTP email to the user
        await authUtils.sendOTPEmail(email, otp);
        res.render('user/signupotp');  // Render OTP verification page
    } catch (error) {
        log.red('ERROR', error);
        res.render('user/signup', { message: "Something went wrong", alertType: "error" });
    }
};

// Verify OTP entered by the user during signup
const verifyOTP = async (req, res) => {
    let { otp1, otp2, otp3, otp4, timeRem } = req.body;

    // Combine OTP digits into a single string
    let userOTP = otp1 + otp2 + otp3 + otp4; 

    const currentTime = Date.now();
    if (currentTime > req.session.userOTP.expiryTime) {
        // OTP expired
        req.session.userOTP.otp = undefined;  // Clear expired OTP session
        req.session.userOTP.expiryTime = 0 
        return res.render('user/signupotp', { message: "OTP has expired.", alertType: "error", timeRem: parseInt(timeRem) });
    }

    // Check if the OTP matches the session OTP and if the OTP is still valid
    if (userOTP === req.session.userOTP.otp) {
        const { fullname, email, userId } = req.session.userOTP;

        // Update user status to "active" after successful OTP verification
        await userSchema.findByIdAndUpdate(userId, { status: "active" });

        // Store user information in session
        req.session.user = { fullname, email };

        // Clear OTP data from session after use
        req.session.userOTP = undefined;

        // Redirect to home page after successful verification
        res.render("user/home");
    } else {
        // If OTP is incorrect, show an error message and allow retry
        res.render('user/signupotp', { message: "Invalid OTP, try again", alertType: "error", timeRem: parseInt(timeRem) });
    }
};

// Resend OTP functionality 
const resendOTP = async (req, res) => {
    
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
        if (err || !user) {
            return res.redirect("/login");  // Redirect to login page in case of failure
        }

        // Store user information in session after successful Google login
        req.session.user = {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
        };

        // Redirect to home page after successful login
        return res.redirect("/home");
    })(req, res);
};






// ---- forgot password ---- todo 
const loadForgotpassword = (req,res)=>{
    res.render('user/forgotpassword')
}
const loadResetpassword = (req, res)=>{
    res.render('user/resetpassword')
}
const loadResetpasswordotp = (req, res)=>{
    res.render('user/forgotpasswordotp')
}
// ---- load home ---- homepage 
const loadHome = (req, res)=>{
    res.render('user/home')
}



export default {loadLogin, verifyLogin, loadSignup,verifyOTP , resendOTP,  loadForgotpassword, loadResetpassword, loadResetpasswordotp, loadHome, registerUser,authGoogle, authGoogleCallback}
