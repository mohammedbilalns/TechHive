import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userSchema from "../model/userModel.js";
import { configDotenv } from "dotenv";
import referralUtils from "./referralCode.js";
configDotenv();

async function generateUniqueReferralCode() {
    let referralCode;
    let isUnique = false;
    while (!isUnique) {
        referralCode = referralUtils.generateReferralCode();
        const existingUserWithCode = await userSchema.findOne({ referralCode });
        if (!existingUserWithCode) {
            isUnique = true;
        }
    }
    return referralCode;
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (token, tokenSecret, profile, done) => {
    try {
        // Check if user exists with the same email
        const existingUser = await userSchema.findOne({ email: profile.emails[0].value });

        if (existingUser) {
            if (existingUser.status !== "Active") {
                return done(null, false, { message: "Your account is currently blocked" });
            }

            if (!existingUser.googleId) {
                existingUser.googleId = profile.id;
                await existingUser.save();
            }
            return done(null, existingUser);
        }

        // If user doesn't exist, create a new user
        const newUser = new userSchema({
            fullname: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            status: "Active",
            referralCode: await generateUniqueReferralCode(),
        });

        const savedUser = await newUser.save();
        
        if (!savedUser) {
            return done(new Error("Failed to save user"), null);
        }

        return done(null, savedUser);

    } catch (error) {
        console.error("Google Strategy Error:", error);
        return done(error, null);
    }
}));

// = serialization 
passport.serializeUser((user, done) => {
    done(null, user.id); 
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await userSchema.findById(id);
        if (!user) {
            return done(null, false);
        }
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
