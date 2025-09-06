// config/google.js - Google OAuth Configuration
import { OAuth2Client } from 'google-auth-library';

// Create OAuth2 client instance
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL}/auth/google/callback`
);

// Verify Google ID token
export const verifyGoogleToken = async (idToken) => {
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        return {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            avatar: payload.picture,
            emailVerified: payload.email_verified,
        };
    } catch (error) {
        console.error('Error verifying Google token:', error);
        throw new Error('Invalid Google token');
    }
};

// Generate Google OAuth URL
export const getGoogleAuthURL = () => {
    return googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ],
        prompt: 'consent',
    });
};

// Exchange code for tokens
export const getGoogleTokens = async (code) => {
    try {
        const { tokens } = await googleClient.getToken(code);
        googleClient.setCredentials(tokens);
        return tokens;
    } catch (error) {
        console.error('Error getting Google tokens:', error);
        throw new Error('Failed to exchange code for tokens');
    }
};

// Get user info from Google
export const getGoogleUserInfo = async (tokens) => {
    try {
        googleClient.setCredentials(tokens);
        const { data } = await googleClient.request({
            url: 'https://www.googleapis.com/oauth2/v3/userinfo',
        });
        return data;
    } catch (error) {
        console.error('Error getting Google user info:', error);
        throw new Error('Failed to get user info from Google');
    }
};

export default googleClient;