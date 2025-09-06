import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getProfile);
router.put('/', authMiddleware, updateProfile);

export default router;
