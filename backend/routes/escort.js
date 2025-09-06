import { Router } from 'express';
import { nanoid } from 'nanoid';
import Escort from '../models/Escort.js';
import Share from '../models/Share.js';
import Alert from '../models/Alert.js';
import { notifyGuardians } from '../utils/notifier.js';

const router = Router();

const minutesFromNow = (mins) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + Number(mins || 0));
    return d;
};

// POST /api/escort-sessions
router.post('/escort-sessions', async (req, res) => {
    try {
        const { userName, destination, durationMinutes, guardianEmails } = req.body || {};

        if (!userName || !destination || typeof durationMinutes !== 'number') {
            return res.status(400).json({ ok: false, error: 'userName, destination, durationMinutes required' });
        }

        const guardians = Array.isArray(guardianEmails) ? guardianEmails.filter(Boolean) : [];

        // Find or create share
        let share = await Share.findOne({ userName, active: true });
        if (!share) {
            share = new Share({
                token: nanoid(16),
                userName,
                active: true
            });
            await share.save();
        }

        // Create escort session
        const session = new Escort({
            id: nanoid(12),
            userName,
            destination,
            durationMinutes,
            expectedEnd: minutesFromNow(durationMinutes),
            guardianEmails: guardians,
            shareToken: share.token
        });

        await session.save();

        const base = (process.env.PUBLIC_BASE_URL || process.env.BASE_URL || '').replace(/\/$/, '');
        const shareUrl = base ? `${base}/api/live-share/${share.token}` : `/api/live-share/${share.token}`;

        res.json({ ok: true, session, shareUrl });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// PATCH /escort-sessions/:id/complete
router.patch('/escort-sessions/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const session = await Escort.findOne({ id });

        if (!session) {
            return res.status(404).json({ ok: false, error: 'Not found' });
        }

        await session.markComplete();
        res.json({ ok: true, session });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// PATCH /escort-sessions/:id/cancel
router.patch('/escort-sessions/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const session = await Escort.findOne({ id });

        if (!session) {
            return res.status(404).json({ ok: false, error: 'Not found' });
        }

        await session.markCancelled();
        res.json({ ok: true, session });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// GET /escort-sessions/:id
router.get('/escort-sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const session = await Escort.findOne({ id });

        if (!session) {
            return res.status(404).json({ ok: false, error: 'Not found' });
        }

        res.json({ ok: true, session });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// GET /escort-sessions
router.get('/escort-sessions', async (req, res) => {
    try {
        const sessions = await Escort.find().sort({ startTime: -1 });
        res.json({ ok: true, items: sessions });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// Overdue check function
export async function checkOverdueLoop() {
    try {
        const overdueSessions = await Escort.findOverdue();

        for (const session of overdueSessions) {
            console.log(`[OVERDUE] Session ${session.id} for user ${session.userName} is overdue!`);

            await session.markOverdue();

            // Create alert
            const alert = new Alert({
                id: nanoid(12),
                type: 'escort_overdue',
                message: `User ${session.userName} did not arrive at ${session.destination} in time.`,
                sessionId: session.id,
                guardians: session.guardianEmails
            });

            await alert.save();

            // Notify guardians
            await notifyGuardians(
                session.guardianEmails,
                `Guardian alert: ${session.userName} is overdue for ${session.destination}.`,
                { sessionId: session.id }
            );
        }
    } catch (error) {
        console.error('Overdue loop error:', error.message);
    }
}

export default router;