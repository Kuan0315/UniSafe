import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import Contact from '../models/Contact';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const contacts = await Contact.find({ userId: req.auth!.userId }).sort({ createdAt: -1 });
  res.json(contacts);
});

const upsertSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(3),
  relationship: z.string().min(1),
});

router.post('/', async (req, res) => {
  try {
    const data = upsertSchema.parse(req.body);
    const created = await Contact.create({ ...data, userId: req.auth!.userId });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  await Contact.deleteOne({ _id: id, userId: req.auth!.userId });
  res.json({ success: true });
});

export default router;

