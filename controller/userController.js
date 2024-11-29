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
const verifyLogin = (req, res)=>{

}   //todo 

// ----User Signup---- 
const loadSignup = (req, res)=>{
    res.render('user/signup')
}   //load user signup page     


const registerUser = async (req, res) => {
    try {
        const { username, phonenumber, email, password } = req.body
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
            return res.render('user/signup', { message, alertType: "error" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        
        // set the user schema
        const newUser = new userSchema({
            username,
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

export default {loadLogin, loadSignup, loadForgotpassword, loadResetpassword, loadResetpasswordotp, loadHome, registerUser,}
