"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.ts
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const signupSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1),
    role: zod_1.z.enum(['student', 'guardian', 'staff']).optional().default('guardian'),
    password: zod_1.z.string().min(6),
});
router.post('/signup', async (req, res) => {
    try {
        const data = signupSchema.parse(req.body);
        const existing = await User_1.default.findOne({ email: data.email });
        if (existing)
            return res.status(409).json({ error: 'Email already in use' });
        const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
        //const studentId = data.email.split('@')[0];
        const user = await User_1.default.create({
            email: data.email,
            name: data.name,
            role: data.role,
            passwordHash,
            studentId: data.email.split('@')[0],
            phone: req.body.phone,
        });
        const token = createToken(user.id);
        return res.json(safeUser(user, token));
    }
    catch (err) {
        return res.status(400).json({ error: err.message || 'Invalid data' });
    }
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['student', 'guardian', 'staff']),
});
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = loginSchema.parse(req.body);
        const user = await User_1.default.findOne({ email });
        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });
        if (!user.passwordHash)
            return res.status(401).json({ error: 'Please use Google login for this account' });
        const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!ok)
            return res.status(401).json({ error: 'Invalid credentials' });
        if (user.role !== role) {
            return res.status(403).json({ error: 'Role mismatch' });
        }
        const token = createToken(user.id);
        return res.json(safeUser(user, token));
    }
    catch (err) {
        return res.status(400).json({ error: err.message || 'Invalid data' });
    }
});
router.get('/me', auth_1.requireAuth, async (req, res) => {
    const user = await User_1.default.findById(req.auth.userId);
    if (!user)
        return res.status(404).json({ error: 'Not found' });
    return res.json(safeUser(user));
});
router.put('/me/avatar', auth_1.requireAuth, async (req, res) => {
    const { avatarDataUrl } = req.body;
    if (!avatarDataUrl)
        return res.status(400).json({ error: 'avatarDataUrl required' });
    const user = await User_1.default.findById(req.auth.userId);
    if (!user)
        return res.status(404).json({ error: 'Not found' });
    user.avatarDataUrl = avatarDataUrl;
    await user.save();
    res.json({ success: true, avatarDataUrl });
});
function createToken(userId) {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('JWT_SECRET not set');
    return jsonwebtoken_1.default.sign({ userId }, secret, { expiresIn: '30d' });
}
function safeUser(user, token) {
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
exports.default = router;
