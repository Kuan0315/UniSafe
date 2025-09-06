//./routes/auth.js
import express from 'express';
import {
    register,
    login,
    logout,
    getMe,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    guestAuth,
    updateProfile,
    updatePrivacySettings,
    updatePreferences,
    manageTrustedCircle,
    manageEmergencyContacts,
    googleAuth,
    googleAuthCallback,
    googleAuthMobile
} from '../controllers/authController.js';

import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// AUTH ROUTES
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/guest', guestAuth);

router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/privacy', authenticate, updatePrivacySettings);
router.put('/preferences', authenticate, updatePreferences);
router.put('/trusted-circle', authenticate, manageTrustedCircle);
router.put('/emergency-contacts', authenticate, manageEmergencyContacts);

router.post('/logout', authenticate, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Web Google OAuth
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);
// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User already exists with this email or username' 
            });
        }
        
        // Create new user
        const user = new User({ username, email, password });
        await user.save();
        
        // Generate token
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Generate token
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '24h' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});


// Mobile Google OAuth (token-based)
router.post('/google/mobile', googleAuthMobile);

export default router;
