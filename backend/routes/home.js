import express from 'express';
import { auth } from '../middleware/auth.js';
import { getHomeData, getSafetyAlerts } from '../controllers/homeController.js';

const router = express.Router();

// Get home dashboard data
router.get('/dashboard', auth, getHomeData);

// Get safety alerts with filtering
router.get('/safety-alerts', auth, getSafetyAlerts);

// Create safety alert (admin/security only)
router.post('/safety-alerts', auth, async (req, res) => {
    try {
        const SafetyAlert = (await import('../models/SafetyAlert.js')).default;
        const { type, title, description, location, severity, targetAudience, areas, coordinates } = req.body;

        const alert = new SafetyAlert({
            type,
            title,
            description,
            location,
            severity,
            targetAudience: targetAudience || 'all',
            areas: areas || [],
            coordinates,
            createdBy: req.user.id
        });

        await alert.save();

        // Emit real-time alert
        const io = req.app.get('io');
        io.emit('new-safety-alert', {
            id: alert._id,
            type: alert.type,
            title: alert.title,
            description: alert.description,
            location: alert.location,
            severity: alert.severity,
            createdAt: alert.createdAt
        });

        res.status(201).json({
            success: true,
            message: 'Safety alert created successfully',
            data: alert
        });

    } catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating safety alert',
            error: error.message
        });
    }
});

// Get emergency contacts for user
router.get('/emergency-contacts', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('emergencyContacts', 'name phone email relationship');

        res.json({
            success: true,
            data: user.emergencyContacts
        });
    } catch (error) {
        console.error('Emergency contacts error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching emergency contacts',
            error: error.message
        });
    }
});

export default router;