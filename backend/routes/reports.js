import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { readDB, writeDB } from '../db.js';

const router = Router();

// Ensure uploads folder exists
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 25);
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${Date.now()}_${nanoid(8)}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image/video files are allowed.'));
    }
  },
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 }
});

// POST /api/reports
// fields: category, description, userName (optional), attachments[] (image/video)
router.post('/', upload.array('attachments', 5), async (req, res) => {
  try {
    const { category, description, userName } = req.body;
    if (!category || !description) {
      return res.status(400).json({ ok: false, error: 'category and description are required' });
    }
    const files = (req.files || []).map(f => ({
      filename: f.filename,
      url: `/uploads/${f.filename}`,
      mimetype: f.mimetype,
      size: f.size
    }));
    const db = await readDB();
    const report = {
      id: nanoid(12),
      category,
      description,
      userName: userName || 'anonymous',
      attachments: files,
      createdAt: new Date().toISOString()
    };
    db.reports.push(report);
    await writeDB(db);
    res.json({ ok: true, report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || 'Upload failed' });
  }
});

// GET /api/reports (list, newest first)
router.get('/', async (req, res) => {
  const db = await readDB();
  const items = [...db.reports].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ ok: true, items });
});

export default router;
