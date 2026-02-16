
import nodemailer from "nodemailer";
import crypto from "crypto";
import logger from "./logger.js";
import { env } from "./env.js";
import bcrypt from "bcryptjs";


// utils for sending otp to the client 
const transporter = nodemailer.createTransport({
  service: "Gmail",  
  auth: {
    user: env.EMAIL, 
    pass: env.APP_PASSWORD,  
  },
}); 


const generateOTP = () => {
  return crypto.randomInt(1000, 9999).toString(); 
}; 

const sendOTPEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: env.EMAIL,
      to: email,
      subject: "Your OTP Code For TechHive ",
      text: `Your OTP is ${otp}. It will expire in 1 minutes.`,
      
    });
    logger.info("OTP STATUS", "OTP send successfully");
    
  } catch (error) {
    logger.error("OTP STATUS", error);
    // await userSchema.deleteOne({ email }); // This will crash, userSchema is not defined here.
  }
}; // send otp to the given mail address

// utils for hashing passwords 
const hashPassword = async (password, saltRounds) =>{
  const hash =  await bcrypt.hash(password, saltRounds);
  return hash; 
};

export default {generateOTP, sendOTPEmail, hashPassword};


