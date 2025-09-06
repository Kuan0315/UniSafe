import express from 'express';
import { auth } from '../middleware/auth.js';
import Device from '../models/Device.js';

const router = express.Router();

router.post('/register', auth, async (req, res) => {
    try {
        const { deviceId, platform, pushToken } = req.body;
        if (!deviceId) return res.status(400).json({ error: "deviceId required" });

        const filter = { deviceId, user: req.user._id };
        const update = { platform: platform || "web", pushToken: pushToken || "", lastSeenAt: new Date() };
        const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

        const device = await Device.findOneAndUpdate(filter, update, opts);
        res.json({ device });
    } catch (err) {
        console.error("Device register error", err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
