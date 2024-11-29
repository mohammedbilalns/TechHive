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
const verifyLogin = async (req, res)=>{
    try{
        const {email, password} = req.body
        const user = await userSchema.findOne({email})
        if(!user) return res.render('user/login', {message:"User does not exists", alertType:"error"})
        
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) return res.render("user/login",  {message:"Incorrect Password", alertType:"error",email:email})
            req.session.user = {
                id: user._id,
                username: user.username,
                email: user.email
            };

        res.render('user/home')

    }catch(error){

        log.red("ERROR",error)
        res.render('user/login', {message:"Something went wrong", alertType:"error"})
    }



}   //verify the login form 


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
            username,
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

const verifyOTP = (req,res)=>{

    let userOTP = Object.values(req.body).join('')
   
    console.log("session otp" +req.session.userOTP.otp)
   console.log("userOTP:"+userOTP )

    console.log("isvalid"+req.session.userOTP.otp== userOTP)
    if(userOTP == req.session.userOTP.otp){

        const username = req.session.userOTP.username 
        req.session.user = {
            username
        }
        req.session.userOTP = undefined
        res.render("user/home")

    }else{
        res.render('user/signupotp',{ message: "Invalid OTP , try again ", alertType: "error" })
    }

} // verify otp to redirect to the home 


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
