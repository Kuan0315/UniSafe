import FollowMe from '../models/FollowMe.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import SafeRoute from '../models/SafeRoute.js';

// Start Follow Me session
export const startFollowMe = async (req, res) => {
    try {
        const { latitude, longitude, accuracy, address, duration = 3600, shareWith } = req.body;
        if (!latitude || !longitude) return res.status(400).json({ success: false, message: 'Coordinates required' });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const activeSession = await FollowMe.findOne({ user: req.user.id, isActive: true });
        if (activeSession) return res.status(400).json({ success: false, message: 'Session already active' });

        const expiresAt = new Date(Date.now() + duration * 1000);

        const sharingList = [];
        if (shareWith && Array.isArray(shareWith)) {
            for (const contactId of shareWith) {
                const contact = await User.findById(contactId);
                if (contact && user.trustedCircle.some(c => c.phone === contact.phone)) {
                    sharingList.push({ userId: contactId, addedAt: new Date() });
                }
            }
        }

        const followMe = await FollowMe.create({
            user: req.user.id,
            isActive: true,
            expiresAt,
            sharingWith: sharingList,
            currentLocation: { latitude, longitude, accuracy, address, timestamp: new Date() },
            locationHistory: [{ latitude, longitude, accuracy, address, timestamp: new Date() }]
        });

        user.followMe = { isActive: true, lastLocation: { latitude, longitude, timestamp: new Date() } };
        await user.save();

        if (sharingList.length > 0) await notifyTrustedContacts(user, followMe, 'started');

        res.status(201).json({
            success: true,
            followMe: { id: followMe._id, isActive: followMe.isActive, expiresAt, currentLocation: followMe.currentLocation, sharingWith: sharingList.length }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update location
export const updateLocation = async (req, res) => {
    try {
        const { latitude, longitude, accuracy, address } = req.body;
        if (!latitude || !longitude) return res.status(400).json({ success: false, message: 'Coordinates required' });

        const followMe = await FollowMe.findOne({ user: req.user.id, isActive: true });
        if (!followMe) return res.status(404).json({ success: false, message: 'No active session' });

        if (new Date() > followMe.expiresAt) {
            followMe.isActive = false;
            followMe.status = 'stopped';
            await followMe.save();

            const user = await User.findById(req.user.id);
            user.followMe.isActive = false;
            await user.save();

            return res.status(400).json({ success: false, message: 'Session expired' });
        }

        const locationUpdate = { latitude, longitude, accuracy, address, timestamp: new Date() };
        followMe.currentLocation = locationUpdate;
        followMe.locationHistory.push(locationUpdate);

        if (followMe.locationHistory.length > followMe.settings.maxHistoryPoints) {
            followMe.locationHistory = followMe.locationHistory.slice(-followMe.settings.maxHistoryPoints);
        }

        await followMe.save();

        const user = await User.findById(req.user.id);
        user.followMe.lastLocation = locationUpdate;
        await user.save();

        const io = req.app.get('io');
        followMe.sharingWith.forEach(share => {
            io.to(`user_${share.userId}`).emit('followMeUpdate', {
                userId: req.user.id,
                userName: user.name,
                location: locationUpdate
            });
        });

        // Route safety
        const nearbyRoutes = await SafeRoute.find({
            isActive: true,
            $or: [
                { startLocation: { $near: { $geometry: { type: 'Point', coordinates: [longitude, latitude] }, $maxDistance: 200 } } },
                { endLocation: { $near: { $geometry: { type: 'Point', coordinates: [longitude, latitude] }, $maxDistance: 200 } } }
            ]
        });

        const warnings = nearbyRoutes.filter(r => r.safetyLevel === 'avoid' || r.safetyLevel === 'moderate');
        if (warnings.length > 0) {
            io.to(`user_${req.user.id}`).emit('routeWarning', {
                message: `⚠️ Near ${warnings.length} potentially unsafe route(s)`,
                routes: warnings.map(r => ({ id: r._id, name: r.name, safetyLevel: r.safetyLevel }))
            });
        }

        res.status(200).json({ success: true, location: locationUpdate, warnings: warnings.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Stop Follow Me
export const stopFollowMe = async (req, res) => {
    try {
        const followMe = await FollowMe.findOne({ user: req.user.id, isActive: true });
        if (!followMe) return res.status(404).json({ success: false, message: 'No active session' });

        followMe.isActive = false;
        followMe.status = 'stopped';
        await followMe.save();

        const user = await User.findById(req.user.id);
        user.followMe.isActive = false;
        await user.save();

        await notifyTrustedContacts(user, followMe, 'stopped');

        res.status(200).json({ success: true, message: 'Session stopped' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get Follow Me status
export const getFollowMeStatus = async (req, res) => {
    try {
        const followMe = await FollowMe.findOne({ user: req.user.id, isActive: true });
        res.json({ success: true, followMe });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get locations shared with me
export const getSharedLocation = async (req, res) => {
    try {
        const shared = await FollowMe.find({ 'sharingWith.userId': req.user.id, isActive: true })
            .populate('user', 'name email phone');
        res.json({ success: true, shared });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get Follow Me session history
export const getFollowMeHistory = async (req, res) => {
    try {
        const history = await FollowMe.find({ user: req.user.id }).sort({ startedAt: -1 });
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update settings
export const updateSettings = async (req, res) => {
    try {
        const { updateInterval, maxHistoryPoints, shareLocation, shareAddress } = req.body;
        const followMe = await FollowMe.findOne({ user: req.user.id, isActive: true });
        if (!followMe) return res.status(404).json({ success: false, message: 'No active session' });

        if (updateInterval !== undefined) followMe.settings.updateInterval = updateInterval;
        if (maxHistoryPoints !== undefined) followMe.settings.maxHistoryPoints = maxHistoryPoints;
        if (shareLocation !== undefined) followMe.settings.shareLocation = shareLocation;
        if (shareAddress !== undefined) followMe.settings.shareAddress = shareAddress;

        await followMe.save();
        res.json({ success: true, settings: followMe.settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Notify trusted contacts
async function notifyTrustedContacts(user, followMe, action) {
    try {
        const notifications = followMe.sharingWith.map(share => ({
            recipient: share.userId,
            title: `Follow Me ${action}`,
            message: `${user.name} has ${action} sharing location`,
            type: 'follow_me',
            data: { userId: user._id, userName: user.name, action }
        }));

        if (notifications.length > 0) await Notification.insertMany(notifications);
    } catch (err) {
        console.error('Error notifying contacts:', err);
    }
}
