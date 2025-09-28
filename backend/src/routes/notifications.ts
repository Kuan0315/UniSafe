import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import Notification from '../models/Notification';
import User from '../models/User';
import GuardianSession from '../models/GuardianSession';

const router = Router();

router.use(requireAuth);

// Get notifications for the authenticated user (guardian)
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      recipientId: req.auth!.userId 
    })
    .populate('senderId', 'name email')
    .populate('sessionId')
    .sort({ createdAt: -1 })
    .limit(50);

    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread notifications count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipientId: req.auth!.userId,
      isRead: false 
    });
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: req.params.id, 
        recipientId: req.auth!.userId 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany(
      { 
        recipientId: req.auth!.userId,
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create notification (for internal use - when student starts guardian mode)
router.post('/', async (req, res) => {
  try {
    const {
      recipientId,
      senderId,
      sessionId,
      type,
      title,
      message,
      location,
      destination,
      data
    } = req.body;

    const notification = await Notification.create({
      recipientId,
      senderId,
      sessionId,
      type,
      title,
      message,
      location,
      destination,
      data
    });

    // Populate the created notification
    await notification.populate([
      { path: 'senderId', select: 'name email' },
      { path: 'sessionId' }
    ]);

    res.status(201).json(notification);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
