import GuardianSession from '../models/GuardianSession.js';
import TrustedContact from '../models/TrustedContact.js';
import { sendEmail } from '../services/emailService.js';
import { sendSMS } from '../services/smsService.js';
import { sendPushNotification } from '../services/pushService.js';
import { calculateRoute } from '../services/mapService.js';

export const startGuardianSession = async (req, res) => {
    try {
        const { destination, destinationCoords, estimatedDuration, trustedContactIds } = req.body;
        const userId = req.user.id;

        // Calculate route and estimated arrival
        const userLocation = req.user.lastKnownLocation;
        const routeInfo = await calculateRoute(
            [userLocation.coordinates[1], userLocation.coordinates[0]],
            [destinationCoords.lat, destinationCoords.lng]
        );

        const estimatedArrival = new Date();
        estimatedArrival.setMinutes(estimatedArrival.getMinutes() + estimatedDuration);

        // Create guardian session
        const guardianSession = new GuardianSession({
            user: userId,
            destination,
            destinationCoords: {
                type: 'Point',
                coordinates: [destinationCoords.lng, destinationCoords.lat]
            },
            estimatedDuration,
            estimatedArrival,
            trustedContacts: trustedContactIds.map(id => ({ contact: id })),
            checkIns: [{
                location: userLocation,
                status: 'on_time',
                timestamp: new Date()
            }]
        });

        await guardianSession.save();
        await guardianSession.populate('trustedContacts.contact');

        // Notify trusted contacts
        const notificationPromises = [];
        guardianSession.trustedContacts.forEach(async (item) => {
            if (item.contact.notificationsEnabled) {
                const message = `
          ${req.user.name} has started a Guardian session to ${destination}.
          Estimated arrival: ${estimatedArrival.toLocaleTimeString()}.
          You will receive updates on their journey.
        `;

                if (item.contact.phone) {
                    notificationPromises.push(sendSMS(item.contact.phone, message));
                }

                if (item.contact.email) {
                    notificationPromises.push(sendEmail(
                        item.contact.email,
                        `${req.user.name} started a Guardian session`,
                        message
                    ));
                }

                // Mark as notified
                item.notified = true;
            }
        });

        await Promise.allSettled(notificationPromises);
        await guardianSession.save();

        res.status(201).json({
            success: true,
            message: 'Guardian session started successfully',
            data: guardianSession
        });
    } catch (error) {
        console.error('Start guardian session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error starting guardian session'
        });
    }
};

export const updateGuardianLocation = async (req, res) => {
    try {
        const { sessionId, location, status, message } = req.body;
        const userId = req.user.id;

        const guardianSession = await GuardianSession.findOne({
            _id: sessionId,
            user: userId,
            currentStatus: 'active'
        });

        if (!guardianSession) {
            return res.status(404).json({
                success: false,
                message: 'Active guardian session not found'
            });
        }

        // Add check-in
        guardianSession.checkIns.push({
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            },
            status: status || 'on_time',
            message,
            timestamp: new Date()
        });

        // Check for route deviations
        const routeDeviation = await checkRouteDeviation(guardianSession, location);
        if (routeDeviation) {
            guardianSession.routeDeviations.push({
                location: {
                    type: 'Point',
                    coordinates: [location.lng, location.lat]
                },
                distanceFromRoute: routeDeviation.distance,
                timestamp: new Date()
            });

            // Notify trusted contacts about deviation
            await notifyRouteDeviation(guardianSession, routeDeviation);
        }

        await guardianSession.save();

        res.json({
            success: true,
            message: 'Location updated successfully',
            data: guardianSession
        });
    } catch (error) {
        console.error('Update guardian location error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating guardian location'
        });
    }
};

export const completeGuardianSession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.user.id;

        const guardianSession = await GuardianSession.findOne({
            _id: sessionId,
            user: userId
        });

        if (!guardianSession) {
            return res.status(404).json({
                success: false,
                message: 'Guardian session not found'
            });
        }

        guardianSession.currentStatus = 'completed';
        guardianSession.endTime = new Date();
        guardianSession.actualArrival = new Date();

        await guardianSession.save();
        await guardianSession.populate('trustedContacts.contact');

        // Notify trusted contacts about completion
        const notificationPromises = [];
        guardianSession.trustedContacts.forEach(async (item) => {
            if (item.contact.notificationsEnabled) {
                const message = `
          ${req.user.name} has safely arrived at ${guardianSession.destination}.
          Session completed at ${guardianSession.endTime.toLocaleTimeString()}.
        `;

                if (item.contact.phone) {
                    notificationPromises.push(sendSMS(item.contact.phone, message));
                }

                if (item.contact.email) {
                    notificationPromises.push(sendEmail(
                        item.contact.email,
                        `${req.user.name} arrived safely`,
                        message
                    ));
                }
            }
        });

        await Promise.allSettled(notificationPromises);

        res.json({
            success: true,
            message: 'Guardian session completed successfully',
            data: guardianSession
        });
    } catch (error) {
        console.error('Complete guardian session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error completing guardian session'
        });
    }
};

export const getActiveGuardianSession = async (req, res) => {
    try {
        const userId = req.user.id;

        const guardianSession = await GuardianSession.findOne({
            user: userId,
            currentStatus: 'active'
        }).populate('trustedContacts.contact');

        res.json({
            success: true,
            data: guardianSession
        });
    } catch (error) {
        console.error('Get active guardian session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching active guardian session'
        });
    }
};

export const getGuardianHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user.id;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: 'trustedContacts.contact'
        };

        const sessions = await GuardianSession.paginate(
            { user: userId },
            options
        );

        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Get guardian history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching guardian history'
        });
    }
};

// Helper functions
async function checkRouteDeviation(session, currentLocation) {
    // This would integrate with a mapping service to check if the user
    // has deviated significantly from their planned route
    // For now, we'll return a mock deviation check
    const MAX_DEVIATION_DISTANCE = 500; // meters

    // Simulate route deviation check
    const deviationDistance = Math.random() * 1000; // Random distance for simulation

    if (deviationDistance > MAX_DEVIATION_DISTANCE) {
        return {
            distance: deviationDistance,
            message: `Significant route deviation detected (${deviationDistance.toFixed(0)}m from planned route)`
        };
    }

    return null;
}

async function notifyRouteDeviation(session, deviation) {
    const notificationPromises = [];

    session.trustedContacts.forEach(async (item) => {
        if (item.contact.notificationsEnabled) {
            const message = `
        ALERT: ${session.user.name} has deviated from their planned route.
        Deviation: ${deviation.distance.toFixed(0)} meters from planned route.
        Current location: ${deviation.message}.
        Please check on them if this continues.
      `;

            if (item.contact.phone) {
                notificationPromises.push(sendSMS(item.contact.phone, message));
            }

            if (item.contact.email) {
                notificationPromises.push(sendEmail(
                    item.contact.email,
                    `Route Deviation Alert for ${session.user.name}`,
                    message
                ));
            }

            // Record the alert
            session.alertsSent.push({
                type: 'route_deviation',
                timestamp: new Date(),
                message: deviation.message,
                sentTo: [item.contact._id]
            });
        }
    });

    await Promise.allSettled(notificationPromises);
}