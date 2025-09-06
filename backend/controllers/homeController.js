import Incident from '../models/Incident.js';
import SOSAlert from '../models/SOSAlert.js';
import SafetyAlert from '../models/SafetyAlert.js';
import User from '../models/User.js';

// Get home dashboard data
export const getHomeData = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user info
        const user = await User.findById(userId).select('name emergencyContacts');

        // Get recent safety alerts (last 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const safetyAlerts = await SafetyAlert.find({
            createdAt: { $gte: twentyFourHoursAgo },
            $or: [
                { targetAudience: 'all' },
                { targetAudience: userId },
                { targetAudience: { $in: ['student', req.user.role] } }
            ]
        })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get recent incidents near user (last 48 hours)
        const recentIncidents = await Incident.find({
            createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
            status: { $in: ['Pending', 'Under Review', 'In Progress'] }
        })
            .populate('reportedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(3);

        // Get active SOS alerts
        const activeSOS = await SOSAlert.find({
            status: 'active',
            createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Last 2 hours
        })
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .limit(2);

        // Format response
        const response = {
            user: {
                name: user.name,
                greeting: getTimeBasedGreeting()
            },
            safetyAlerts: safetyAlerts.map(alert => ({
                id: alert._id,
                type: alert.type,
                title: alert.title,
                description: alert.description,
                location: alert.location,
                severity: alert.severity,
                createdAt: alert.createdAt,
                timeAgo: getTimeAgo(alert.createdAt),
                createdBy: alert.createdBy?.name || 'System'
            })),
            recentIncidents: recentIncidents.map(incident => ({
                id: incident._id,
                type: incident.type,
                description: incident.description.substring(0, 100) + '...',
                location: incident.location,
                status: incident.status,
                createdAt: incident.createdAt,
                timeAgo: getTimeAgo(incident.createdAt),
                reportedBy: incident.reportedBy?.name || 'Anonymous'
            })),
            activeSOS: activeSOS.map(sos => ({
                id: sos._id,
                userName: sos.user.name,
                location: sos.address,
                timeAgo: getTimeAgo(sos.createdAt),
                severity: sos.severity
            })),
            stats: {
                totalAlerts: safetyAlerts.length,
                activeIncidents: recentIncidents.length,
                activeSOS: activeSOS.length
            }
        };

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Home data error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching home data',
            error: error.message
        });
    }
};

// Get safety alerts with pagination
export const getSafetyAlerts = async (req, res) => {
    try {
        const { page = 1, limit = 10, type } = req.query;
        const skip = (page - 1) * limit;

        let filter = {
            $or: [
                { targetAudience: 'all' },
                { targetAudience: req.user.id },
                { targetAudience: { $in: ['student', req.user.role] } }
            ]
        };

        if (type) {
            filter.type = type;
        }

        const alerts = await SafetyAlert.find(filter)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await SafetyAlert.countDocuments(filter);

        res.json({
            success: true,
            data: {
                alerts: alerts.map(alert => ({
                    id: alert._id,
                    type: alert.type,
                    title: alert.title,
                    description: alert.description,
                    location: alert.location,
                    severity: alert.severity,
                    createdAt: alert.createdAt,
                    timeAgo: getTimeAgo(alert.createdAt),
                    createdBy: alert.createdBy?.name || 'System'
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Safety alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching safety alerts',
            error: error.message
        });
    }
};

// Helper functions
function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
}