import Trip from '../models/Trip.js';
import { sendSMS, sendEmail, sendPushNotification } from './notificationServices.js';

// Trigger emergency protocol
export const triggerEmergency = async (trip, location) => {
    try {
        // Get the latest trip data with populated contacts
        const currentTrip = await Trip.findById(trip._id)
            .populate('trustedContacts', 'name phone email devices')
            .populate('user', 'name phone email devices');

        if (!currentTrip) {
            console.error('Trip not found for emergency:', trip._id);
            return;
        }

        const emergencyMessage = `
EMERGENCY ALERT: ${currentTrip.user.name} may be in danger.

Last known location: ${location.address || 'Unknown'}
Coordinates: ${location.coordinates.lat}, ${location.coordinates.lng}
Trip to: ${currentTrip.destination.name}
Started at: ${currentTrip.startedAt.toLocaleString()}

Please check on them immediately.
        `.trim();

        // Notify trusted contacts
        for (const contact of currentTrip.trustedContacts) {
            if (contact.phone) {
                await sendSMS(contact.phone, emergencyMessage);
            }

            if (contact.email) {
                await sendEmail(contact.email, 'EMERGENCY ALERT - User May Be In Danger', emergencyMessage);
            }

            // Send push notification if device tokens available
            if (contact.devices && contact.devices.length > 0) {
                for (const device of contact.devices) {
                    if (device.pushToken) {
                        await sendPushNotification(
                            device.pushToken,
                            'EMERGENCY ALERT',
                            `${currentTrip.user.name} may be in danger`,
                            {
                                type: 'emergency-alert',
                                tripId: currentTrip._id.toString(),
                                userId: currentTrip.user._id.toString()
                            }
                        );
                    }
                }
            }
        }

        // Notify security (this would be implemented based on your security system)
        console.log('EMERGENCY ALERT - Notifying security team');

        return true;
    } catch (error) {
        console.error('Error triggering emergency protocol:', error);
        throw error;
    }
};