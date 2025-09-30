"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
const Alert_1 = require("../models/Alert");
const router = (0, express_1.Router)();
const createSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    message: zod_1.z.string().min(1),
    type: zod_1.z.enum(['critical', 'warning', 'info']),
    priority: zod_1.z.enum(['high', 'medium', 'low']),
    category: zod_1.z.string().min(1),
    expiresAt: zod_1.z.string().datetime().optional(),
});
// List active safety alerts (any authenticated user could consume; keep simple here)
router.get('/', async (_req, res) => {
    const alerts = await Alert_1.Alert.find({ status: 'Active' }).sort({ createdAt: -1 }).limit(100);
    res.json(alerts);
});
// Staff create safety alert and notify students
router.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        const data = createSchema.parse(req.body);
        const alert = await Alert_1.Alert.create({
            type: data.type,
            title: data.title,
            message: data.message,
            status: 'Active',
        });
        // Notify all students (could be optimized with topic push in production)
        const students = await User_1.default.find({ role: 'student' }).select('_id');
        const notifications = students.map((s) => ({
            recipientId: s._id,
            senderId: req.auth.userId,
            // Reuse existing notification types to avoid frontend enum changes
            type: 'check_in_reminder',
            title: `Safety Alert: ${data.title}`,
            message: data.message,
            data: { priority: data.priority, category: data.category, type: data.type },
        }));
        if (notifications.length > 0) {
            await Notification_1.default.insertMany(notifications);
        }
        res.status(201).json(alert);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.default = router;
