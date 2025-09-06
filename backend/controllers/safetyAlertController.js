// controllers/safetyAlertController.js
import SafetyAlert from '../models/SafetyAlert.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// Report a safety alert
export const reportAlert = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            severity,
            latitude,
            longitude,
            address,
            building,
            area,
            isAnonymous,
            isEmergency,
            affectedArea
        } = req.body;

        if (!title || !description || !category || !latitude || !longitude) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const alertData = {
            title,
            description,
            category,
            severity: severity || 'medium',
            location: { latitude, longitude, address, building, area },
            reportedBy: req.user.id,
            isAnonymous: isAnonymous || false,
            isEmergency: isEmergency || false,
            affectedArea: affectedArea || { radius: 1000 }
        };

        const safetyAlert = await SafetyAlert.create(alertData);

        if (!isAnonymous && !user.privacySettings.anonymousMode) {
            await sendNearbyNotifications(safetyAlert, user);
        }

        res.status(201).json({
            success: true,
            alert: {
                id: safetyAlert._id,
                title: safetyAlert.title,
                category: safetyAlert.category,
                severity: safetyAlert.severity,
                status: safetyAlert.status,
                createdAt: safetyAlert.createdAt
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get nearby safety alerts
export const getNearbyAlerts = async (req, res) => {
    try {
        const { latitude, longitude, radius = 5000, limit = 20 } = req.query;
        if (!latitude || !longitude) return res.status(400).json({ success: false, message: 'Location coordinates are required' });

        const alerts = await SafetyAlert.find({
            status: 'active',
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
                    $maxDistance: parseInt(radius)
                }
            }
        })
            .populate('reportedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            alerts: alerts.map(alert => ({
                id: alert._id,
                title: alert.title,
                description: alert.description,
                category: alert.category,
                severity: alert.severity,
                location: alert.location,
                reportedBy: alert.isAnonymous ? 'Anonymous' : alert.reportedBy?.name,
                createdAt: alert.createdAt,
                isEmergency: alert.isEmergency
            }))
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get all alerts (for admin/security)
export const getAllAlerts = async (req, res) => {
    try {
        const { status, category, severity, page = 1, limit = 20 } = req.query;
        const user = await User.findById(req.user.id);
        if (!['security', 'staff'].includes(user.role)) return res.status(403).json({ success: false, message: 'Access denied' });

        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (severity) filter.severity = severity;

        const alerts = await SafetyAlert.find(filter)
            .populate('reportedBy', 'name email phone')
            .populate('resolvedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await SafetyAlert.countDocuments(filter);

        res.status(200).json({
            success: true,
            alerts,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / parseInt(limit)),
                hasNext: parseInt(page) * parseInt(limit) < total
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update alert status (resolve/false alarm)
export const updateAlertStatus = async (req, res) => {
    try {
        const { alertId } = req.params;
        const { status, resolutionNotes } = req.body;

        const user = await User.findById(req.user.id);
        if (!['security', 'staff'].includes(user.role)) return res.status(403).json({ success: false, message: 'Access denied' });

        const alert = await SafetyAlert.findById(alertId);
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

        alert.status = status;
        if (status === 'resolved' || status === 'false_alarm') {
            alert.resolvedBy = req.user.id;
            alert.resolvedAt = new Date();
            alert.resolutionNotes = resolutionNotes;
        }

        await alert.save();

        res.status(200).json({
            success: true,
            alert: {
                id: alert._id,
                status: alert.status,
                resolvedBy: alert.resolvedBy,
                resolvedAt: alert.resolvedAt,
                resolutionNotes: alert.resolutionNotes
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get alert statistics
export const getAlertStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!['security', 'staff'].includes(user.role)) return res.status(403).json({ success: false, message: 'Access denied' });

        const stats = await SafetyAlert.aggregate([
            { $group: { _id: { category: '$category', status: '$status' }, count: { $sum: 1 } } }
        ]);

        const categoryStats = await SafetyAlert.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
                }
            }
        ]);

        res.status(200).json({ success: true, stats, categoryStats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Helper: send notifications to nearby users
async function sendNearbyNotifications(alert, reporter) {
    try {
        const nearbyUsers = await User.find({
            'followMe.currentLocation': {
                $near: {
                    $geometry: { type: 'Point', coordinates: [alert.location.longitude, alert.location.latitude] },
                    $maxDistance: alert.affectedArea.radius
                }
            },
            'preferences.notifications.safetyAlerts': true,
            _id: { $ne: reporter._id }
        });

        const notifications = nearbyUsers.map(user => ({
            recipient: user._id,
            title: `Safety Alert: ${alert.title}`,
            message: `${alert.description} - Location: ${alert.location.address || 'Nearby area'}`,
            type: alert.isEmergency ? 'emergency_broadcast' : 'safety_alert',
            priority: alert.severity === 'critical' ? 'urgent' : 'high',
            category: alert.category,
            data: { alertId: alert._id, location: alert.location }
        }));

        if (notifications.length > 0) await Notification.insertMany(notifications);
    } catch (err) {
        console.error('Error sending nearby notifications:', err);
    }
}
