// passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';

dotenv.config();

// Configure Google OAuth Strategy (optional in dev)
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (clientID && clientSecret) {
    passport.use(new GoogleStrategy({
        clientID,
        clientSecret,
        callbackURL: '/auth/google/callback',
    }, (accessToken, refreshToken, profile, done) => {
        done(null, profile);
    }));
} else {
    console.warn('Google OAuth not configured: Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET');
}

// Serialize user into session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
    done(null, user);
});
