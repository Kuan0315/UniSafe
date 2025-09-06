// routes/notifications.js
import express from 'express';
import { auth } from '../middleware/auth.js';
import {
    createNotification,
    getUserNotifications,
    markAsRead,
    deleteNotification,
    getNotificationStats
} from '../controllers/notificationController.js';

const router = express.Router();

// Get notifications for a specific user
router.get('/user/:userId', auth, getUserNotifications);

// Mark a notification as read
router.put('/:id/read', auth, markAsRead);

// Delete a notification
router.delete('/:id', auth, deleteNotification);

// Create/send notification
router.post('/', auth, createNotification);

// Get notification statistics
router.get('/stats', auth, getNotificationStats);

export default router;
