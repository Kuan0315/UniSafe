import express from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import SOSAlert from '../models/SOSAlert.js';
import CallLog from '../models/CallLog.js';

const router = express.Router();

// POST /api/emergency/call
router.post('/call', auth, async (req, res) => {
    try {
        const { location, message, type } = req.body;
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            return res.status(400).json({ error: 'Invalid location' });
        }

        const alert = await SOSAlert.create({
            user: req.user._id,
            location: { type: 'Point', coordinates: [location.lng, location.lat] },
            message: message || 'Emergency campus call',
            triggeredBy: 'manual',
            severity: 'high',
            meta: { callType: type || 'voice' }
        });

        const providerResponse = { simulated: true, note: 'Call would be placed via provider here.' };

        const callLog = await CallLog.create({
            user: req.user._id,
            sos: alert._id,
            type: type || 'voice',
            providerResponse
        });

        const populated = await SOSAlert.findById(alert._id).populate('user', 'name role');
        const io = req.app.get('io');
        if (io) {
            io.emit('emergency_call', {
                id: populated._id,
                user: { id: populated.user._id, name: populated.user.name },
                location: { lat: location.lat, lng: location.lng },
                message: populated.message,
                createdAt: populated.createdAt
            });
        }

        res.status(201).json({ alert: populated, callLog });
    } catch (err) {
        console.error('Emergency call error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/emergency/call-logs
router.get('/call-logs', auth, requireRole(['teacher', 'security']), async (req, res) => {
    try {
        const logs = await CallLog.find()
            .sort({ createdAt: -1 })
            .limit(200)
            .populate('user', 'name role')
            .populate('sos');
        res.json({ logs });
    } catch (err) {
        console.error('Call logs error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
