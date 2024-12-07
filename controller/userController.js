import userSchema from "../model/userModel.js";
import { log } from "mercedlogger";
import bcrypt from "bcryptjs";
import authUtils from "../utils/authUtils.js";
import { config } from "dotenv";
import passport from "passport";


config();

// ---- User Login ----  
const loadLogin = (req, res) => {
    let message = req.query.message 
    let alertType = req.query.alertType
    let email = req.query.email
    console.log(message, alertType, email)
    res.render('user/login', {message, alertType, email});
};

// Verify user login credentials
const verifyLogin = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.trim()
        password = password.trim()
        const user = await userSchema.findOne({ email });

        // If no user is found, show an error message
        if (!user) return res.redirect('/login?message=Invalid+credentials&alertType=error');

        //check the user is active 
        if(user.status!= "Active") return res.redirect(`/login?message=Your+account+is+currently+blocked&alertType=error&email=${email}` )
        // Check if the user used Google login
        if (!user.password) return res.redirect(`/login?message=Please+use+Google+login&alertType=success&email=${email}`);

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.redirect(`/login?message=Invalid+credentials&alertType=error&email=${email}`);

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
        res.redirect('/login?message=Something+went+wrong&alertType=error');
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
        email= email.trim()
        password = password.trim()
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
            status: "Pending", // Set initial status as "pending"
            otp: {
                otpValue: otp,
                otpExpiresAt: Date.now() + 60000, // OTP expiry set to 1 minute
                otpAttempts: 0,
            },
        });


        // Save the new user to the database
        await newUser.save();


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
    // Combine OTP digits into a single string
    const userOTP = otp1 + otp2 + otp3 + otp4;

    try {
        // Find the user by email
        const user = await userSchema.findOne({ email });

      if (user.otp.otpAttempts > 3) {
            await userSchema.findOneAndDelete({ email });
            return res.render("user/signup", {
                message: "You have exceeded the maximum OTP attempts. Please try again later.",
                alertType: "error",
            });
        }
        const currentTime = Date.now();

        // Check if OTP has expired
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
            // Update user status to "active" and clear OTP data
            user.status = "Active";
            user.otp = undefined; // Clear OTP data
            await user.save();

            // Store user information in session
            req.session.user = { fullname: user.fullname, email: user.email };

            res.render("user/home"); // Redirect to home page after successful verification
        } else {
            // Increment OTP attempts
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
    let { email } = req.body;  // Retrieve email from the request body
    email = email.trim()
    console.log("email: ", email)
    try {
        // Find the user by email
        const user = await userSchema.findOne({ email });
        console.log("user: ", user)
      
        // Check if the OTP attempts limit has been reached
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
        user.otp.otpExpiresAt = Date.now() + 60000;  // OTP expiry set to 1 minute
        user.otp.otpAttempts += 1;  // Increment OTP attempts count
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


// ---- user logout --- 

const logoutUser = (req,res)=>{
    
    req.session.destroy((err) => {
        if (err) {
          log.red('Error destroying session', err);
          return res.status(500).send('Unable to log out');
        }
        res.render('user/login',{message:"Logged out successfully", alertType:"success"});
      });

}



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



export default {
    loadLogin, verifyLogin,
     loadSignup,verifyOTP , resendOTP,
    loadForgotpassword, loadResetpassword, loadResetpasswordotp,
    loadHome, registerUser,authGoogle, authGoogleCallback,
    logoutUser
}
