import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import SOS from '../models/SOS.js';
import User from '../models/User.js';
import Contact from '../models/Contact.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';
const router = Router();
// Student creates SOS alert
router.post('/', requireAuth, async (req, res) => {
    try {
        const { latitude, longitude, address, accuracy, initialMessage, category, autoVideoEnabled = false, liveLocationEnabled = true, type = 'emergency' } = req.body;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json({ error: 'latitude and longitude are required' });
        }
        // Get user info
        const user = await User.findById(req.auth.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Get user's trusted circle contacts
        const emergencyContacts = await Contact.find({ userId: req.auth.userId }).select('name phone relationship');
        const sosAlert = await SOS.create({
            userId: req.auth.userId,
            studentInfo: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                studentId: user.studentId || user._id.toString(),
                avatarDataUrl: user.avatarDataUrl
            },
            currentLocation: {
                latitude,
                longitude,
                address,
                accuracy,
                timestamp: new Date()
            },
            locationHistory: [{
                    latitude,
                    longitude,
                    address,
                    timestamp: new Date()
                }],
            autoVideoEnabled,
            liveLocationEnabled,
            initialMessage,
            category,
            type,
            priority: type === 'emergency' ? 'high' : 'medium',
            emergencyContacts: emergencyContacts.map(contact => ({
                name: contact.name,
                phone: contact.phone,
                relationship: contact.relationship
            }))
        });
        // Notify all staff/security users
        const staffUsers = await User.find({ role: { $in: ['staff', 'security'] } }).select('_id');
        if (staffUsers.length > 0) {
            const notifs = staffUsers.map(s => ({
                recipientId: s._id,
                senderId: req.auth.userId,
                type: 'sos_alert',
                title: 'SOS Alert Activated',
                message: `${user.name} has activated an SOS alert. Location: ${address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}`,
                location: { latitude, longitude },
                data: { sosId: sosAlert._id }
            }));
            await Notification.insertMany(notifs);
        }
        return res.status(201).json({
            sosId: sosAlert._id,
            message: 'SOS alert created successfully'
        });
    }
    catch (err) {
        console.error('Error creating SOS:', err);
        return res.status(400).json({ error: err.message || 'Failed to create SOS alert' });
    }
});
// Student updates location
router.post('/:id/location', requireAuth, async (req, res) => {
    try {
        const { latitude, longitude, address, accuracy } = req.body;
        const sosId = req.params.id;
        const sos = await SOS.findOne({ _id: sosId, userId: req.auth.userId });
        if (!sos) {
            return res.status(404).json({ error: 'SOS alert not found' });
        }
        if (sos.status !== 'active') {
            return res.status(400).json({ error: 'Cannot update location for resolved alert' });
        }
        const locationUpdate = {
            latitude,
            longitude,
            address,
            timestamp: new Date()
        };
        sos.currentLocation = {
            latitude,
            longitude,
            address,
            accuracy,
            timestamp: new Date()
        };
        sos.locationHistory.push(locationUpdate);
        await sos.save();
        return res.json({ message: 'Location updated successfully' });
    }
    catch (err) {
        console.error('Error updating location:', err);
        return res.status(400).json({ error: err.message || 'Failed to update location' });
    }
});
// Student sends chat message
router.post('/:id/chat', requireAuth, async (req, res) => {
    try {
        const { message, messageType = 'text', mediaUrl } = req.body;
        const sosId = req.params.id;
        const sos = await SOS.findOne({ _id: sosId, userId: req.auth.userId });
        if (!sos) {
            return res.status(404).json({ error: 'SOS alert not found' });
        }
        if (sos.status !== 'active') {
            return res.status(400).json({ error: 'Cannot send messages to resolved alert' });
        }
        sos.chatMessages.push({
            senderId: new mongoose.Types.ObjectId(req.auth.userId),
            senderRole: 'student',
            message,
            messageType,
            mediaUrl,
            timestamp: new Date()
        });
        await sos.save();
        return res.json({ message: 'Message sent successfully' });
    }
    catch (err) {
        console.error('Error sending message:', err);
        return res.status(400).json({ error: err.message || 'Failed to send message' });
    }
});
// Student uploads media
router.post('/:id/media', requireAuth, async (req, res) => {
    try {
        const { type, url, isAutoCaptured = false } = req.body;
        const sosId = req.params.id;
        const sos = await SOS.findOne({ _id: sosId, userId: req.auth.userId });
        if (!sos) {
            return res.status(404).json({ error: 'SOS alert not found' });
        }
        if (sos.status !== 'active') {
            return res.status(400).json({ error: 'Cannot upload media to resolved alert' });
        }
        sos.media.push({
            type,
            url,
            isAutoCaptured,
            timestamp: new Date()
        });
        await sos.save();
        return res.json({ message: 'Media uploaded successfully' });
    }
    catch (err) {
        console.error('Error uploading media:', err);
        return res.status(400).json({ error: err.message || 'Failed to upload media' });
    }
});
// Student cancels SOS alert
router.post('/:id/cancel', requireAuth, async (req, res) => {
    try {
        const sosId = req.params.id;
        const { reason, details } = req.body;
        const sos = await SOS.findOneAndUpdate({ _id: sosId, userId: req.auth.userId, status: 'active' }, {
            status: 'false_alarm',
            resolvedAt: new Date(),
            resolutionNote: reason ? `${reason}${details ? `: ${details}` : ''}` : 'Cancelled by student'
        }, { new: true });
        if (!sos) {
            return res.status(404).json({ error: 'Active SOS alert not found' });
        }
        return res.json({ message: 'SOS alert cancelled successfully' });
    }
    catch (err) {
        console.error('Error cancelling SOS:', err);
        return res.status(400).json({ error: err.message || 'Failed to cancel SOS alert' });
    }
});
// Student gets their SOS alerts
router.get('/my-alerts', requireAuth, async (req, res) => {
    try {
        const alerts = await SOS.find({ userId: req.auth.userId })
            .sort({ timestamp: -1 })
            .limit(50);
        return res.json({ alerts });
    }
    catch (err) {
        console.error('Error fetching user SOS alerts:', err);
        return res.status(500).json({ error: err.message || 'Failed to fetch SOS alerts' });
    }
});
// Staff gets SOS alerts (active and resolved)
router.get('/active', requireAuth, async (req, res) => {
    try {
        // Check if user is staff/security
        const user = await User.findById(req.auth.userId);
        if (!user || !['staff', 'security'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied. Staff only.' });
        }
        const alerts = await SOS.find({}) // Get all alerts, not just active ones
            .populate('userId', 'name email')
            .populate('assignedStaff', 'name email')
            .populate('followedBy', 'name email phone')
            .populate('responders', 'name email phone')
            .populate('resolvedBy', 'name email')
            .sort({ timestamp: -1 });
        return res.json({ alerts });
    }
    catch (err) {
        console.error('Error fetching active SOS alerts:', err);
        return res.status(500).json({ error: err.message || 'Failed to fetch active alerts' });
    }
});
// Staff gets SOS alert by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.auth.userId);
        if (!user || !['staff', 'security'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied. Staff only.' });
        }
        const sos = await SOS.findById(req.params.id)
            .populate('userId', 'name email phone')
            .populate('assignedStaff', 'name email')
            .populate('resolvedBy', 'name email')
            .populate('responders', 'name email');
        if (!sos) {
            return res.status(404).json({ error: 'SOS alert not found' });
        }
        return res.json({ alert: sos });
    }
    catch (err) {
        console.error('Error fetching SOS alert:', err);
        return res.status(500).json({ error: err.message || 'Failed to fetch SOS alert' });
    }
});
// Staff updates SOS alert status
router.put('/:id/status', requireAuth, async (req, res) => {
    console.log('PUT /:id/status called for alert:', req.params.id, 'by user:', req.auth?.userId, 'status:', req.body.status);
    try {
        const user = await User.findById(req.auth.userId);
        if (!user || !['staff', 'security'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied. Staff only.' });
        }
        const { status, resolutionNote } = req.body;
        const validStatuses = ['active', 'resolved', 'false_alarm'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: active, resolved, false_alarm' });
        }
        const sos = await SOS.findById(req.params.id);
        if (!sos) {
            return res.status(404).json({ error: 'SOS alert not found' });
        }
        // Update status and related fields
        sos.status = status;
        if (status === 'resolved' || status === 'false_alarm') {
            sos.resolvedBy = new mongoose.Types.ObjectId(req.auth.userId);
            sos.resolvedAt = new Date();
            sos.resolutionNote = resolutionNote;
            sos.responseTime = Math.floor((Date.now() - sos.timestamp.getTime()) / 60000); // minutes
        }
        await sos.save();
        return res.json({ alert: sos });
    }
    catch (err) {
        console.error('Error updating SOS alert status:', err);
        return res.status(500).json({ error: err.message || 'Failed to update alert status' });
    }
});
// Staff follows SOS alert
router.post('/:id/follow', requireAuth, async (req, res) => {
    console.log('POST /:id/follow called for alert:', req.params.id, 'by user:', req.auth?.userId);
    try {
        const user = await User.findById(req.auth.userId);
        if (!user || !['staff', 'security'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied. Staff only.' });
        }
        const sos = await SOS.findOneAndUpdate({ _id: req.params.id, status: 'active' }, { followedBy: new mongoose.Types.ObjectId(req.auth.userId) }, { new: true });
        if (!sos) {
            return res.status(404).json({ error: 'Active SOS alert not found' });
        }
        return res.json({ message: 'Alert followed successfully' });
    }
    catch (err) {
        console.error('Error following SOS alert:', err);
        return res.status(400).json({ error: err.message || 'Failed to follow alert' });
    }
});
// Staff responds to SOS alert
router.post('/:id/respond', requireAuth, async (req, res) => {
    console.log('POST /:id/respond called for alert:', req.params.id, 'by user:', req.auth?.userId);
    try {
        const user = await User.findById(req.auth.userId);
        if (!user || !['staff', 'security'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied. Staff only.' });
        }
        const sos = await SOS.findOneAndUpdate({ _id: req.params.id, status: 'active' }, { $addToSet: { responders: new mongoose.Types.ObjectId(req.auth.userId) } }, { new: true });
        if (!sos) {
            return res.status(404).json({ error: 'Active SOS alert not found' });
        }
        return res.json({ message: 'Response recorded successfully' });
    }
    catch (err) {
        console.error('Error responding to SOS alert:', err);
        return res.status(400).json({ error: err.message || 'Failed to record response' });
    }
});
// Staff assigns themselves to SOS alert
router.post('/:id/assign', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.auth.userId);
        if (!user || !['staff', 'security'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied. Staff only.' });
        }
        const sos = await SOS.findOneAndUpdate({ _id: req.params.id, status: 'active' }, {
            assignedStaff: new mongoose.Types.ObjectId(req.auth.userId),
            $addToSet: { responders: new mongoose.Types.ObjectId(req.auth.userId) }
        }, { new: true });
        if (!sos) {
            return res.status(404).json({ error: 'Active SOS alert not found' });
        }
        return res.json({ message: 'Alert assigned successfully' });
    }
    catch (err) {
        console.error('Error assigning SOS alert:', err);
        return res.status(400).json({ error: err.message || 'Failed to assign alert' });
    }
});
// Staff updates SOS status
router.post('/:id/status', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.auth.userId);
        if (!user || !['staff', 'security'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied. Staff only.' });
        }
        const { status, resolutionNote } = req.body;
        if (!['active', 'resolved', 'false_alarm'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const updateData = { status };
        if (status !== 'active') {
            updateData.resolvedBy = new mongoose.Types.ObjectId(req.auth.userId);
            updateData.resolvedAt = new Date();
            if (resolutionNote) {
                updateData.resolutionNote = resolutionNote;
            }
        }
        const sos = await SOS.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!sos) {
            return res.status(404).json({ error: 'SOS alert not found' });
        }
        return res.json({ message: 'Status updated successfully' });
    }
    catch (err) {
        console.error('Error updating SOS status:', err);
        return res.status(400).json({ error: err.message || 'Failed to update status' });
    }
});
// Staff sends chat message
router.post('/:id/chat/staff', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.auth.userId);
        if (!user || !['staff', 'security'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied. Staff only.' });
        }
        const { message, messageType = 'text', mediaUrl } = req.body;
        const sosId = req.params.id;
        const sos = await SOS.findById(sosId);
        if (!sos) {
            return res.status(404).json({ error: 'SOS alert not found' });
        }
        if (sos.status !== 'active') {
            return res.status(400).json({ error: 'Cannot send messages to resolved alert' });
        }
        sos.chatMessages.push({
            senderId: new mongoose.Types.ObjectId(req.auth.userId),
            senderRole: user.role === 'security' ? 'security' : 'staff',
            message,
            messageType,
            mediaUrl,
            timestamp: new Date()
        });
        await sos.save();
        return res.json({ message: 'Message sent successfully' });
    }
    catch (err) {
        console.error('Error sending staff message:', err);
        return res.status(400).json({ error: err.message || 'Failed to send message' });
    }
});
// Staff gets chat messages
router.get('/:id/chat', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.auth.userId);
        if (!user) {
            return res.status(403).json({ error: 'Access denied.' });
        }
        const sos = await SOS.findById(req.params.id);
        if (!sos) {
            return res.status(404).json({ error: 'SOS alert not found' });
        }
        // Allow staff/security OR the student who created the alert
        const isStaff = ['staff', 'security'].includes(user.role);
        const isAlertOwner = sos.userId.toString() === req.auth.userId;
        if (!isStaff && !isAlertOwner) {
            return res.status(403).json({ error: 'Access denied. Staff only or alert owner.' });
        }
        return res.json({ messages: sos.chatMessages });
    }
    catch (err) {
        console.error('Error fetching chat messages:', err);
        return res.status(500).json({ error: err.message || 'Failed to fetch messages' });
    }
});
// Staff gets location history
router.get('/:id/location-history', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.auth.userId);
        if (!user || !['staff', 'security'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied. Staff only.' });
        }
        const sos = await SOS.findById(req.params.id).select('locationHistory status');
        if (!sos) {
            return res.status(404).json({ error: 'SOS alert not found' });
        }
        return res.json({ locationHistory: sos.locationHistory });
    }
    catch (err) {
        console.error('Error fetching location history:', err);
        return res.status(500).json({ error: err.message || 'Failed to fetch location history' });
    }
});
// Staff gets media
router.get('/:id/media', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.auth.userId);
        if (!user || !['staff', 'security'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied. Staff only.' });
        }
        const sos = await SOS.findById(req.params.id).select('media status');
        if (!sos) {
            return res.status(404).json({ error: 'SOS alert not found' });
        }
        return res.json({ media: sos.media });
    }
    catch (err) {
        console.error('Error fetching media:', err);
        return res.status(500).json({ error: err.message || 'Failed to fetch media' });
    }
});
export default router;
