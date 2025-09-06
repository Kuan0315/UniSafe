import express from 'express';
import { auth } from '../middleware/auth.js';
import Checkin from '../models/Checkin.js';
import Trip from '../models/Trip.js';

const router = express.Router();

// Respond to check-in
router.post('/', auth, async (req, res) => {
    try {
        const { checkinId, isSafe, message, location } = req.body;

        const checkin = await Checkin.findById(checkinId)
            .populate('trip')
            .populate('user');

        if (!checkin) {
            return res.status(404).json({
                success: false,
                message: 'Check-in not found'
            });
        }

        // Verify user owns this check-in
        if (checkin.user._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to respond to this check-in'
            });
        }

        // Update check-in
        await checkin.markCompleted(isSafe, message, location);

        // If user is not safe, trigger emergency protocol
        if (!isSafe) {
            const emergencyService = await import('../services/emergencyService.js');
            await emergencyService.triggerEmergency(checkin.trip, location || {
                coordinates: { lat: 0, lng: 0 },
                address: 'Unknown location'
            });

            // Emit SOS event
            const io = req.app.get('io');
            io.to('security').emit('sosAlert', {
                userId: req.user.id,
                userName: req.user.name,
                tripId: checkin.trip._id,
                location: location?.coordinates,
                address: location?.address,
                type: 'guardian-checkin-fail',
                timestamp: new Date().toISOString(),
                message: message || 'User reported unsafe during check-in'
            });
        } else {
            // Schedule next check-in if trip is still active
            if (checkin.trip.status === 'active') {
                const notificationService = await import('../services/notificationService.js');
                await notificationService.scheduleNextCheckin(checkin.trip);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Check-in response recorded'
        });
    } catch (error) {
        console.error('Error responding to check-in:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get check-in history for a trip
router.get('/trip/:tripId', auth, async (req, res) => {
    try {
        const { tripId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Verify user owns this trip
        const trip = await Trip.findOne({ _id: tripId, user: req.user.id });
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found or not authorized'
            });
        }

        const checkins = await Checkin.find({ trip: tripId })
            .sort({ scheduledAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Checkin.countDocuments({ trip: tripId });

        res.status(200).json({
            success: true,
            checkins,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting check-in history:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;