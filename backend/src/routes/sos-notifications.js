import { Router } from 'express';
import SOSNotification from '../models/SOSNotification.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get notifications by recipient type
router.get('/:recipientType', requireAuth, async (req, res) => {
    try {
        const { recipientType } = req.params;
        const { isRead, page = 1, limit = 20 } = req.query;

        const filter = {
            recipientId: req.auth.userId,
            recipientType
        };

        if (isRead !== undefined) {
            filter.isRead = isRead === 'true';
        }

        const notifications = await SOSNotification.find(filter)
            .populate('sosReportId')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await SOSNotification.countDocuments(filter);
        const unreadCount = await SOSNotification.countDocuments({
            ...filter,
            isRead: false
        });

        res.json({
            notifications,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching SOS notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.patch('/:id/read', requireAuth, async (req, res) => {
    try {
        const notification = await SOSNotification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipientId: req.auth.userId
            },
            {
                isRead: true,
                readAt: new Date()
            },
            { new: true }
        ).populate('sosReportId');

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Mark all notifications as read
router.patch('/mark-all-read/:recipientType', requireAuth, async (req, res) => {
    try {
        const { recipientType } = req.params;

        await SOSNotification.updateMany(
            {
                recipientId: req.auth.userId,
                recipientType,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

// Get unread counts by recipient type
router.get('/unread-counts/:recipientType', requireAuth, async (req, res) => {
    try {
        const { recipientType } = req.params;

        const criticalCount = await SOSNotification.countDocuments({
            recipientId: req.auth.userId,
            recipientType,
            isRead: false,
            priority: 'critical'
        });

        const highCount = await SOSNotification.countDocuments({
            recipientId: req.auth.userId,
            recipientType,
            isRead: false,
            priority: 'high'
        });

        const totalCount = await SOSNotification.countDocuments({
            recipientId: req.auth.userId,
            recipientType,
            isRead: false
        });

        res.json({
            critical: criticalCount,
            high: highCount,
            total: totalCount
        });
    } catch (error) {
        console.error('Error fetching unread counts:', error);
        res.status(500).json({ error: 'Failed to fetch unread counts' });
    }
});

export default router;