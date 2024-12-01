import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userSchema from "../model/userModel.js";
import { configDotenv } from "dotenv";
configDotenv();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
},
async (token, tokenSecret, profile, done) => {
    try {
        // Check if user exists with the same email
        const existingUser = await userSchema.findOne({ email: profile.emails[0].value });

        // If user exists and is blocked
        if (existingUser && existingUser.status === "blocked") {
            return done(null, false, { message: "Your account has been blocked" });
        }

        // If user exists with email but no googleId, link the Google ID
        if (existingUser && !existingUser.googleId) {
            existingUser.googleId = profile.id;
            await existingUser.save();
            return done(null, existingUser);
        }

        // Check if user exists with Google ID
        let user = await userSchema.findOne({ googleId: profile.id });

        // If the user does not exist, create a new user in the database
        if (!user) {
            // Check if email already exists without Google ID
            const emailUser = await userSchema.findOne({ 
                email: profile.emails[0].value,
                googleId: { $exists: false }
            });

            if (emailUser) {
                return done(null, false, { message: "Email already registered without Google login" });
            }

            user = new userSchema({
                fullname: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                status: "active",
            });
            await user.save();
        }

        // Save user information into session
        done(null, user);

    } catch (error) {
        return done(error, null);
    }
}));

// Serialize user into the session (store user info like ID or a minimal data)
passport.serializeUser((user, done) => {
    done(null, user._id);  // Store the user's ID in the session
});

// Deserialize user from the session (retrieve user details using the stored ID)
passport.deserializeUser(async (id, done) => {
    try {
        const user = await userSchema.findById(id);
        done(null, user);  // Attach the full user object to the session
    } catch (error) {
        done(error, null);
    }
});

export default passport;
