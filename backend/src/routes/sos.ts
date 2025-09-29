import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import Notification from '../models/Notification';
import User from '../models/User';
import Alert from '../models/Alert';

const router = Router();

// Student creates SOS alert
router.post('/', requireRole(['student']), async (req, res) => {
  try {
    const { message, latitude, longitude } = req.body as {
      message?: string;
      latitude?: number;
      longitude?: number;
    };
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }
    const alert = await Alert.create({
      userId: req.auth!.userId,
      type: 'HELP',
      recipient: 'security',
      message: message || 'SOS activated',
      latitude,
      longitude,
      handled: false,
    });

    // Notify all staff/security users
    const staffUsers = await User.find({ role: { $in: ['staff', 'security'] } }).select('_id');
    if (staffUsers.length > 0) {
      const notifs = staffUsers.map(s => ({
        recipientId: s._id,
        senderId: req.auth!.userId as any,
        type: 'check_in_reminder' as any,
        title: 'SOS Alert',
        message: 'A student has activated SOS. Open staff tab to view.',
        location: { latitude, longitude },
      }));
      await Notification.insertMany(notifs);
    }
    return res.status(201).json(alert);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create SOS' });
  }
});

// Staff list unhandled SOS alerts (most recent first)
router.get('/', requireRole(['staff', 'security']), async (_req, res) => {
  try {
    const alerts = await Alert.find({ handled: false })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json(alerts);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to load SOS' });
  }
});

// Staff mark an alert handled
router.patch('/:id/handle', requireRole(['staff', 'security']), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { handled: true },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'SOS not found' });
    return res.json(alert);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update SOS' });
  }
});

// Staff view all (optional filter)
router.get('/all', requireRole(['staff', 'security']), async (req, res) => {
  try {
    const { handled } = req.query as { handled?: string };
    const filter: any = {};
    if (handled === 'true') filter.handled = true; else if (handled === 'false') filter.handled = false;
    const alerts = await Alert.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(500);
    return res.json(alerts);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to load SOS' });
  }
});

export default router;


