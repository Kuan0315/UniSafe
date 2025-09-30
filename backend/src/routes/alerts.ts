import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import GuardianSession from '../models/GuardianSession';

const router = Router();

router.use(requireAuth);

router.get('/active', async (req, res) => {
  const session = await GuardianSession.findOne({ userId: req.auth!.userId, isActive: true });
  res.json(session || null);
});

const startSchema = z.object({
  destination: z.string().min(1),
  estimatedArrival: z.coerce.date(),
  route: z.array(z.object({ latitude: z.number(), longitude: z.number() })).default([]),
  trustedContacts: z.array(z.string()).default([]),
  checkInIntervalMinutes: z.number().min(1).max(120).default(5),
});

router.post('/start', async (req, res) => {
  try {
    // End any existing active session
    await GuardianSession.updateMany({ userId: req.auth!.userId, isActive: true }, { isActive: false });
    const data = startSchema.parse(req.body);
    const created = await GuardianSession.create({
      userId: req.auth!.userId,
      destination: data.destination,
      estimatedArrival: data.estimatedArrival,
      route: data.route,
      trustedContacts: data.trustedContacts,
      checkInIntervalMinutes: data.checkInIntervalMinutes,
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/end', async (req, res) => {
  await GuardianSession.updateMany({ userId: req.auth!.userId, isActive: true }, { isActive: false });
  res.json({ success: true });
});

router.post('/checkin', async (req, res) => {
  const session = await GuardianSession.findOne({ userId: req.auth!.userId, isActive: true });
  if (!session) return res.status(404).json({ error: 'No active session' });
  session.lastCheckInAt = new Date();
  await session.save();
  res.json({ success: true });
});

export default router;