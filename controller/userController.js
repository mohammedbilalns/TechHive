import userSchema from "../model/userModel.js";
import { log } from "mercedlogger";
import bcrypt from "bcrypt"


const saltRounds = 10 
const loadLogin = (req, res)=>{
    res.render('user/login')
}
const loadSignup = (req, res)=>{
    res.render('user/signup')
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

export default {loadLogin, loadSignup, loadForgotpassword, loadResetpassword, loadResetpasswordotp,loadSignupotp}