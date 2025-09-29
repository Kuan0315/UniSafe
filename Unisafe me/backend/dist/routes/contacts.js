"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const Contact_1 = __importDefault(require("../models/Contact"));
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get('/', async (req, res) => {
    const contacts = await Contact_1.default.find({ userId: req.auth.userId }).sort({ createdAt: -1 });
    res.json(contacts);
});
const upsertSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(3),
    relationship: zod_1.z.string().min(1),
});
router.post('/', async (req, res) => {
    try {
        const data = upsertSchema.parse(req.body);
        const created = await Contact_1.default.create({ ...data, userId: req.auth.userId });
        res.status(201).json(created);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    await Contact_1.default.deleteOne({ _id: id, userId: req.auth.userId });
    res.json({ success: true });
});
exports.default = router;
