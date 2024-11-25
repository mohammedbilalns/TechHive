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

const registerUser = async (req, res)=>{

    try{

        const {username , phonenumber, email, password} = req.body
        console.log(req.body)
        const user = await userSchema.findOne({email})
    
        if(user) return res.render('user/signup', {message:"User already exists", alertType:"error"})
      
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        const newUser = new userSchema({
            username,
            phonenumber,
            email,
            password:hashedPassword
        })

        await newUser.save()
        res.render('user/login',{message:"user created successfully", alertType:"success"})
    }catch(error){
        log.red('ERROR',error)
        res.render('/user/signup', {message:"Something went wrong ", alertType:"error"})
    }
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

export default {loadLogin, loadSignup, loadForgotpassword, loadResetpassword, loadResetpasswordotp,loadSignupotp, loadHome, registerUser}