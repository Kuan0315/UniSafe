import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Guardian from '../models/Guardian';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, relationship, phoneNumber, studentEmail } = req.body;

        // Check if guardian already exists
        const existing = await Guardian.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already registered' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const guardian = new Guardian({
            name,
            email,
            password: hashedPassword,
            relationship,
            phoneNumber,
            studentEmail,
        });

        await guardian.save();

        // Generate JWT token
        const token = jwt.sign({ id: guardian._id, email: guardian.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.status(201).json({ guardian: { name, email, relationship, phoneNumber, studentEmail }, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const guardian = await Guardian.findOne({ email });
        if (!guardian) return res.status(404).json({ message: 'Guardian not found' });

        const isMatch = await bcrypt.compare(password, guardian.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate JWT token
        const token = jwt.sign({ id: guardian._id, email: guardian.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.json({ guardian: { name: guardian.name, email: guardian.email, relationship: guardian.relationship, phoneNumber: guardian.phoneNumber, studentEmail: guardian.studentEmail, avatar: guardian.avatar }, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
