// config/passport.js - Passport Google OAuth Strategy
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI,
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        // Find or create user
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            return done(null, user);
        }

        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.avatar = profile.photos[0].value;
            user.isVerified = true;
            await user.save();
            return done(null, user);
        }

        // Create new user
        user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
            isVerified: true
        });

        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;