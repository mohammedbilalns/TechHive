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



export default {loadLogin, loadSignup}