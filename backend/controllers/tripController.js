// controllers/tripController.js
import Trip from '../models/Trip.js';
import Checkin from '../models/Checkin.js';
import Contact from '../models/Contact.js';
import { scheduleCheckin, scheduleNextCheckin } from '../services/notificationService.js';
import * as emergencyService from '../services/emergencyService.js';

// Create a new trip
export const createTrip = async (req, res) => {
    try {
        const { destination, startLocation, eta, checkInInterval, trustedContacts } = req.body;

        const trip = await Trip.create({
            user: req.user.id,
            destination,
            startLocation,
            eta,
            checkInInterval: checkInInterval || 5,
            trustedContacts,
            nextCheckIn: new Date(Date.now() + (checkInInterval || 5) * 60000)
        });

        // Schedule the first check-in
        await scheduleCheckin(trip);

        // Populate trip data
        await trip.populate('trustedContacts');

        res.status(201).json({
            success: true,
            trip
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get active trip
export const getActiveTrip = async (req, res) => {
    try {
        const trip = await Trip.findOne({
            user: req.user.id,
            status: 'active'
        }).populate('trustedContacts');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'No active trip found'
            });
        }

        res.status(200).json({
            success: true,
            trip
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update trip progress
export const updateProgress = async (req, res) => {
    try {
        const { progress } = req.body;

        const trip = await Trip.findOneAndUpdate(
            { user: req.user.id, status: 'active' },
            { progress },
            { new: true }
        ).populate('trustedContacts');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'No active trip found'
            });
        }

        res.status(200).json({
            success: true,
            trip
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Complete trip
export const completeTrip = async (req, res) => {
    try {
        const trip = await Trip.findOneAndUpdate(
            { user: req.user.id, status: 'active' },
            { status: 'completed', progress: 100 },
            { new: true }
        );

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'No active trip found'
            });
        }

        // Cancel all pending check-ins
        await Checkin.updateMany(
            { trip: trip._id, status: 'pending' },
            { status: 'cancelled' }
        );

        res.status(200).json({
            success: true,
            message: 'Trip completed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Respond to check-in
export const respondToCheckin = async (req, res) => {
    try {
        const { checkinId, isSafe, message } = req.body;

        const checkin = await Checkin.findByIdAndUpdate(
            checkinId,
            {
                status: 'completed',
                completedAt: new Date(),
                response: { isSafe, message }
            },
            { new: true }
        ).populate('trip');

        if (!checkin) {
            return res.status(404).json({
                success: false,
                message: 'Check-in not found'
            });
        }

        // If user is not safe, trigger emergency protocol
        if (!isSafe) {
            await emergencyService.triggerEmergency(checkin.trip, checkin.location);
        } else {
            // Schedule next check-in if trip is still active
            if (checkin.trip.status === 'active') {
                await scheduleNextCheckin(checkin.trip);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Check-in response recorded'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
