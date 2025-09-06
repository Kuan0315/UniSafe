// routes/flashlight.js
import express from 'express';
import { auth } from '../middleware/auth.js'; // updated middleware import
import FlashlightSession from '../models/FlashlightSession.js';

const router = express.Router();

// Start a new flashlight session
router.post('/sessions', auth, async (req, res) => {
    try {
        const { duration, intensity, pattern } = req.body;

        const session = new FlashlightSession({
            user: req.user.id,
            duration: duration || 300, // default 5 minutes
            intensity: intensity || 100, // default 100%
            pattern: pattern || 'steady',
            status: 'active'
        });

        await session.save();
        await session.populate('user', 'name email phone');

        // Emit socket event for real-time updates
        req.app.get('io').to(`user_${req.user.id}`).emit('flashlight-started', {
            sessionId: session._id,
            duration: session.duration,
            intensity: session.intensity,
            pattern: session.pattern
        });

        res.status(201).json({
            success: true,
            message: 'Flashlight session started',
            data: session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error starting flashlight session',
            error: error.message
        });
    }
});

// Get active flashlight session
router.get('/sessions/active', auth, async (req, res) => {
    try {
        const session = await FlashlightSession.findOne({
            user: req.user.id,
            status: 'active'
        }).populate('user', 'name email phone');

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'No active flashlight session found'
            });
        }

        res.json({
            success: true,
            data: session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching flashlight session',
            error: error.message
        });
    }
});

// Stop flashlight session
router.post('/sessions/:id/stop', auth, async (req, res) => {
    try {
        const session = await FlashlightSession.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Flashlight session not found'
            });
        }

        session.status = 'stopped';
        session.endedAt = new Date();
        await session.save();

        // Emit socket event
        req.app.get('io').to(`user_${req.user.id}`).emit('flashlight-stopped', {
            sessionId: session._id
        });

        res.json({
            success: true,
            message: 'Flashlight session stopped',
            data: session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error stopping flashlight session',
            error: error.message
        });
    }
});

// Update flashlight settings
router.put('/sessions/:id', auth, async (req, res) => {
    try {
        const { intensity, pattern } = req.body;

        const session = await FlashlightSession.findOne({
            _id: req.params.id,
            user: req.user.id,
            status: 'active'
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Active flashlight session not found'
            });
        }

        if (intensity !== undefined) session.intensity = intensity;
        if (pattern) session.pattern = pattern;

        await session.save();

        // Emit socket event for real-time updates
        req.app.get('io').to(`user_${req.user.id}`).emit('flashlight-updated', {
            sessionId: session._id,
            intensity: session.intensity,
            pattern: session.pattern
        });

        res.json({
            success: true,
            message: 'Flashlight settings updated',
            data: session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating flashlight settings',
            error: error.message
        });
    }
});

// Get flashlight session history
router.get('/sessions/history', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const sessions = await FlashlightSession.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('user', 'name email phone');

        const total = await FlashlightSession.countDocuments({ user: req.user.id });

        res.json({
            success: true,
            data: sessions,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching flashlight history',
            error: error.message
        });
    }
});

// Emergency flashlight pattern (SOS)
router.post('/emergency', auth, async (req, res) => {
    try {
        const session = new FlashlightSession({
            user: req.user.id,
            duration: 600, // 10 minutes for emergency
            intensity: 100,
            pattern: 'sos',
            isEmergency: true,
            status: 'active'
        });

        await session.save();
        await session.populate('user', 'name email phone');

        // Emit emergency event
        req.app.get('io').to(`user_${req.user.id}`).emit('flashlight-emergency', {
            sessionId: session._id,
            pattern: 'sos',
            isEmergency: true
        });

        // Notify emergency contacts
        const userModel = await import('../models/User.js');
        const user = await userModel.default.findById(req.user.id);

        if (user && user.emergencyContacts && user.emergencyContacts.length > 0) {
            req.app.get('io').to('security').emit('emergency-flashlight-activated', {
                userId: req.user.id,
                userName: user.name,
                sessionId: session._id,
                timestamp: new Date()
            });
        }

        res.status(201).json({
            success: true,
            message: 'Emergency flashlight activated',
            data: session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error activating emergency flashlight',
            error: error.message
        });
    }
});

export default router;
