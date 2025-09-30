"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
const Alert_1 = require("../models/Alert");
const router = (0, express_1.Router)();
// Student creates SOS alert
router.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        const { message, latitude, longitude } = req.body;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json({ error: 'latitude and longitude are required' });
        }
        const alert = await Alert_1.Alert.create({
            userId: req.auth.userId,
            type: 'HELP',
            recipient: 'security',
            message: message || 'SOS activated',
            latitude,
            longitude,
            handled: false,
        });
        // Notify all staff/security users
        const staffUsers = await User_1.default.find({ role: { $in: ['staff', 'security'] } }).select('_id');
        if (staffUsers.length > 0) {
            const notifs = staffUsers.map(s => ({
                recipientId: s._id,
                senderId: req.auth.userId,
                type: 'check_in_reminder',
                title: 'SOS Alert',
                message: 'A student has activated SOS. Open staff tab to view.',
                location: { latitude, longitude },
            }));
            await Notification_1.default.insertMany(notifs);
        }
        return res.status(201).json(alert);
    }
    catch (err) {
        return res.status(400).json({ error: err.message || 'Failed to create SOS' });
    }
});
// Staff list unhandled SOS alerts (most recent first)
router.get('/', auth_1.requireAuth, async (_req, res) => {
    try {
        const alerts = await Alert_1.Alert.find({ handled: false })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(200);
        return res.json(alerts);
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to load SOS' });
    }
});
// Staff mark an alert handled
router.patch('/:id/handle', auth_1.requireAuth, async (req, res) => {
    try {
        const alert = await Alert_1.Alert.findByIdAndUpdate(req.params.id, { handled: true }, { new: true });
        if (!alert)
            return res.status(404).json({ error: 'SOS not found' });
        return res.json(alert);
    }
    catch (err) {
        return res.status(400).json({ error: err.message || 'Failed to update SOS' });
    }
});
// Staff view all (optional filter)
router.get('/all', auth_1.requireAuth, async (req, res) => {
    try {
        const { handled } = req.query;
        const filter = {};
        if (handled === 'true')
            filter.handled = true;
        else if (handled === 'false')
            filter.handled = false;
        const alerts = await Alert_1.Alert.find(filter)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(500);
        return res.json(alerts);
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to load SOS' });
    }
});
exports.default = router;
