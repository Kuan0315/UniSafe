"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const LocationUpdate_1 = __importDefault(require("../models/LocationUpdate"));
const GuardianSession_1 = __importDefault(require("../models/GuardianSession"));
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
const updateSchema = zod_1.z.object({
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
    accuracy: zod_1.z.number().optional(),
    heading: zod_1.z.number().optional(),
    speed: zod_1.z.number().optional(),
    timestamp: zod_1.z.coerce.date(),
    isEmergency: zod_1.z.boolean().default(false),
});
router.post('/share', async (req, res) => {
    try {
        const data = updateSchema.parse(req.body);
        const active = await GuardianSession_1.default.findOne({ userId: req.auth.userId, isActive: true });
        const created = await LocationUpdate_1.default.create({
            userId: req.auth.userId,
            sessionId: active?._id,
            ...data,
        });
        res.status(201).json(created);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.get('/history', async (req, res) => {
    const start = new Date(req.query.start);
    const end = new Date(req.query.end);
    const items = await LocationUpdate_1.default.find({
        userId: req.auth.userId,
        timestamp: { $gte: start, $lte: end },
    }).sort({ timestamp: -1 }).limit(1000);
    res.json(items);
});
exports.default = router;
