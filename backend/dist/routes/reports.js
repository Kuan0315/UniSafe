"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/reports.ts
const express_1 = require("express");
const zod_1 = require("zod");
const Report_1 = __importDefault(require("../models/Report"));
const auth_1 = require("../middleware/auth");
const mongoose_1 = require("mongoose");
const router = (0, express_1.Router)();
const createSchema = zod_1.z.object({
    type: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    location: zod_1.z.string().min(1),
    time: zod_1.z.coerce.date(),
    anonymous: zod_1.z.boolean().default(false),
    media: zod_1.z.array(zod_1.z.object({ uri: zod_1.z.string().url().or(zod_1.z.string().min(1)), type: zod_1.z.enum(['image', 'video']) })).default([]),
});
router.get('/', async (_req, res) => {
    const items = await Report_1.default.find().sort({ createdAt: -1 }).limit(200);
    res.json(items);
});
router.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        const data = createSchema.parse(req.body);
        const created = await Report_1.default.create({ ...data, userId: req.auth.userId });
        res.status(201).json(created);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.post('/:id/upvote', auth_1.requireAuth, async (req, res) => {
    const id = req.params.id;
    const userId = new mongoose_1.Types.ObjectId(req.auth.userId);
    const report = await Report_1.default.findById(id);
    if (!report)
        return res.status(404).json({ error: 'Not found' });
    const has = report.upvotedBy.some(u => u.equals(userId));
    if (has) {
        report.upvotedBy = report.upvotedBy.filter(u => !u.equals(userId));
        report.upvotes = Math.max(0, (report.upvotes || 0) - 1);
    }
    else {
        report.upvotedBy.push(userId);
        report.upvotes = (report.upvotes || 0) + 1;
    }
    await report.save();
    res.json({ upvotes: report.upvotes, isUpvoted: !has });
});
router.post('/:id/comments', auth_1.requireAuth, async (req, res) => {
    const id = req.params.id;
    const { text, anonymous } = req.body;
    const report = await Report_1.default.findById(id);
    if (!report)
        return res.status(404).json({ error: 'Not found' });
    const comment = {
        id: new mongoose_1.Types.ObjectId().toString(),
        userId: new mongoose_1.Types.ObjectId(req.auth.userId),
        author: anonymous ? 'Anonymous' : 'You',
        text,
        time: new Date(),
        anonymous: !!anonymous,
        liked: false,
        likes: 0,
        replies: [],
    };
    report.comments.push(comment);
    await report.save();
    res.status(201).json(comment);
});
router.post('/:id/comments/:commentId/replies', auth_1.requireAuth, async (req, res) => {
    const id = req.params.id;
    const commentId = req.params.commentId;
    const { text, anonymous } = req.body;
    const report = await Report_1.default.findById(id);
    if (!report)
        return res.status(404).json({ error: 'Not found' });
    const comment = report.comments.find(c => c.id === commentId);
    if (!comment)
        return res.status(404).json({ error: 'Comment not found' });
    const reply = {
        id: new mongoose_1.Types.ObjectId().toString(),
        userId: new mongoose_1.Types.ObjectId(req.auth.userId),
        author: anonymous ? 'Anonymous' : 'You',
        text,
        time: new Date(),
        anonymous: !!anonymous,
    };
    comment.replies = comment.replies || [];
    comment.replies.push(reply);
    await report.save();
    res.status(201).json(reply);
});
exports.default = router;
