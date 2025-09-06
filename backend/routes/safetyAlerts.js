import express from 'express';
import { auth } from '../middleware/auth.js';
import {
    reportAlert,
    getNearbyAlerts,
    getAllAlerts,
    updateAlertStatus,
    getAlertStats
} from '../controllers/safetyAlertController.js';

const router = express.Router();

// Report a safety alert
router.post('/report', auth, reportAlert);

// Get nearby safety alerts
router.get('/nearby', auth, getNearbyAlerts);

// Get all alerts (admin/security only)
router.get('/all', auth, getAllAlerts);

// Update alert status (admin/security only)
router.put('/:alertId/status', auth, updateAlertStatus);

// Get alert statistics (admin/security only)
router.get('/stats', auth, getAlertStats);

export default router;
