import { env } from "../utils/env.js";
import logger from "../utils/logger.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",  
  auth: {
    user: env.EMAIL, 
    pass: env.APP_PASSWORD,  
  },
}); 


export const sendOTPEmail = async (email, otp) => {
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
  }
}; 
