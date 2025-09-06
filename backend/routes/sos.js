// routes/sos.js
import express from 'express';
import {
    sendAlert,
    getAllAlerts,
    resolveAlert,
    getAlert,
    triggerSOS,
    getSOSAlerts,
    updateSOSStatus,
    getSOSStats
} from '../controllers/sosController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadMedia } from '../middleware/upload.js';
import SOSAlert from '../models/SOSAlert.js';

const router = express.Router();

// All routes require authentication by default
router.use(authenticate);

// Authenticated SOS trigger (requires user login)
router.post('/alert', sendAlert);

// Emergency trigger (with media upload)
router.post('/trigger', uploadMedia('media'), triggerSOS);

// Get all SOS alerts for logged-in user
router.get('/alerts', getSOSAlerts);

// Update SOS status (security/admin only)
router.put('/:id/status', authorize('security', 'admin'), updateSOSStatus);

// Get SOS statistics (security/admin only)
router.get('/stats', authorize('security', 'admin'), getSOSStats);

// Staff-only routes
router.get('/all-alerts', authorize('security', 'admin', 'teacher'), getAllAlerts);
router.get('/alerts/:id', authorize('security', 'admin', 'teacher'), getAlert);
router.patch('/alerts/:id/resolve', authorize('security', 'admin', 'teacher'), resolveAlert);

// Get user's SOS history
router.get('/history', async (req, res) => {
    try {
        const alerts = await SOSAlert.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            alerts
        });
    } catch (error) {
        console.error('Error fetching SOS history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching SOS history',
            error: error.message
        });
    }
});

export default router;
