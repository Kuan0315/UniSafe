// src/routes/auth.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User';
import { requireAuth } from '../middleware/auth';

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['student', 'guardian', 'staff']).optional().default('guardian'),
  password: z.string().min(6),
});

router.post('/signup', async (req, res) => {
  try {
    const data = signupSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email });
    if (existing) return res.status(409).json({ error: 'Email already in use' });
    const passwordHash = await bcrypt.hash(data.password, 10);
    //const studentId = data.email.split('@')[0];
    const user = await User.create({
      email: data.email,
      name: data.name,
      role: data.role,
      passwordHash,
      studentId: data.email.split('@')[0],
      phone: req.body.phone,
    });
    const token = createToken(user.id);
    return res.json(safeUser(user, token));
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Invalid data' });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['student', 'guardian', 'staff']),
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.passwordHash) return res.status(401).json({ error: 'Please use Google login for this account' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.role !== role) {
      return res.status(403).json({ error: 'Role mismatch' });
    }
    const token = createToken(user.id);
    return res.json(safeUser(user, token));
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
    studentId: user.studentId,
    phone: user.phone,
    token,
  };
}

export default router;