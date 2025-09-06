// routes/followMe.js
import express from 'express';
import { auth } from '../middleware/auth.js'; // use the updated auth middleware
import {
    startFollowMe,
    updateLocation,
    stopFollowMe,
    getFollowMeStatus,
    getSharedLocation,
    getFollowMeHistory,
    updateSettings
} from '../controllers/followMeController.js';

const router = express.Router();

// Start a Follow Me session
router.post('/start', auth, startFollowMe);

// Update location during Follow Me session
router.patch('/update', auth, updateLocation);

// Stop Follow Me session
router.post('/stop', auth, stopFollowMe);

// Get your Follow Me status
router.get('/status', auth, getFollowMeStatus);

// Get location shared with you
router.get('/shared/:userId', auth, getSharedLocation);

// Get your Follow Me session history
router.get('/history', auth, getFollowMeHistory);

// Update Follow Me settings
router.patch('/settings', auth, updateSettings);

export default router;
