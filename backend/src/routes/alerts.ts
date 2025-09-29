import express from 'express';
import Alert, { IAlert } from '../models/Alert';
import { Expo } from 'expo-server-sdk';


const router = express.Router();
let expo = new Expo();

// Get all alerts
router.get('/', async (req, res) => {
    try {
        const alerts = await Alert.find().sort({ createdAt: -1 });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching alerts', error });
    }
});

// Create a new alert
router.post('/', async (req, res) => {
    try {
        const alertData: Partial<IAlert> = req.body;
        const alert = new Alert(alertData);
        await alert.save();
        res.status(201).json(alert);
    } catch (error) {
        res.status(500).json({ message: 'Error creating alert', error });
    }
});

// POST /alerts/send-notification
router.post('/send-notification', async (req, res) => {
    const { title, message, recipients } = req.body;

    try {
        let messages = [];
        for (let pushToken of recipients) {
            if (!Expo.isExpoPushToken(pushToken)) continue;
            messages.push({
                to: pushToken,
                sound: 'default',
                title,
                body: message,
            });
        }

        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];
        for (let chunk of chunks) {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }

        res.json({ success: true, tickets });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err });
    }
});


// Update an alert
router.put('/:id', async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(alert);
    } catch (error) {
        res.status(500).json({ message: 'Error updating alert', error });
    }
});

// Delete an alert
router.delete('/:id', async (req, res) => {
    try {
        await Alert.findByIdAndDelete(req.params.id);
        res.json({ message: 'Alert deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting alert', error });
    }
});

export default router;
