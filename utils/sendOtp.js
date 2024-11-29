
import nodemailer from "nodemailer"
import crypto from "crypto"
import { config } from "dotenv";
import { log } from "mercedlogger";
config()


const transporter = nodemailer.createTransport({
  service: "Gmail",  
  auth: {
    user: process.env.EMAIL, 
    pass: process.env.APP_PASSWORD,  
  },
});


const generateOTP = () => {
  return crypto.randomBytes(3).toString("hex");
   
};


const sendOTPEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code For TechHive Login",
      text: `Your OTP code is: ${otp}`,
      
    });
    log.green("OTP STATUS", "OTP send successfully")
  } catch (error) {
    log.red
    console.error("Error sending OTP email:", error);
  }
};

export default {generateOTP, sendOTPEmail}


