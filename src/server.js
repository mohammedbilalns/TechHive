import express from "express"
import { configDotenv } from "dotenv"
import {log} from "mercedlogger"
import nocache from "nocache"

import userRoutes from "../routes/user.js"
import adminRoutes from "../routes/admin.js"
import connnectDb from "../db/connect.js"
import session from "express-session"
import passport from "passport"
import '../utils/googleAuth.js'
configDotenv()


console.log(process.env.PORT)
const app = express()
const PORT = process.env.PORT

app.set("view engine", "ejs")

// global middlewares 
app.use(nocache())
app.use(session({secret:process.env.SESSIONSECRET, resave:false, saveUninitialized:true, cookie:{maxAge:1000*60*60*24}}))
app.use(express.static('static')) // static Middlewares
app.use(express.json()) // parse json 
app.use(express.urlencoded({ extended: false })) // parse req body
// initialize passport and session
app.use(passport.initialize());
app.use(passport.session());


app.use('/', userRoutes) // user route 
app.use('/admin', adminRoutes) // admin route 



app.use((req, res) => {
    res.status(404).render('notfound')
});
  

  
connnectDb()

app.listen(PORT, ()=>{  
    log.green('SERVER STATUS', `server running on port: ${PORT}`)
})
