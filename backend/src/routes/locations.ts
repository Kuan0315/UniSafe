import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import LocationUpdate from '../models/LocationUpdate';
import GuardianSession from '../models/GuardianSession';

const router = Router();

router.use(requireAuth);

const updateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  heading: z.number().optional(),
  speed: z.number().optional(),
  timestamp: z.coerce.date(),
  isEmergency: z.boolean().default(false),
});

router.post('/share', async (req, res) => {
  try {
    const data = updateSchema.parse(req.body);
    const active = await GuardianSession.findOne({ userId: req.auth!.userId, isActive: true });
    const created = await LocationUpdate.create({
      userId: req.auth!.userId,
      sessionId: active?._id,
      ...data,
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/history', async (req, res) => {
  const start = new Date(req.query.start as string);
  const end = new Date(req.query.end as string);
  const items = await LocationUpdate.find({
    userId: req.auth!.userId,
    timestamp: { $gte: start, $lte: end },
  }).sort({ timestamp: -1 }).limit(1000);
  res.json(items);
});

export default router;

