import adminModel from "../model/adminModel.js";
import userModel from "../model/userModel.js";
import { log } from "mercedlogger";
import bcrypt from "bcrypt"


const loadLogin = async (req, res) => {

    res.render("admin/login")
}


export default { loadLogin }