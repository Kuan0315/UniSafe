"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const GuardianSession_1 = __importDefault(require("../models/GuardianSession"));
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
const Contact_1 = __importDefault(require("../models/Contact"));
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get('/active', async (req, res) => {
    const session = await GuardianSession_1.default.findOne({ userId: req.auth.userId, isActive: true });
    res.json(session || null);
});
const startSchema = zod_1.z.object({
    destination: zod_1.z.string().min(1),
    estimatedArrival: zod_1.z.coerce.date(),
    route: zod_1.z.array(zod_1.z.object({ latitude: zod_1.z.number(), longitude: zod_1.z.number() })).default([]),
    trustedContacts: zod_1.z.array(zod_1.z.string()).default([]),
    checkInIntervalMinutes: zod_1.z.number().min(1).max(120).default(5),
});
router.post('/start', async (req, res) => {
    try {
        // End any existing active session
        await GuardianSession_1.default.updateMany({ userId: req.auth.userId, isActive: true }, { isActive: false });
        const data = startSchema.parse(req.body);
        // Get current user info
        const user = await User_1.default.findById(req.auth.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const created = await GuardianSession_1.default.create({
            userId: req.auth.userId,
            destination: data.destination,
            estimatedArrival: data.estimatedArrival,
            route: data.route,
            trustedContacts: data.trustedContacts,
            checkInIntervalMinutes: data.checkInIntervalMinutes,
        });
        // Send notifications to trusted contacts (guardians)
        if (data.trustedContacts && data.trustedContacts.length > 0) {
            const contacts = await Contact_1.default.find({ _id: { $in: data.trustedContacts } });
            for (const contact of contacts) {
                // Find guardian user by phone number or email
                const guardianUser = await User_1.default.findOne({
                    $or: [
                        { email: contact.phone }, // Assuming phone could be email
                        { name: { $regex: contact.name, $options: 'i' } }
                    ],
                    role: 'guardian'
                });
                if (guardianUser) {
                    const startLocation = data.route.length > 0 ? data.route[0] : undefined;
                    const mapUrl = startLocation
                        ? `https://www.google.com/maps/search/?api=1&query=${startLocation.latitude},${startLocation.longitude}`
                        : undefined;
                    await Notification_1.default.create({
                        recipientId: guardianUser._id,
                        senderId: req.auth.userId,
                        sessionId: created._id,
                        type: 'guardian_mode_started',
                        title: 'Guardian Mode Started',
                        message: `${user.name} has started Guardian Mode and is traveling to ${data.destination}. You can monitor their journey.`,
                        location: startLocation ? {
                            latitude: startLocation.latitude,
                            longitude: startLocation.longitude
                        } : undefined,
                        destination: data.destination,
                        mapUrl,
                        data: {
                            route: data.route,
                            estimatedArrival: data.estimatedArrival,
                            checkInInterval: data.checkInIntervalMinutes
                        }
                    });
                }
            }
        }
        res.status(201).json(created);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.post('/end', async (req, res) => {
    await GuardianSession_1.default.updateMany({ userId: req.auth.userId, isActive: true }, { isActive: false });
    res.json({ success: true });
});
router.post('/checkin', async (req, res) => {
    const session = await GuardianSession_1.default.findOne({ userId: req.auth.userId, isActive: true });
    if (!session)
        return res.status(404).json({ error: 'No active session' });
    session.lastCheckInAt = new Date();
    await session.save();
    res.json({ success: true });
});
// Update location during guardian mode
router.post('/location', async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;
        const session = await GuardianSession_1.default.findOne({ userId: req.auth.userId, isActive: true });
        if (!session) {
            return res.status(404).json({ error: 'No active session' });
        }
        // Update session route with new location
        session.route.push({ latitude, longitude });
        await session.save();
        // Send location update notifications to guardians
        const contacts = await Contact_1.default.find({ _id: { $in: session.trustedContacts } });
        const user = await User_1.default.findById(req.auth.userId);
        for (const contact of contacts) {
            const guardianUser = await User_1.default.findOne({
                $or: [
                    { email: contact.phone },
                    { name: { $regex: contact.name, $options: 'i' } }
                ],
                role: 'guardian'
            });
            if (guardianUser) {
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
                await Notification_1.default.create({
                    recipientId: guardianUser._id,
                    senderId: req.auth.userId,
                    sessionId: session._id,
                    type: 'location_update',
                    title: 'Location Update',
                    message: `${user?.name} has updated their location while traveling to ${session.destination}.`,
                    location: {
                        latitude,
                        longitude,
                        address
                    },
                    destination: session.destination,
                    mapUrl,
                    data: {
                        route: session.route,
                        estimatedArrival: session.estimatedArrival
                    }
                });
            }
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.default = router;
