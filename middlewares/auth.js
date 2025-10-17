import userModel from "../model/userModel.js";

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
        console.log('Session Check Error:', error);
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
        console.log('Login Check Error:', error);
        next(error);
    }
};

export default { isLogin, checkSession };
