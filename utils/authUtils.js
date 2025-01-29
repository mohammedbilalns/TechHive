
import nodemailer from "nodemailer"
import crypto from "crypto"
import { config } from "dotenv";
import { log } from "mercedlogger";
import bcrypt from "bcryptjs"
config()


// utils for sending otp to the client 
const transporter = nodemailer.createTransport({
  service: "Gmail",  
  auth: {
    user: process.env.EMAIL, 
    pass: process.env.APP_PASSWORD,  
  },
}); 


const generateOTP = () => {
  return crypto.randomInt(1000, 9999).toString() 
}; 

const sendOTPEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code For TechHive ",
      text: `Your OTP is ${otp}. It will expire in 1 minutes.`,
      
    });
    log.green("OTP STATUS", "OTP send successfully")
    
  } catch (error) {
    log.red("OTP STATUS", error)
    await userSchema.deleteOne({ email });
  }
}; // send otp to the given mail address

// utils for hashing passwords 
const hashPassword = async (password, saltRounds) =>{
  const hash =  await bcrypt.hash(password, saltRounds)
  return hash 
}

export default {generateOTP, sendOTPEmail, hashPassword}


