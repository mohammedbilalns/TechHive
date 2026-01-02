import express from "express";
import path from "node:path"
import { configDotenv } from "dotenv";
import { log } from "mercedlogger";
import nocache from "nocache";
import session from "express-session";
import passport from "passport";
import compression from "compression";
import userRoutes from "../routes/user.js";
import adminRoutes from "../routes/admin.js";
import connnectDb from "../db/connect.js";
import '../utils/googleAuth.js';


configDotenv();

const app = express();
const PORT = process.env.PORT;

app.set("view engine", "ejs");

app.use(compression());
app.use(nocache());
app.use(session({
  secret: process.env.SESSIONSECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(
  express.static(path.join(process.cwd(), "static"), {
    extensions: ["css", "js"],
    setHeaders(res, filePath) {
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
    },
  })
);
app.use('/js', express.static('static/js'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  if (req.originalUrl === "/techhive") {
    return res.redirect(301, "/techhive/");
  }
  next();
});

// Routes
app.use('/', userRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('notFound', {
    fullname: req.session.user ? req.session.user.fullname : null
  });
});

connnectDb();

// Start server
app.listen(PORT, () => {
  log.green('SERVER STATUS', `server running on port: ${PORT}`);
});
