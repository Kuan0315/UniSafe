"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const GuardianSession_1 = __importDefault(require("../models/GuardianSession"));
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
        const created = await GuardianSession_1.default.create({
            userId: req.auth.userId,
            destination: data.destination,
            estimatedArrival: data.estimatedArrival,
            route: data.route,
            trustedContacts: data.trustedContacts,
            checkInIntervalMinutes: data.checkInIntervalMinutes,
        });
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
exports.default = router;
