import Incident from '../models/Incident.js';
import { sendEmail } from '../services/emailService.js';
import { sendPushNotification } from '../services/pushService.js';
import { INCIDENT_TYPES } from '../config/constants.js';

export const reportIncident = async (req, res) => {
    try {
        const { type, title, description, location, isAnonymous, media } = req.body;
        const userId = req.user.id;

        const incident = new Incident({
            reporter: isAnonymous ? null : userId,
            type,
            title,
            description,
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat],
                address: location.address,
                building: location.building,
                floor: location.floor
            },
            isAnonymous,
            media,
            severity: calculateSeverity(type, description)
        });

        await incident.save();

        if (!isAnonymous) {
            await incident.populate('reporter', 'name email');
        }

        // Notify security personnel about the incident
        const securityPersonnel = await User.find({ role: 'security' });
        const notificationPromises = securityPersonnel.map(security => {
            const notification = {
                title: 'New Incident Reported',
                body: `A new ${type} incident has been reported${!isAnonymous ? ` by ${req.user.name}` : ' anonymously'}`,
                data: {
                    type: 'incident',
                    incidentId: incident._id.toString()
                }
            };
            return sendPushNotification(security, notification);
        });

        await Promise.allSettled(notificationPromises);

        res.status(201).json({
            success: true,
            message: 'Incident reported successfully',
            data: incident
        });
    } catch (error) {
        console.error('Report incident error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error reporting incident'
        });
    }
};

export const getIncidents = async (req, res) => {
    try {
        const { type, status, page = 1, limit = 10, timeframe } = req.query;
        const query = {};

        if (type) {
            query.type = type;
        }

        if (status) {
            query.status = status;
        }

        if (timeframe) {
            const timeFilter = new Date();
            switch (timeframe) {
                case '24h':
                    timeFilter.setHours(timeFilter.getHours() - 24);
                    break;
                case '7d':
                    timeFilter.setDate(timeFilter.getDate() - 7);
                    break;
                case '30d':
                    timeFilter.setDate(timeFilter.getDate() - 30);
                    break;
            }
            query.createdAt = { $gte: timeFilter };
        }

        // Regular users can only see their own incidents or public resolved ones
        if (req.user.role !== 'security' && req.user.role !== 'admin') {
            query.$or = [
                { reporter: req.user.id },
                { status: 'resolved', isAnonymous: false }
            ];
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: 'reporter assignedTo',
            select: 'name email'
        };

        const incidents = await Incident.paginate(query, options);

        res.json({
            success: true,
            data: incidents
        });
    } catch (error) {
        console.error('Get incidents error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching incidents'
        });
    }
};

export const getIncident = async (req, res) => {
    try {
        const { id } = req.params;

        const incident = await Incident.findById(id)
            .populate('reporter', 'name email')
            .populate('assignedTo', 'name email')
            .populate('resolvedBy', 'name email');

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        // Check permissions
        if (req.user.role !== 'security' && req.user.role !== 'admin' &&
            (!incident.reporter || incident.reporter._id.toString() !== req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this incident'
            });
        }

        res.json({
            success: true,
            data: incident
        });
    } catch (error) {
        console.error('Get incident error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching incident'
        });
    }
};

export const updateIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assignedTo, severity } = req.body;

        const incident = await Incident.findById(id);
        if (!incident) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        // Only security/admin can update incidents
        if (req.user.role !== 'security' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update incidents'
            });
        }

        if (status) incident.status = status;
        if (assignedTo) incident.assignedTo = assignedTo;
        if (severity) incident.severity = severity;

        if (status === 'resolved') {
            incident.resolvedAt = new Date();
            incident.resolvedBy = req.user.id;
        }

        await incident.save();

        res.json({
            success: true,
            message: 'Incident updated successfully',
            data: incident
        });
    } catch (error) {
        console.error('Update incident error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating incident'
        });
    }
};

export const getIncidentStats = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stats = await Incident.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        status: "$status"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.type",
                    byStatus: {
                        $push: {
                            status: "$_id.status",
                            count: "$count"
                        }
                    },
                    total: { $sum: "$count" }
                }
            }
        ]);

        // Get heatmap data (incidents by location)
        const heatmapData = await Incident.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        lat: { $arrayElemAt: ["$location.coordinates", 1] },
                        lng: { $arrayElemAt: ["$location.coordinates", 0] }
                    },
                    count: { $sum: 1 },
                    types: { $push: "$type" }
                }
            },
            {
                $project: {
                    location: {
                        lat: "$_id.lat",
                        lng: "$_id.lng"
                    },
                    count: 1,
                    types: 1,
                    _id: 0
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                byType: stats,
                heatmap: heatmapData
            }
        });
    } catch (error) {
        console.error('Get incident stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching incident statistics'
        });
    }
};

// Helper function to calculate incident severity
function calculateSeverity(type, description) {
    const highSeverityTypes = ['harassment', 'fire', 'medical_emergency'];
    const mediumSeverityTypes = ['theft', 'suspicious_activity'];

    if (highSeverityTypes.includes(type)) return 'high';
    if (mediumSeverityTypes.includes(type)) return 'medium';

    // Check for keywords that might indicate higher severity
    const urgentKeywords = ['emergency', 'urgent', 'help', 'danger', 'attack'];
    if (urgentKeywords.some(keyword => description.toLowerCase().includes(keyword))) {
        return 'high';
    }

    return 'low';
}