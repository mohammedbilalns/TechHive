import mongoose from "mongoose";
import dotenv from "dotenv"
import {log} from "mercedlogger"

dotenv.config()

const connnectDb = async ()=>{
    try{
        const connection = await mongoose.connect(process.env.MONGOURL,{})
        log.green("DB STATUS", "connected successfully")

    }catch(error){
        log.red("DB STATUS", error )
        process.exit(1)
    }
}

export default connnectDb