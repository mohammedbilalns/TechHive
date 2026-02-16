import userModel from "../model/userModel.js";
import logger from "../utils/logger.js";

const checkSession = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const user = await userModel.findById(req.session.user.id);
        if (!user || user.status !== "Active") {
            delete req.session.user;
            return res.redirect('/login?message=Your+account+has+been+blocked&alertType=error');
        }

        next();
    } catch (error) {
        logger.error('Session Check Error:', error);
        delete req.session.user;
        return res.redirect('/login?message=Session+error&alertType=error');
    }
};

const isLogin = (req, res, next) => {
    try {
        if (req.session.user) {
            return res.redirect('/home');
        }
        next();
    } catch (error) {
        logger.error('Login Check Error:', error);
        next(error);
    }
};

export default { isLogin, checkSession };
