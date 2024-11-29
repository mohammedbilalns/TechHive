import userSchema from "../model/userModel.js";
import { log } from "mercedlogger";
import bcrypt from "bcryptjs"
import crypto from "crypto"
import otpModel from "../model/otpModel.js" // otp model
import sendOtp from "../utils/sendOtp.js"
import nodemailer from "nodemailer"
import { config } from "dotenv";

config()

const transporter = nodemailer.createTransport({
    service: "Gmail",  
    auth: {
      user: process.env.EMAIL, 
      pass: process.env.APP_PASSWORD,  
    },
  });

const saltRounds = 10 
// User Login  
const loadLogin = (req, res)=>{
    res.render('user/login')
}
const verifyLogin = (req, res)=>{
}

// User Signup 
const loadSignup = (req, res)=>{
    res.render('user/signup')
}


const registerUser = async (req, res)=>{

    try{
        const {username , phonenumber, email, password} = req.body
    
        // generateOTP 
        const otp = crypto.randomInt(1000, 9999).toString(); // Generate a 4-digit OTP        const otpExpiry = new Date(Date.now() + 1 * 60 * 1000); // OTP expires in 1 minute 
        const otpExpiry = new Date(Date.now() + 1 * 60 * 1000); // OTP expires in 10 minutes


        const user = await userSchema.findOne({email})
    
        if(user) return res.render('user/signup', {message:"User already exists", alertType:"error"})
      
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        //set the user schema 
        const newUser = new userSchema({
            username,
            phonenumber,
            email,
            password:hashedPassword,
            status:"active",
            otp,
            otpExpiry
        })
        // save user details in db 
        await newUser.save()

        const sendOTPEmail = async (email, otp) => {
            try {
              await transporter.sendMail({
                from: process.env.EMAIL,
                to: email,
                subject: "Your OTP Code For TechHive Login",
                text: `Your OTP is ${otp}. It will expire in 1 minutes.`,
                
              });
              log.green("OTP STATUS", "OTP send successfully")
              res.render('user/signupotp')
              
            } catch (error) {
              log.red("OTP STATUS", error)
            }
          };

sendOTPEmail(email, otp)

    }catch(error){
        log.red('ERROR',error)
        res.render('/user/signup', {message:"Something went wrong ", alertType:"error"})
    }
}


const loadVerifyOtp = (req, res)=>{
    res.render("user/signupotp")
}
const loadForgotpassword = (req,res)=>{
    res.render('user/forgotpassword')
}
const loadResetpassword = (req, res)=>{
    res.render('user/resetpassword')
}
const loadResetpasswordotp = (req, res)=>{
    res.render('user/forgotpasswordotp')
}
const loadSignupotp = (req, res)=>{
    res.render('user/signupotp')
}
const loadHome = (req, res)=>{
    res.render('user/home')
}

export default {loadLogin, loadSignup, loadForgotpassword, loadResetpassword, loadResetpasswordotp,loadSignupotp, loadHome, registerUser, loadVerifyOtp}
