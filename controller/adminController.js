import { log } from "mercedlogger";
import { configDotenv } from "dotenv";
configDotenv()

const loadLogin =  (req, res) => {

    res.render("admin/login")
}

const verifyLogin = async (req,res)=>{
    try{
        const {email, password} = req.body
        console.log(email, password)
        if(email != process.env.ADMIN_EMAIL || password != process.env.ADMIN_PASSWORD){
            return res.render('admin/login', { message: "Invalid credentials", alertType: "error" });
        }

        req.session.admin = true 
        res.send("admin loginned")
    }catch(error){
        log.red("LOGIN ERROR", error)
        res.render('admin/login', {message:"Something went wrong", alertType:"error"})
    }
}



export default { loadLogin, verifyLogin }