import express from "express"
import { configDotenv } from "dotenv"
import {log} from "mercedlogger"

configDotenv()

const app = express()
const PORT = process.env.PORT

app.set("view engine", "ejs")

app.use(express.static('static'))

app.get('/', (req,res)=>{
    res.render("./user/login.ejs")
})




app.listen(PORT, ()=>{  
    log.green('SERVER STATUS', `server running on port: ${PORT}`)
})
