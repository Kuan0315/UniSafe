import { Router } from 'express';
import { z } from 'zod';
import Report from '../models/Report.js';
import { requireAuth } from '../middleware/auth.js';
import { Types } from 'mongoose';

const router = Router();

const createSchema = z.object({
    type: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    location: z.string().min(1),
    time: z.coerce.date(),
    anonymous: z.boolean().default(false),
    media: z.array(z.object({
        uri: z.string().min(1),
        type: z.enum(['image', 'video'])
    })).default([]),
});

// List reports with search and sort
router.get('/', async (req, res) => {
    try {
        const { q, sort, type, status, priority } = req.query;
        const userId = req.auth?.userId;

        const filter = {};

        // Search filter
        if (q && q.trim()) {
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { location: { $regex: q, $options: 'i' } },
                { type: { $regex: q, $options: 'i' } },
            ];
        }

        // Type filter
        if (type && type !== 'all') {
            filter.type = type;
        }

        let sortBy = { createdAt: -1 };
        if (sort === 'hottest') sortBy = { upvotes: -1, createdAt: -1 };
        if (sort === 'latest') sortBy = { createdAt: -1 };
        if (sort === 'most_commented') sortBy = { 'comments': -1 };

        const reports = await Report.find(filter).sort(sortBy).limit(200);

        // Add isUpvoted field for each report
        const reportsWithUpvoteState = reports.map(report => ({
            ...report.toObject(),
            isUpvoted: userId ? report.upvotedBy.includes(userId) : false
        }));

        res.json(reportsWithUpvoteState);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// Create report
router.post('/', requireAuth, async (req, res) => {
    try {
        const data = createSchema.parse(req.body);

        const author = data.anonymous ? 'Anonymous' : req.auth.userName || 'User';

        const createdReport = await Report.create({
            ...data,
            userId: req.auth.userId,
            author: author
        });

        res.status(201).json(createdReport);
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(400).json({ error: error.message });
    }
});

// Upvote report
router.post('/:id/upvote', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = new Types.ObjectId(req.auth.userId);

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const hasUpvoted = report.upvotedBy.some(u => u.equals(userId));

        if (hasUpvoted) {
            report.upvotedBy = report.upvotedBy.filter(u => !u.equals(userId));
            report.upvotes = Math.max(0, (report.upvotes || 0) - 1);
        } else {
            report.upvotedBy.push(userId);
            report.upvotes = (report.upvotes || 0) + 1;
        }

        await report.save();

        res.json({
            upvotes: report.upvotes,
            isUpvoted: !hasUpvoted
        });
    } catch (error) {
        console.error('Error upvoting report:', error);
        res.status(500).json({ error: 'Failed to upvote report' });
    }
});

// Add comment
router.post('/:id/comments', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { text, anonymous } = req.body;

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const comment = {
            id: new Types.ObjectId().toString(),
            userId: new Types.ObjectId(req.auth.userId),
            author: anonymous ? 'Anonymous' : req.auth.userName || 'You',
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
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Add reply to comment
router.post('/:id/comments/:commentId/replies', requireAuth, async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const { text, anonymous } = req.body;

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const comment = report.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const reply = {
            id: new Types.ObjectId().toString(),
            userId: new Types.ObjectId(req.auth.userId),
            author: anonymous ? 'Anonymous' : req.auth.userName || 'You',
            text,
            time: new Date(),
            anonymous: !!anonymous,
        };

        comment.replies.push(reply);
        await report.save();

        res.status(201).json(reply);
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({ error: 'Failed to add reply' });
    }
});

export default router;

