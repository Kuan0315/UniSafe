// controllers/authController.js
import User from '../models/User.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import { OAuth2Client } from 'google-auth-library';
import { USER_ROLES } from '../config/constants.js';
import { validateEmail, validatePassword } from '../utils/validators.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export const googleAuthCallback = async (req, res) => {
    try {
        // This is just a placeholder. Replace with your OAuth callback logic.
        res.status(501).json({ success: false, message: 'Google auth callback not implemented yet' });
    } catch (error) {
        console.error('Google auth callback error:', error);
        res.status(500).json({ success: false, message: 'Server error during Google authentication callback' });
    }
};
export const updatePrivacySettings = async (req, res) => {
    try {
        const { privacySettings } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        user.privacySettings = privacySettings;
        await user.save();
        res.json({ success: true, message: 'Privacy settings updated successfully', data: user.privacySettings });
    } catch (error) {
        console.error('Update privacy settings error:', error);
        res.status(500).json({ success: false, message: 'Server error updating privacy settings' });
    }
};
export const updateProfile = async (req, res) => {
    try {
        const { name, phone, studentId } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        user.name = name ?? user.name;
        user.phone = phone ?? user.phone;
        user.studentId = studentId ?? user.studentId;
        await user.save();
        const { password, verificationToken, resetPasswordToken, ...safeUser } = user.toJSON();
        res.json({ success: true, message: 'Profile updated successfully', data: safeUser });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error updating profile' });
    }
};


export const updatePreferences = async (req, res) => {
    try {
        const { preferences } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        user.preferences = preferences;
        await user.save();
        res.json({ success: true, message: 'Preferences updated successfully', data: user.preferences });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ success: false, message: 'Server error updating preferences' });
    }
};


export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ success: false, message: 'No user found with this email' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'Email is already verified' });
        }

        const verificationToken = jwt.sign({ id: user.id }, process.env.JWT_VERIFICATION_SECRET || JWT_SECRET, { expiresIn: '1d' });
        user.verificationToken = verificationToken;
        await user.save();

        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        await sendEmail(user.email, 'Verify your UniSafe account', `Click here: ${verificationUrl}`);

        res.json({ success: true, message: 'Verification email sent successfully' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ success: false, message: 'Server error resending verification email' });
    }
};


export const manageTrustedCircle = async (req, res) => {
    try {
        const { trustedCircle } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        user.trustedCircle = trustedCircle;
        await user.save();
        res.json({ success: true, message: 'Trusted circle updated successfully', data: user.trustedCircle });
    } catch (error) {
        console.error('Manage trusted circle error:', error);
        res.status(500).json({ success: false, message: 'Server error updating trusted circle' });
    }
};


export const manageEmergencyContacts = async (req, res) => {
    try {
        const { emergencyContacts } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        user.emergencyContacts = emergencyContacts;
        await user.save();
        res.json({ success: true, message: 'Emergency contacts updated successfully', data: user.emergencyContacts });
    } catch (error) {
        console.error('Manage emergency contacts error:', error);
        res.status(500).json({ success: false, message: 'Server error updating emergency contacts' });
    }
};


export const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const googleAuth = async (req, res) => {
    try {
        // Redirect or handle Google OAuth logic here
        res.status(501).json({ success: false, message: 'Google auth not implemented yet' });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ success: false, message: 'Server error during Google authentication' });
    }
};


// Generate JWT token
export const generateToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// ----------------------
// Standard Auth
// ----------------------
export const register = async (req, res) => {
    try {
        const { name, email, password, role, studentId, phone } = req.body;
        const hashed = await bcrypt.hash(password, 10);

        if (!validateEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email' });
        if (!validatePassword(password)) return res.status(400).json({ success: false, message: 'Weak password' });

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ success: false, message: 'User already exists' });

        const user = await User.create({ name, email, password: hashed, role: role || USER_ROLES.STUDENT, studentId, phone });

        const autoVerify = String(process.env.AUTO_VERIFY_USERS || 'true').toLowerCase() === 'true';
        const disableEmail = String(process.env.DISABLE_EMAIL || 'true').toLowerCase() === 'true';

        if (autoVerify) {
            user.isVerified = true;
            user.verificationToken = undefined;
            await user.save();
        } else {
            const verificationToken = jwt.sign({ id: user.id }, process.env.JWT_VERIFICATION_SECRET || JWT_SECRET, { expiresIn: '1d' });
            user.verificationToken = verificationToken;
            await user.save();

            if (!disableEmail) {
                const verificationUrl = `${FRONTEND_URL}/verify-email/${verificationToken}`;
                await sendEmail(user.email, 'Verify your UniSafe account', `Click to verify: ${verificationUrl}`);
            }
        }

        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: autoVerify ? 'Registration successful.' : (disableEmail ? 'Registration successful. Email sending is disabled.' : 'Registration successful. Check email for verification.'),
            data: { token, user }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
        const autoVerify = String(process.env.AUTO_VERIFY_USERS || 'true').toLowerCase() === 'true';
        if (!autoVerify && !user.isVerified) return res.status(401).json({ success: false, message: 'Email not verified' });

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Invalid email or password' });

        const token = generateToken(user);
        res.json({ success: true, token, user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

// ----------------------
// Guest login
// ----------------------
export const guestAuth = async (req, res) => {
    try {
        const guestPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(guestPassword, 10);
        
        const guestUser = await User.create({
            name: 'Guest User',
            email: `guest_${Date.now()}@unisafe.com`,
            password: hashedPassword,
            role: USER_ROLES.GUEST,
            isVerified: true
        });

        const token = generateToken(guestUser);
        res.json({ success: true, token, user: guestUser });
    } catch (error) {
        console.error('Guest login error:', error);
        res.status(500).json({ success: false, message: 'Server error during guest login' });
    }
};

// ----------------------
// Google OAuth Web
// ----------------------
export const googleAuthMobile = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ success: false, message: 'Google ID token required' });

        const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();

        let user = await User.findOne({ where: { email: payload.email } });
        if (!user) {
            user = await User.create({
                googleId: payload.sub,
                name: payload.name,
                email: payload.email,
                avatar: payload.picture,
                isVerified: true
            });
        } else if (!user.googleId) {
            user.googleId = payload.sub;
            user.avatar = payload.picture;
            user.isVerified = true;
            await user.save();
        }

        const token = generateToken(user);
        res.json({ success: true, token, user });
    } catch (error) {
        console.error('Google auth mobile error:', error);
        res.status(500).json({ success: false, message: 'Google authentication failed' });
    }
};

// ----------------------
// Email verification
// ----------------------
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ where: { verificationToken: token } });
        if (!user) return res.status(400).json({ success: false, message: 'Invalid token' });

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ success: false, message: 'Server error verifying email' });
    }
};

// ----------------------
// Forgot & reset password
// ----------------------
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ success: false, message: 'No user found' });

        const resetToken = jwt.sign({ id: user.id }, process.env.JWT_RESET_SECRET || JWT_SECRET, { expiresIn: '1h' });
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000);
        await user.save();

        const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;
        await sendEmail(user.email, 'Reset password', `Click here: ${resetUrl}`);
        res.json({ success: true, message: 'Password reset email sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Server error during password reset' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const user = await User.findOne({ where: { resetPasswordToken: token, resetPasswordExpires: { [Op.gt]: new Date() } } });
        if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Server error resetting password' });
    }
};

// ----------------------
// Logout
// ----------------------
export const logout = async (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
};
