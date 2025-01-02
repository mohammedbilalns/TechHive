import userSchema from "../../model/userModel.js";
import { log } from "mercedlogger";
import bcrypt from "bcryptjs";
import authUtils from "../../utils/authUtils.js";
import { config } from "dotenv";
import passport from "passport";
import validation from "../../utils/validations.js"
config();

// ---- User Login ----  
const loadLogin = (req, res) => {

    res.render('user/auth/login', { message: req.query.message, alertType: req.query.alertType });
};

// Verify user login 
const verifyLogin = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.trim()
        password = password.trim()

        const user = await userSchema.findOne({ email });// find the user 

        if (!email || !password) {
            return res.status(401).json({
                success: false,
                message: "Email and password are required"
            })
        } // check all fields are filled 

        if (!validation.isValidEmail(email)) {
            return res.status(401).json({
                success: false,
                message: "Enter a valid email address"
            })
        } // check the email is in vaid format 

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
        if (user.status != "Active") {
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
    res.render('user/auth/signup');
};

// Register a new user
const registerUser = async (req, res) => {
    try {
        let { fullname, phonenumber, email, password, confirmPassword } = req.body;
        fullname = fullname.trim()
        phonenumber = phonenumber.trim()
        email = email.trim()
        password = password.trim()
        confirmPassword = confirmPassword.trim()
        const otp = authUtils.generateOTP();

        if (!fullname || !phonenumber || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }
        if (!/^[a-zA-Z ]{3,30}$/.test(fullname)) {
            return res.status(400).json({
                success: false,
                message: "Full name should containe only alphabets (3-30 characters)"
            })
        }
        if (!validation.isValidPhone(phonenumber)) {
            return res.status(400).json({
                success: false,
                message: "Phone number must be 10 digits"
            })
        }
        if (!validation.isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            })
        }
        if (!validation.isValidPassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must contain 8+ characters with uppercase, lowercase, number, and special character"
            })
        }
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            })
        }
        // Check if a user already exists with the given email or phone number
        const existingUser = await userSchema.findOne({
            $or: [
                { email },
                { phonenumber }
            ]
        });

        // If the user already exists, return an error message
        if (existingUser && existingUser.status == "Pending") {
            await userSchema.findOneAndDelete({ email })

        } else if (existingUser) {
            let message;
            if (!existingUser.password) {
                message = "This email is linked to a Google login. Please log in with Google.";
            } else {
                message = existingUser.email === email ? "Email already registered" : "Phone number already registered";
            }
            return res.status(400).json({
                success: false,
                message
            })
        }

        // Hash the password 
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

        return res.status(200).json({
            success: true,
            email: email
        });

    } catch (error) {
        log.red('SIGNUP_ERROR', error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
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
            return res.status(400).json({
                success: false,
                message: "OTP has expired."
            });
        }

        if (user.otp.otpValue === userOTP) {
            user.status = "Active";
            user.otp = undefined;
            await user.save();

            req.session.user = { fullname: user.fullname, email: user.email };

            return res.json({
                success: true,
                message: "OTP verified successfully"
            });
        } else {
            if (user.otp.otpAttempts >= 4) {
                await userSchema.findOneAndDelete({ email });
                return res.status(400).json({
                    success: false,
                    message: "You have exceeded the maximum OTP attempts. Please sign up again.",
                    maxAttemptsExceeded: true
                });
            }

            user.otp.otpAttempts += 1;
            await user.save();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP, try again"
            });
        }
    } catch (error) {
        log.red("ERROR", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};


// Resend OTP functionality
const resendOTP = async (req, res) => {
    let { email } = req.body;
    email = email.trim();

    try {
        const user = await userSchema.findOne({ email });

        if (user.otp.otpAttempts >= 3) {
            console.log("295")
            await userSchema.findOneAndDelete({ email });
            return res.status(400).json({
                success: false,
                message: "Too many attempts. Please try again later.",
                maxAttemptsExceeded: true
            });

        }

        const otp = authUtils.generateOTP();

        user.otp.otpValue = otp;
        user.otp.otpExpiresAt = Date.now() + 60000;
        user.otp.otpAttempts += 1;
        await user.save();

        await authUtils.sendOTPEmail(email, otp);

        return res.json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        log.red("RESEND_OTP_ERROR", error);
        return res.status(500).json({
            success: false,
            message: "Failed to resend OTP"
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

const logoutUser = (req, res) => {

    try {
        delete req.session.user
        res.render('user/auth/login', { message: "Logged out successfully", alertType: "success" });

    } catch (error) {
        log.red('Error destroying session', err);
        return res.status(500).send('Unable to log out');
    }

}



// ---- forgot password ---- 
const loadForgotpassword = (req, res) => {
    let message = req.query.message;
    let alertType = req.query.alertType;
    let email = req.query.email;
    res.render('user/auth/forgotpassword', { message, alertType, email });
};


const processForgotPassword = async (req, res) => {
    try {
        let { email } = req.body;
        email = email.trim();
        const user = await userSchema.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Email not found"
            });
        }

        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "This account uses Google login. Please login with Google"
            });
        }

        const otp = authUtils.generateOTP();

        user.otp = {
            otpValue: otp,
            otpExpiresAt: Date.now() + 60000, // 1 minute expiry
            otpAttempts: 0,
        };
        await user.save();

        await authUtils.sendOTPEmail(email, otp);

        return res.json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        log.red('FORGOT_PASSWORD_ERROR', error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

const verifyForgotPasswordOTP = async (req, res) => {
    const { otp1, otp2, otp3, otp4, email } = req.body;
    const userOTP = otp1 + otp2 + otp3 + otp4;

    try {
        const user = await userSchema.findOne({ email });
        const currentTime = Date.now();

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification attempt"
            });
        }

        if (currentTime > user?.otp?.otpExpiresAt) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
        }

        if (user.otp.otpValue === userOTP) {
            user.otp = undefined;
            await user.save();

            return res.json({
                success: true,
                message: "OTP verified successfully"
            });
        } else {
            if (user.otp.otpAttempts >= 3) {
                user.otp = undefined;
                await user.save();
                return res.status(400).json({
                    success: false,
                    message: "Too many attempts. Please try again.",
                    maxAttemptsExceeded: true
                });
            }

            user.otp.otpAttempts += 1;
            await user.save();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP, please try again"
            });
        }
    } catch (error) {
        log.red("VERIFY_FORGOT_PASSWORD_OTP_ERROR", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
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
            return res.render("user/auth/forgotpassword", {
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

        res.render("user/auth/forgotpasswordotp", {
            email,
            message: "New OTP sent",
            alertType: "success",
        });

    } catch (error) {
        log.red("RESEND_FORGOT_PASSWORD_OTP", error);
        res.render("user/auth/forgotpasswordotp", {
            email,
            message: "Failed to resend OTP",
            alertType: "error",
        });
    }
};

const resetPassword = async (req, res) => {
    let { email, password, confirmPassword } = req.body;
    email = email.trim();
    password = password.trim()
    confirmPassword = confirmPassword.trim()

    try {
        if (!password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }
        const user = await userSchema.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid reset attempt"
            });
        }

        // Validate password format
        if (!validation.isValidPassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must contain 8+ characters with uppercase, lowercase, number, and special character"
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match..."
            })
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        return res.json({
            success: true,
            message: "Password reset successful"
        });

    } catch (error) {
        log.red("RESET_PASSWORD_ERROR", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reset password"
        });
    }
};


export default {
    loadLogin, verifyLogin,
    loadSignup, verifyOTP, resendOTP,
    loadForgotpassword, processForgotPassword, verifyForgotPasswordOTP,
    resendForgotPasswordOTP, resetPassword,
    registerUser, authGoogle, authGoogleCallback,
    logoutUser
}


