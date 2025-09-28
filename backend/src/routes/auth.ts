import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User';
import { requireAuth } from '../middleware/auth';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['student', 'staff', 'guardian', 'security']).optional().default('student'),
  password: z.string().min(6),
});

router.post('/signup', async (req, res) => {
  try {
    const data = signupSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email });
    if (existing) return res.status(409).json({ error: 'Email already in use' });
    const passwordHash = await bcrypt.hash(data.password, 10);
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const user = await User.create({
      email: data.email,
      name: data.name,
      role: data.role,
      passwordHash,
      isVerified: false,
      verificationToken,
      verificationTokenExpires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
    });

    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (e) {
      // Do not block signup if email fails; client can retry verification
      console.warn('Failed to send verification email:', (e as Error).message);
    }

    return res.status(201).json({ message: 'Signup received. Please verify your email to activate your account.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Invalid data' });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isVerified) return res.status(403).json({ error: 'Email not verified' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = createToken(user.id);
    return res.json(safeUser(user, token));
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Invalid data' });
  }
});

// Google login/signup with ID token
// Expects: { idToken: string, role?: 'student' | 'staff' | 'guardian' | 'security' }
router.post('/google', async (req, res) => {
  try {
    const { idToken, accessToken, role } = req.body as { idToken?: string; accessToken?: string; role?: 'student' | 'staff' | 'guardian' | 'security' };
    if (!idToken && !accessToken) return res.status(400).json({ error: 'Google token required' });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    let email: string | undefined;
    let name: string | undefined;

    if (idToken && clientId) {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      const payload = ticket.getPayload();
      email = payload?.email || undefined;
      name = payload?.name || undefined;
    } else if (accessToken) {
      const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (r.ok) {
        const p = await r.json();
        email = p.email;
        name = p.name || p.email;
      }
    } else {
      // Dev fallback: accept token as email for local testing
      const tokenLike = idToken || accessToken || '';
      email = tokenLike.includes('@') ? tokenLike : undefined;
      name = email ? email.split('@')[0] : 'Google User';
    }

    if (!email) return res.status(400).json({ error: 'Invalid Google token' });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: name || email,
        role: role || 'student',
      });
    }

    const token = createToken(user.id);
    return res.json(safeUser(user, token));
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Google auth failed' });
  }
});

// Email verification endpoint
const verifySchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
});

router.post('/verify', async (req, res) => {
  try {
    const { email, token } = verifySchema.parse(req.body);
    const user = await User.findOne({ email, verificationToken: token });
    if (!user) return res.status(400).json({ error: 'Invalid verification token' });
    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      return res.status(400).json({ error: 'Verification token expired' });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined as any;
    await user.save();
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Invalid data' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.auth!.userId);
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json(safeUser(user));
});

router.put('/me/avatar', requireAuth, async (req, res) => {
  const { avatarDataUrl } = req.body as { avatarDataUrl?: string };
  if (!avatarDataUrl) return res.status(400).json({ error: 'avatarDataUrl required' });
  const user = await User.findById(req.auth!.userId);
  if (!user) return res.status(404).json({ error: 'Not found' });
  user.avatarDataUrl = avatarDataUrl;
  await user.save();
  res.json({ success: true, avatarDataUrl });
});

function createToken(userId: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.sign({ userId }, secret, { expiresIn: '30d' });
}

function safeUser(user: any, token?: string) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    token,
  };
}

async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:19006';
  const verifyUrl = `${baseUrl}/verify?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

  const transport = await createTransport();
  await transport.sendMail({
    to: email,
    from: process.env.EMAIL_FROM || 'no-reply@unisafe.local',
    subject: 'Verify your UniSafe account',
    html: `<p>Welcome to UniSafe!</p><p>Please verify your email by clicking <a href="${verifyUrl}">this link</a>.</p>`
  });
}

async function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  // Ethereal fallback for dev
  const test = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: test.user, pass: test.pass },
  });
}

export default router;

