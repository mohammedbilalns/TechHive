import userSchema from "../model/userModel.js";
import { log } from "mercedlogger";
import bcrypt from "bcryptjs"
import authUtils from "../utils/authUtils.js";
import { config } from "dotenv";

config()


//---- User Login----  
const loadLogin = (req, res)=>{
    res.render('user/login')
}   // load user login page 
const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userSchema.findOne({ email });
        if (!user) return res.render('user/login', { message: "User does not exist", alertType: "error" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.render("user/login", { message: "Incorrect Password", alertType: "error", email: email });

        // Store user information in session after successful login
        req.session.user = {
            id: user._id,
            fullname: user.fullname,
            email: user.email
        };

        res.render('user/home');

    } catch (error) {
        log.red("ERROR", error);
        res.render('user/login', { message: "Something went wrong", alertType: "error" });
    }
};



// ----User Signup---- 
const loadSignup = (req, res)=>{
    res.render('user/signup')
}   //load user signup page     


const registerUser = async (req, res) => {
    try {
        const { fullname, phonenumber, email, password } = req.body
        const otp = authUtils.generateOTP()

        // Check if user exists with either email or phone number
        const existingUser = await userSchema.findOne({
            $or: [
                { email },
                { phonenumber }
            ]
        }) 

        if (existingUser) {
            const message = existingUser.email === email 
                ? "Email already registered" 
                : "Phone number already registered"
                return res.render('user/signup', {
                    message, 
                    alertType: "error", 
                    fullname, 
                    email:  email,
                    phonenumber:  phonenumber
                });
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        
        // set the user schema
        const newUser = new userSchema({
            fullname,
            phonenumber,
            email,
            password: hashedPassword,
            status: "pending",
        })

        // save user details in db
        await newUser.save()

        // Store OTP and its expiry in session
        req.session.userOTP = {
            otp,
            fullname,
            email,
            expiryTime: Date.now() + 60000, // 1 minute from now
            userId: newUser._id
        }

        // send otp to the user mail
        await authUtils.sendOTPEmail(email, otp)
        res.render('user/signupotp')
    } catch (error) {
        log.red('ERROR', error)
        res.render('user/signup', { message: "Something went wrong ", alertType: "error" })
    }
} //register user with the form details 

const verifyOTP = async (req,res)=>{
    let {otp1,otp2, otp3, otp4, timeRem} = req.body 

    let userOTP = otp1 + otp2 + otp3+ otp4 
   
    console.log(typeof userOTP)
    console.log("session otp" +req.session.userOTP.otp)
   console.log("userOTP:"+userOTP )

    console.log("isvalid"+req.session.userOTP.otp== userOTP)
    if(userOTP == req.session.userOTP.otp){

        
        const {fullname,email , userId} = req.session.userOTP 
        await userSchema.findByIdAndUpdate(userId, {
            status: "active"
        }); // update status of the user after otp verification 

        req.session.user = {
            fullname,email 
        }
        req.session.userOTP = undefined
        res.render("user/home")

    }else{
       

        res.render('user/signupotp',{ message: "Invalid OTP , try again ", alertType: "error",timeRem:parseInt(timeRem) })
    }

} // verify otp to redirect to the home 

const resendOTP = async (req,res)=>{
    
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

export default {loadLogin, verifyLogin, loadSignup,verifyOTP ,  loadForgotpassword, loadResetpassword, loadResetpasswordotp, loadHome, registerUser,}
