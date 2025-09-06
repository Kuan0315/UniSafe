// routes/location.js
import express from 'express';
import fetch from 'node-fetch';
import { nanoid } from 'nanoid';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import config from '../config.js';

const router = express.Router();
const nowISO = () => new Date().toISOString();

// ---------------- Live Share ---------------- //

// POST /api/location/live-share/start
router.post('/live-share/start', auth, async (req, res) => {
    try {
        const { expiresMinutes } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

        if (!user.followMe.sharingWith) user.followMe.sharingWith = [];

        const token = nanoid(16);
        const expiresAt = expiresMinutes ? new Date(Date.now() + expiresMinutes * 60000) : null;

        user.followMe.sharingWith.push({ userId: user._id, expiresAt, token });
        user.followMe.isActive = true;
        await user.save();

        const base = (process.env.PUBLIC_BASE_URL || process.env.BASE_URL || '').replace(/\/$/, '');
        const shareUrl = base ? `${base}/api/location/live-share/${token}` : `/api/location/live-share/${token}`;

        res.json({ ok: true, token, shareUrl });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// POST /api/location/live-share/stop
router.post('/live-share/stop', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

        user.followMe.isActive = false;
        user.followMe.sharingWith = [];
        await user.save();

        res.json({ ok: true, stopped: true });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// ---------------- Update Location ---------------- //

// POST /api/location/update
router.post('/update', auth, async (req, res) => {
    try {
        const { lat, lng, accuracy } = req.body;
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return res.status(400).json({ ok: false, error: 'lat and lng required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

        user.followMe.lastLocation = {
            type: 'Point',
            coordinates: [lng, lat],
            timestamp: new Date()
        };

        await user.save();
        res.json({ ok: true, location: user.followMe.lastLocation });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// ---------------- Get Live Share by Token ---------------- //

// GET /api/location/live-share/:token
router.get('/live-share/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ 'followMe.sharingWith.token': token, 'followMe.isActive': true });

        if (!user) return res.status(404).json({ ok: false, error: 'Invalid or inactive token' });

        const share = user.followMe.sharingWith.find(s => s.token === token);
        if (share.expiresAt && share.expiresAt < new Date()) {
            return res.status(410).json({ ok: false, error: 'Share expired' });
        }

        res.json({ ok: true, userId: user._id, location: user.followMe.lastLocation, token });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// ---------------- Nearby Users ---------------- //

// GET /api/location/nearby-users?lat=&lng=&radius=
router.get('/nearby-users', auth, async (req, res) => {
    try {
        const { lat, lng, radius = 1000 } = req.query;
        if (!lat || !lng) return res.status(400).json({ ok: false, error: 'lat and lng required' });

        const nearbyUsers = await User.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                    distanceField: "distance",
                    spherical: true,
                    maxDistance: parseFloat(radius),
                    query: { 'followMe.isActive': true }
                }
            },
            { $project: { name: 1, role: 1, followMe: 1, distance: 1 } }
        ]);

        res.json({ ok: true, nearbyUsers });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// ---------------- Google Maps API ---------------- //

// GET /api/location/geocode?address=
router.get('/geocode', async (req, res) => {
    try {
        const { address } = req.query;
        if (!address) return res.status(400).json({ ok: false, error: 'address required' });

        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${config.GOOGLE_API_KEY}`);
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const r = data.results[0];
            res.json({ ok: true, location: { lat: r.geometry.location.lat, lng: r.geometry.location.lng, formattedAddress: r.formatted_address } });
        } else {
            res.status(404).json({ ok: false, error: 'Address not found' });
        }
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// GET /api/location/reverse-geocode?lat=&lng=
router.get('/reverse-geocode', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ ok: false, error: 'lat and lng required' });

        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${config.GOOGLE_API_KEY}`);
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const r = data.results[0];
            res.json({ ok: true, address: r.formatted_address, components: r.address_components });
        } else {
            res.status(404).json({ ok: false, error: 'Location not found' });
        }
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// GET /api/location/directions?origin=&destination=&mode=
router.get('/directions', async (req, res) => {
    try {
        const { origin, destination, mode = 'walking' } = req.query;
        if (!origin || !destination) return res.status(400).json({ ok: false, error: 'origin and destination required' });

        const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&key=${config.GOOGLE_API_KEY}`);
        const data = await response.json();

        if (data.status === 'OK' && data.routes.length > 0) {
            const r = data.routes[0];
            res.json({ ok: true, route: { summary: r.summary, distance: r.legs[0].distance, duration: r.legs[0].duration, steps: r.legs[0].steps } });
        } else {
            res.status(404).json({ ok: false, error: 'Route not found' });
        }
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// ---------------- Alerts ---------------- //

// GET /api/location/alerts
router.get('/alerts', async (req, res) => {
    try {
        // You can later move alerts to MongoDB collection if needed
        res.json({ ok: true, items: [] });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

export default router;
