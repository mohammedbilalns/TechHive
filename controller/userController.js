import userSchema from "../model/userModel.js";
import { log } from "mercedlogger";
import bcrypt from "bcryptjs";
import authUtils from "../utils/authUtils.js";
import { config } from "dotenv";
import passport from "passport";
import productSchema from "../model/productModel.js";
import categorySchema from "../model/categoryModel.js";


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

        // Check if user's status is pending
        if (user.status === "Pending") {
            return res.redirect(`/login?message=Please+wait+for+some+time+for+sign+up+again&alertType=warning&email=${email}`);
        }

        //check the user is active 
        if(user.status != "Active") return res.redirect(`/login?message=Your+account+is+currently+blocked&alertType=error&email=${email}` )
        
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
        res.redirect('/home');
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

        // Schedule deletion after 3 minutes if status is still pending
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
        }, 3 * 60 * 1000); // 3 minutes in milliseconds

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
            user.otp = undefined;
            await user.save();

            // Store user information in session
            req.session.user = { fullname: user.fullname, email: user.email };

            // Redirect to home with success message
            return res.redirect('/home?message=Registration+successful!&alertType=success');
        } else {
            // Check OTP attempts only when wrong OTP is entered
            if (user.otp.otpAttempts >= 3) {
                await userSchema.findOneAndDelete({ email });
                return res.render("user/signup", {
                    message: "You have exceeded the maximum OTP attempts. Please try again later.",
                    alertType: "error",
                });
            }

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
const loadHome = async (req, res) => {
    try {
        const allProducts = await productSchema
            .find({ status: "Active" })
            .limit(6);

        // Fetch all categories
        const categories = await categorySchema
            .find({ status: "Active" })
            .limit(10);

        // Fetch new arrival products (assuming there's a createdAt field)
        const newArrivals = await productSchema
            .find()
            .sort({ createdAt: -1 })
            .limit(3);
        let fullname = req.session.user?.fullname;

        res.render('user/home', {
            allProducts,
            categories,
            newArrivals,
            fullname
        });
    } catch (error) {
        log.red("ERROR", error);
        res.status(500).render('user/home', { 
            message: "Error loading products",
            alertType: "error" 
        });
    }
};

const loadLanding = async (req, res) => {
    try {
        const allProducts = await productSchema
            .find({ status: "Active" })
            .limit(6);

        // Fetch all categories
        const categories = await categorySchema
            .find({ status: "Active" })
            .limit(10);

        // Fetch new arrival products (assuming there's a createdAt field)
        const newArrivals = await productSchema
            .find()
            .sort({ createdAt: -1 })
            .limit(3);

        res.render('user/landing', {
            allProducts,
            categories,
            newArrivals
        });
    } catch (error) {
        log.red("ERROR", error);
        res.status(500).render('user/landing', { 
            message: "Error loading products",
            alertType: "error" 
        });
    }
};

const loadAllProducts = async (req, res) => {
    try {
        // Fetch all active categories with their products
        const categoriesWithProducts = await categorySchema
            .aggregate([
                { $match: { status: "Active" } },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "category",
                        pipeline: [{ $match: { status: "Active" } }],
                        as: "products"
                    }
                }
            ]);

        res.render('user/allproducts', {
            categoriesWithProducts
        });
    } catch (error) {
        log.red("ERROR", error);
        res.status(500).render('user/allproducts', {
            message: "Error loading products",
            alertType: "error"
        });
    }
};

const viewProduct = async (req, res) => {
    try {
        const product = await productSchema.findById(req.params.id);
        
        if (!product) {
            return res.status(404).render('error', {
                message: "Product not found",
                alertType: "error"
            });
        }

        // Fetch related products from the same category
        const relatedProducts = await productSchema.find({
            category: product.category,
            _id: { $ne: product._id }, // Exclude current product
            status: "Active"
        }).limit(4);

        res.render('user/viewproduct', { 
            product,
            relatedProducts
        });
    } catch (error) {
        log.red("ERROR", error);
        res.status(500).render('error', {
            message: "Error loading product",
            alertType: "error"
        });
    }
};

export default {
    loadLogin, verifyLogin,
     loadSignup,verifyOTP , resendOTP,
    loadForgotpassword, loadResetpassword, loadResetpasswordotp,
    loadHome, registerUser,authGoogle, authGoogleCallback,
    logoutUser, loadAllProducts, viewProduct,loadLanding
}
