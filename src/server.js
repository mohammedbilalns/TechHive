import express from "express"
import { configDotenv } from "dotenv"
import { log } from "mercedlogger"
import nocache from "nocache"
import session from "express-session"
import passport from "passport"
import userRoutes from "../routes/user.js"
import adminRoutes from "../routes/admin.js"
import connnectDb from "../db/connect.js"
import '../utils/googleAuth.js'

configDotenv()

const app = express()
const PORT = process.env.PORT

app.set("view engine", "ejs")

// Middlewares
app.use(nocache())  // Prevent caching
app.use(session({
    secret: process.env.SESSIONSECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}))
app.use(express.static('static'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(passport.initialize())
app.use(passport.session())

// Routes
app.use('/', userRoutes)  
app.use('/admin', adminRoutes)

// 404 handler
app.use((req, res) => {
    res.status(404).render('notfound')
})

connnectDb()

// Start server
app.listen(PORT, () => {
    log.green('SERVER STATUS', `server running on port: ${PORT}`)
})
