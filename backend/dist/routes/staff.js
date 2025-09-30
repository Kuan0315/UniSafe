"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// @ts-ignore
const Staff_1 = __importDefault(require("../models/Staff"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
// Staff Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, staffId, department, role, shift } = req.body;
        if (!name || !email || !password || !staffId || !department || !role || !shift) {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }
        const existing = await Staff_1.default.findOne({ email });
        if (existing)
            return res.status(400).json({ message: 'Email already registered' });
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const staff = new Staff_1.default({
            name, email, password: hashedPassword, staffId, department, role, shift
        });
        await staff.save();
        const token = jsonwebtoken_1.default.sign({ id: staff._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
        const staff = await Staff_1.default.findOne({ email });
        if (!staff)
            return res.status(400).json({ message: 'Invalid credentials' });
        const match = await bcryptjs_1.default.compare(password, staff.password);
        if (!match)
            return res.status(400).json({ message: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ id: staff._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ staff, token });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get/Update Staff Profile (Protected)
router.get('/profile', auth_1.requireAuth, async (req, res) => {
    const staff = await Staff_1.default.findById(req.auth.userId);
    if (!staff)
        return res.status(404).json({ message: 'Staff not found' });
    res.json({ staff });
});
router.post('/profile', auth_1.requireAuth, async (req, res) => {
    try {
        const updates = req.body;
        const staff = await Staff_1.default.findByIdAndUpdate(req.auth.userId, updates, { new: true });
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
        const staff = await Staff_1.default.findOne({ email: req.params.email }).select('-password');
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
        const staff = await Staff_1.default.findOneAndUpdate({ email: req.params.email }, { name, department, role, shift, avatar }, { new: true }).select('-password');
        if (!staff)
            return res.status(404).json({ message: 'Staff not found' });
        res.json(staff);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
