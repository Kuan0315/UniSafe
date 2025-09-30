import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// @ts-ignore
import Staff from '../models/Staff.js';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
// Staff Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, staffId, department, role, shift } = req.body;
        if (!name || !email || !password || !staffId || !department || !role || !shift) {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }
        const existing = await Staff.findOne({ email });
        if (existing)
            return res.status(400).json({ message: 'Email already registered' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const staff = new Staff({
            name, email, password: hashedPassword, staffId, department, role, shift
        });
        await staff.save();
        const token = jwt.sign({ id: staff._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ staff, token });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});
// Staff Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const staff = await Staff.findOne({ email });
        if (!staff)
            return res.status(400).json({ message: 'Invalid credentials' });
        const match = await bcrypt.compare(password, staff.password);
        if (!match)
            return res.status(400).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ id: staff._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ staff, token });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get/Update Staff Profile (Protected)
router.get('/profile', requireAuth, async (req, res) => {
    const staff = await Staff.findById(req.auth.userId);
    if (!staff)
        return res.status(404).json({ message: 'Staff not found' });
    res.json({ staff });
});
router.post('/profile', requireAuth, async (req, res) => {
    try {
        const updates = req.body;
        const staff = await Staff.findByIdAndUpdate(req.auth.userId, updates, { new: true });
        res.json({ staff });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get staff profile by email
router.get('/profile/:email', async (req, res) => {
    try {
        const staff = await Staff.findOne({ email: req.params.email }).select('-password');
        if (!staff)
            return res.status(404).json({ message: 'Staff not found' });
        res.json(staff);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});
// Update profile
router.put('/profile/:email', async (req, res) => {
    try {
        const { name, department, role, shift, avatar } = req.body;
        const staff = await Staff.findOneAndUpdate({ email: req.params.email }, { name, department, role, shift, avatar }, { new: true }).select('-password');
        if (!staff)
            return res.status(404).json({ message: 'Staff not found' });
        res.json(staff);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});
export default router;
