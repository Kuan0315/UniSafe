import SOSAlert from '../models/SOSAlert.js';
import User from '../models/User.js';
import notificationService from '../services/notificationService.js';
import { sendEmail } from '../services/emailService.js';
import { sendSMS } from '../services/smsService.js';
import { sendPushNotification } from '../services/pushService.js';

export const sendAlert = async (req, res) => {
    try {
        const { message, summary, severity, coordinates, address, triggeredBy, userId } = req.body;

        const alertUserId = req.user?.id || userId;
        if (!alertUserId) {
            return res.status(400).json({ success: false, message: 'User ID is required for SOS alerts' });
        }

        const sosAlert = new SOSAlert({
            user: alertUserId,
            message: message || 'Emergency SOS activated',
            summary,
            severity: severity || 'high',
            location: { type: 'Point', coordinates: coordinates || [0, 0] },
            address: address || 'Location not available',
            triggeredBy: triggeredBy || 'manual'
        });

        await sosAlert.save();
        await sosAlert.populate('user', 'name phone email emergencyContacts');

        // Background notifications
        setTimeout(async () => {
            try { await performSOSActions(sosAlert); }
            catch (err) { console.error('SOS background actions error:', err); }
        }, 1000);

        const io = req.app.get('io');
        io.to('security').emit('sos-alert', {
            alertId: sosAlert._id,
            user: sosAlert.user,
            location: sosAlert.location,
            address: sosAlert.address,
            severity: sosAlert.severity,
            triggeredAt: sosAlert.createdAt
        });

        res.status(201).json({ success: true, message: 'SOS alert activated', alertId: sosAlert._id });
    } catch (error) {
        console.error('SOS alert error:', error);
        res.status(500).json({ success: false, message: 'Error activating SOS alert', error: error.message });
    }
};

// Get all alerts
export const getAllAlerts = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        let filter = {};
        if (status) filter.status = status;

        const alerts = await SOSAlert.find(filter)
            .populate('user', 'name phone email')
            .populate('handledBy', 'name')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        const total = await SOSAlert.countDocuments(filter);

        res.json({
            success: true,
            alerts,
            pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({ success: false, message: 'Error fetching alerts', error: error.message });
    }
};

// Resolve alert
export const resolveAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const alert = await SOSAlert.findById(id);
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
        if (alert.status === 'resolved') return res.status(400).json({ success: false, message: 'Alert already resolved' });

        await alert.resolve(req.user.id, notes);

        const io = req.app.get('io');
        io.to('security').emit('sos-resolved', { alertId: alert._id, resolvedBy: req.user.name, resolvedAt: alert.resolvedAt });

        res.json({ success: true, message: 'Alert resolved', alert });
    } catch (error) {
        console.error('Resolve alert error:', error);
        res.status(500).json({ success: false, message: 'Error resolving alert', error: error.message });
    }
};

// Get alert by ID
export const getAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await SOSAlert.findById(id)
            .populate('user', 'name phone email emergencyContacts')
            .populate('handledBy', 'name')
            .populate('contacts.contactId', 'name phone email');

        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

        res.json({ success: true, alert });
    } catch (error) {
        console.error('Get alert error:', error);
        res.status(500).json({ success: false, message: 'Error fetching alert', error: error.message });
    }
};

export const triggerSOS = async (req, res) => {
    try {
        const { location, message, media } = req.body;
        const userId = req.user.id;

        // Create SOS alert
        const sosAlert = new SOSAlert({
            user: userId,
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat],
                address: location.address
            },
            message,
            media,
            triggeredBy: 'manual',
            severity: 'high'
        });

        await sosAlert.save();
        await sosAlert.populate('user', 'name email phone');

        // Get user's emergency contacts
        const user = await User.findById(userId).populate('trustedCircle.contact');

        // Notify emergency contacts
        const notificationPromises = [];

        if (user.emergencyContacts && user.emergencyContacts.length > 0) {
            user.emergencyContacts.forEach(contact => {
                // Send SMS
                if (contact.phone) {
                    const smsMessage = `EMERGENCY: ${user.name} has triggered an SOS alert. Location: ${location.address || 'Unknown'}. Message: ${message || 'No additional message'}`;
                    notificationPromises.push(sendSMS(contact.phone, smsMessage));
                }

                // Send email
                if (contact.email) {
                    const emailSubject = `EMERGENCY: ${user.name} needs help`;
                    const emailText = `
            ${user.name} has triggered an SOS alert on UniSafe.
            
            Location: ${location.address || 'Unknown'}
            Coordinates: ${location.lat}, ${location.lng}
            Time: ${new Date().toLocaleString()}
            Message: ${message || 'No additional message'}
            
            Please check the UniSafe app for more details and take appropriate action.
          `;
                    notificationPromises.push(sendEmail(contact.email, emailSubject, emailText));
                }
            });
        }

        // Notify campus security (users with security role)
        const securityPersonnel = await User.find({ role: 'security' });
        securityPersonnel.forEach(security => {
            const notification = {
                title: 'SOS Alert',
                body: `${user.name} has triggered an SOS alert at ${location.address || 'unknown location'}`,
                data: {
                    type: 'sos',
                    alertId: sosAlert._id.toString(),
                    userId: user._id.toString()
                }
            };
            notificationPromises.push(sendPushNotification(security, notification));
        });

        // Execute all notifications
        await Promise.allSettled(notificationPromises);

        // Update actions completed
        sosAlert.actionsCompleted = {
            photoCaptured: media && media.length > 0,
            videoRecording: false, // This would be handled by the frontend
            locationObtained: !!location,
            dataSent: true
        };
        await sosAlert.save();

        // Emit real-time event via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('sosAlert', {
                id: sosAlert._id,
                user: {
                    id: user._id,
                    name: user.name,
                    phone: user.phone
                },
                location: sosAlert.location,
                message: sosAlert.message,
                severity: sosAlert.severity,
                timestamp: sosAlert.createdAt
            });
        }

        res.status(201).json({
            success: true,
            message: 'SOS alert triggered successfully',
            data: sosAlert
        });
    } catch (error) {
        console.error('SOS trigger error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error triggering SOS'
        });
    }
};
export const getSOSAlerts = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }

        // Security personnel can see all alerts, users only see their own
        if (req.user.role !== 'security' && req.user.role !== 'admin') {
            query.user = req.user.id;
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: 'user',
            select: 'name email phone'
        };

        const alerts = await SOSAlert.paginate(query, options);

        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        console.error('Get SOS alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching SOS alerts'
        });
    }
};

export const updateSOSStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const sosAlert = await SOSAlert.findById(id);
        if (!sosAlert) {
            return res.status(404).json({
                success: false,
                message: 'SOS alert not found'
            });
        }

        // Check permissions
        if (req.user.role !== 'security' && req.user.role !== 'admin' && sosAlert.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this alert'
            });
        }

        sosAlert.status = status;
        if (status === 'resolved') {
            sosAlert.resolvedAt = new Date();
            sosAlert.respondedBy = req.user.id;
        }
        await sosAlert.save();

        res.json({
            success: true,
            message: `SOS alert ${status} successfully`,
            data: sosAlert
        });
    } catch (error) {
        console.error('Update SOS status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating SOS status'
        });
    }
};

export const getSOSStats = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stats = await SOSAlert.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        severity: "$severity"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.date",
                    alerts: {
                        $push: {
                            severity: "$_id.severity",
                            count: "$count"
                        }
                    },
                    total: { $sum: "$count" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get SOS stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching SOS statistics'
        });
    }
};


// --------------------- Helper functions ---------------------

async function performSOSActions(sosAlert) {
    try {
        sosAlert.actions.photoCaptured = true;
        sosAlert.actions.videoRecording = true;
        sosAlert.actions.locationObtained = true;

        sosAlert.media.photos.push({ url: `/uploads/sos/${sosAlert._id}/photo-${Date.now()}.jpg`, timestamp: new Date() });
        sosAlert.media.videos.push({ url: `/uploads/sos/${sosAlert._id}/video-${Date.now()}.mp4`, duration: 120, timestamp: new Date() });

        await sosAlert.save();

        await notifyEmergencyContacts(sosAlert);

        sosAlert.actions.contactsNotified = true;
        await sosAlert.save();
    } catch (error) {
        console.error('SOS actions error:', error);
    }
}

async function notifyEmergencyContacts(sosAlert) {
    try {
        const user = await User.findById(sosAlert.user).populate('emergencyContacts');
        if (!user?.emergencyContacts?.length) return;

        const message = `🚨 EMERGENCY ALERT: ${user.name} activated SOS at ${sosAlert.address}.
Time: ${sosAlert.createdAt.toLocaleString()}
Coordinates: ${sosAlert.location.coordinates[1]}, ${sosAlert.location.coordinates[0]}
Severity: ${sosAlert.severity.toUpperCase()}`;

        for (const contact of user.emergencyContacts) {
            try {
                if (contact.phone) await notificationService.sendUserNotification(contact._id, { type: 'emergency', title: 'SOS Alert', message });
            } catch (error) {
                console.error(`Failed to notify contact ${contact.name}:`, error);
            }
            sosAlert.contacts.push({ contactId: contact._id, notifiedAt: new Date(), status: 'notified' });
        }

        await sosAlert.save();
    } catch (error) {
        console.error('Emergency contact notification error:', error);
    }
}
