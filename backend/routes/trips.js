// routes/trips.js
import express from 'express';
import { auth } from '../middleware/auth.js';
import Trip from '../models/Trip.js';
import Checkin from '../models/Checkin.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// Create a new trip
router.post('/', auth, async (req, res) => {
    try {
        const { destination, startLocation, eta, checkInInterval, trustedContacts } = req.body;

        // Check for existing active trip
        const existingTrip = await Trip.findOne({ user: req.user.id, status: 'active' });
        if (existingTrip) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active trip. Complete or cancel it first.'
            });
        }

        const trip = await Trip.create({
            user: req.user.id,
            destination,
            startLocation,
            eta,
            checkInInterval: checkInInterval || 5,
            trustedContacts,
            nextCheckIn: new Date(Date.now() + (checkInInterval || 5) * 60000)
        });

        // Schedule trip check-ins
        await notificationService.scheduleTripCheckins(trip);

        // Populate
        await trip.populate('trustedContacts', 'name phone avatar');
        await trip.populate('user', 'name phone avatar');

        res.status(201).json({
            success: true,
            trip
        });
    } catch (error) {
        console.error('Error creating trip:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get active trip
router.get('/active', auth, async (req, res) => {
    try {
        const trip = await Trip.findOne({ user: req.user.id, status: 'active' })
            .populate('trustedContacts', 'name phone avatar')
            .populate('user', 'name phone avatar');

        if (!trip) {
            return res.status(404).json({ success: false, message: 'No active trip found' });
        }

        res.status(200).json({ success: true, trip });
    } catch (error) {
        console.error('Error getting active trip:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update trip progress
router.put('/progress', auth, async (req, res) => {
    try {
        const { progress } = req.body;

        const trip = await Trip.findOneAndUpdate(
            { user: req.user.id, status: 'active' },
            { progress },
            { new: true }
        ).populate('trustedContacts', 'name phone avatar')
            .populate('user', 'name phone avatar');

        if (!trip) return res.status(404).json({ success: false, message: 'No active trip found' });

        res.status(200).json({ success: true, trip });
    } catch (error) {
        console.error('Error updating trip progress:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Complete trip
router.put('/complete', auth, async (req, res) => {
    try {
        const trip = await Trip.findOneAndUpdate(
            { user: req.user.id, status: 'active' },
            { status: 'completed', progress: 100, completedAt: new Date() },
            { new: true }
        );

        if (!trip) return res.status(404).json({ success: false, message: 'No active trip found' });

        await Checkin.updateMany({ trip: trip._id, status: 'pending' }, { status: 'cancelled' });

        res.status(200).json({ success: true, message: 'Trip completed successfully' });
    } catch (error) {
        console.error('Error completing trip:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Cancel trip
router.put('/cancel', auth, async (req, res) => {
    try {
        const trip = await Trip.findOneAndUpdate(
            { user: req.user.id, status: 'active' },
            { status: 'cancelled', completedAt: new Date() },
            { new: true }
        );

        if (!trip) return res.status(404).json({ success: false, message: 'No active trip found' });

        await Checkin.updateMany({ trip: trip._id, status: 'pending' }, { status: 'cancelled' });

        res.status(200).json({ success: true, message: 'Trip cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling trip:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Trip history
router.get('/history', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const trips = await Trip.find({ user: req.user.id, status: { $in: ['completed', 'cancelled'] } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('trustedContacts', 'name phone avatar');

        const total = await Trip.countDocuments({ user: req.user.id, status: { $in: ['completed', 'cancelled'] } });

        res.status(200).json({
            success: true,
            trips,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Error getting trip history:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
