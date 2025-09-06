// services/notificationService.js
import Trip from '../models/Trip.js';
import Checkin from '../models/Checkin.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/emailService.js';
import { sendPushNotification } from '../utils/pushService.js';
import { sendSMS } from '../utils/smsService.js';

class NotificationService {
    constructor() {
        this.scheduledJobs = new Map();
    }

    // Schedule all check-ins for a trip
    async scheduleTripCheckins(trip) {
        try {
            this.cancelTripCheckins(trip._id);

            const checkInInterval = trip.checkInInterval * 60 * 1000;
            const startTime = new Date(trip.startedAt);
            const totalDuration = trip.eta * 60 * 1000;
            const numberOfCheckins = Math.floor(totalDuration / checkInInterval);

            for (let i = 1; i <= numberOfCheckins; i++) {
                const scheduledFor = new Date(startTime.getTime() + i * checkInInterval);
                await this.scheduleCheckin(trip, scheduledFor);
            }
        } catch (error) {
            console.error('Error scheduling trip check-ins:', error);
        }
    }

    // Schedule a single check-in at a specific time
    async scheduleCheckin(trip, scheduledFor) {
        try {
            const checkin = new Checkin({
                trip: trip._id,
                user: trip.user,
                scheduledFor,
                status: 'pending'
            });
            await checkin.save();

            const reminderTime = new Date(scheduledFor.getTime() - 5 * 60 * 1000);
            const reminderJob = setTimeout(async () => {
                await this.sendCheckinReminder(checkin);
            }, reminderTime - Date.now());

            this.scheduledJobs.set(`checkin_${checkin._id}`, reminderJob);

            console.log(`Scheduled check-in for trip ${trip._id} at ${scheduledFor}`);
        } catch (error) {
            console.error('Error scheduling single check-in:', error);
        }
    }

    async sendCheckinReminder(checkin) {
        try {
            const trip = await Trip.findById(checkin.trip).populate('user');
            if (!trip || trip.status !== 'active') return;

            checkin.reminderSent = true;
            checkin.reminderSentAt = new Date();
            await checkin.save();

            await this.sendUserNotification(trip.user, {
                type: 'checkin_reminder',
                title: 'Safety Check-in Reminder',
                message: `Are you okay? Please confirm your safety for your trip to ${trip.destination}.`,
                data: { tripId: trip._id, checkinId: checkin._id, destination: trip.destination }
            });
        } catch (error) {
            console.error('Error sending check-in reminder:', error);
        }
    }

    async sendUserNotification(userId, notification) {
        try {
            const user = await User.findById(userId);
            if (!user) return;

            if (user.preferences?.notifications?.pushEnabled) {
                await sendPushNotification(user, notification);
            }
            if (user.preferences?.notifications?.emailEnabled) {
                await sendEmail(user.email, notification.title, notification.message, notification);
            }
            if (user.preferences?.notifications?.smsEnabled && user.phone) {
                await sendSMS(user.phone, notification.message);
            }
        } catch (error) {
            console.error('Error sending user notification:', error);
        }
    }

    async notifyTrustedContacts(trip, message, emergency = false) {
        try {
            const populatedTrip = await Trip.findById(trip._id).populate('trustedContacts');

            for (const contact of populatedTrip.trustedContacts) {
                await this.sendUserNotification(contact._id, {
                    type: emergency ? 'emergency_alert' : 'trip_update',
                    title: emergency ? 'Emergency Alert' : 'Trip Update',
                    message,
                    data: { tripId: trip._id, userId: trip.user, emergency }
                });
            }
        } catch (error) {
            console.error('Error notifying trusted contacts:', error);
        }
    }

    async sendEmergencyAlert(trip, reason) {
        const message = `EMERGENCY: ${reason} for trip to ${trip.destination}.`;
        await this.notifyTrustedContacts(trip, message, true);
        await this.sendUserNotification(trip.user, {
            type: 'emergency_alert',
            title: 'Emergency Alert Activated',
            message: `Emergency services and your trusted contacts have been notified.`,
            data: { tripId: trip._id, emergency: true }
        });
    }

    cancelTripCheckins(tripId) {
        for (const [key, job] of this.scheduledJobs.entries()) {
            if (key.startsWith(`checkin_`)) {
                clearTimeout(job);
                this.scheduledJobs.delete(key);
            }
        }
    }
}

const notificationService = new NotificationService();
export default notificationService;

// ✅ Named exports for ESM
export const scheduleTripCheckins = (...args) => notificationService.scheduleTripCheckins(...args);
export const scheduleCheckin = (...args) => notificationService.scheduleCheckin(...args);
export const sendCheckinReminder = (...args) => notificationService.sendCheckinReminder(...args);
export const sendUserNotification = (...args) => notificationService.sendUserNotification(...args);
export const notifyTrustedContacts = (...args) => notificationService.notifyTrustedContacts(...args);
export const sendEmergencyAlert = (...args) => notificationService.sendEmergencyAlert(...args);
export const cancelTripCheckins = (...args) => notificationService.cancelTripCheckins(...args);
