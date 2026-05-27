import express from "express";
import nocache from "nocache";
import session from "express-session";
import passport from "passport";
import compression from "compression";
import path from "node:path";
import { fileURLToPath } from "node:url";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";
import './utils/googleAuth.js';
import { HttpStatus } from "./constants/statusCodes.js";
import { errorMiddleware } from "./middlewares/errorHandler.js";
import { env } from "./utils/env.js";
import {requestLogger} from "./middlewares/requestLogger.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


app.use(nocache());
app.use(express.static(path.join(__dirname, "static")));
app.use(compression());
app.use(session({
  secret: env.SESSIONSECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(requestLogger);
// Routes

app.use('/admin', adminRoutes);
app.use('/', userRoutes);


// 404 handler
app.use((req, res) => {
  res.status(HttpStatus.NOT_FOUND).render('notFound', {
    fullname: req.session.user ? req.session.user.fullname : null
  });
});

app.use(errorMiddleware);

export default app;
