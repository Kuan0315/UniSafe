import { Router } from 'express';
import { z } from 'zod';
import { requireRole } from '../middleware/auth';
import Notification from '../models/Notification';
import User from '../models/User';

// Reuse existing JS model for safety alerts
// eslint-disable-next-line @typescript-eslint/no-var-requires
import SafetyAlert from '../models/SafetyAlert';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(['critical', 'warning', 'info']),
  priority: z.enum(['high', 'medium', 'low']),
  category: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
});

// List active safety alerts (any authenticated user could consume; keep simple here)
router.get('/', async (_req, res) => {
  const alerts = await SafetyAlert.find({ isActive: true }).sort({ createdAt: -1 }).limit(100);
  res.json(alerts);
});

// Staff create safety alert and notify students
router.post('/', requireRole(['staff', 'security', 'admin']), async (req, res) => {
  try {
    const data = createSchema.parse(req.body);

    const alert = await SafetyAlert.create({
      title: data.title,
      message: data.message,
      type: data.type,
      priority: data.priority,
      category: data.category,
      createdBy: req.auth!.userId,
      isActive: true,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    // Notify all students (could be optimized with topic push in production)
    const students = await User.find({ role: 'student' }).select('_id');
    const notifications = students.map((s: any) => ({
      recipientId: s._id,
      senderId: req.auth!.userId as any,
      // Reuse existing notification types to avoid frontend enum changes
      type: 'check_in_reminder' as any,
      title: `Safety Alert: ${data.title}`,
      message: data.message,
      data: { priority: data.priority, category: data.category, type: data.type },
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(alert);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;


