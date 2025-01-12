import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userSchema from "../model/userModel.js";
import { configDotenv } from "dotenv";
configDotenv();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (token, tokenSecret, profile, done) => {
    try {
        // Check if user exists with the same email
        const existingUser = await userSchema.findOne({ email: profile.emails[0].value });

        // If user exists, check their status
        if (existingUser) {
            // Check if user is not Active
            if (existingUser.status !== "Active") {
                return done(null, false, { message: "Your account is currently blocked" });
            }

            // Update googleId if not present
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
        });
        await newUser.save();
        
        return done(null, newUser);

    } catch (error) {
        return done(error, null);
    }
}));

// save user into the session 
passport.serializeUser((user, done) => {
    done(null, user._id);  // Store the user's ID in the session
});

// Deserialize user 
passport.deserializeUser(async (id, done) => {
    try {
        const user = await userSchema.findById(id);
        done(null, user);  
    } catch (error) {
        done(error, null);
    }
});

export default passport;
