import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
    startGuardianSession,
    updateGuardianLocation,
    completeGuardianSession,
    getActiveGuardianSession,
    getGuardianHistory
} from '../controllers/guardianController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// In-memory storage for active guardian sessions (in production, use a database)
const activeSessions = new Map();
const trustedContacts = new Map();

// Initialize with some sample data
trustedContacts.set('user123', [
    { id: 'contact1', name: 'Sarah Mom', isMonitoring: true }
]);

// Middleware to validate session
const validateSession = (req, res, next) => {
    const sessionId = req.headers['session-id'] || req.query.sessionId;

    if (!sessionId || !activeSessions.has(sessionId)) {
        return res.status(401).json({
            error: 'Invalid or expired session'
        });
    }

    req.session = activeSessions.get(sessionId);
    next();
};


// All routes require authentication
router.use(authenticate);

// Start a new guardian session
router.post('/start', (req, res) => {
    const { userId, destination, eta, checkInInterval = 5 } = req.body;

    if (!userId || !destination || !eta) {
        return res.status(400).json({
            error: 'Missing required fields: userId, destination, eta'
        });
    }

    const sessionId = uuidv4();
    const session = {
        id: sessionId,
        userId,
        destination,
        eta,
        checkInInterval: parseInt(checkInInterval),
        progress: 0,
        isActive: true,
        startTime: new Date(),
        nextCheckIn: new Date(Date.now() + parseInt(checkInInterval) * 60000),
        trustedContacts: trustedContacts.get(userId) || []
    };

    activeSessions.set(sessionId, session);

    res.status(201).json({
        sessionId,
        message: 'Guardian session started',
        data: session
    });
});

// Get current guardian status
router.get('/status', validateSession, (req, res) => {
    const session = req.session;

    // Simulate progress increasing over time
    const elapsed = (new Date() - session.startTime) / 1000 / 60; // minutes
    const totalTime = session.eta;
    session.progress = Math.min(82 + Math.floor(elapsed / totalTime * 18), 100);

    res.json({
        to: session.destination,
        eta: session.eta,
        progress: session.progress,
        complete: `${session.progress}% Complete`,
        isTrackingActive: session.isActive,
        trustedContacts: session.trustedContacts,
        nextCheckIn: session.nextCheckIn
    });
});

// Update guardian session
router.put('/update', validateSession, (req, res) => {
    const session = req.session;
    const { destination, eta, checkInInterval } = req.body;

    if (destination) session.destination = destination;
    if (eta) session.eta = eta;
    if (checkInInterval) {
        session.checkInInterval = parseInt(checkInInterval);
        session.nextCheckIn = new Date(Date.now() + parseInt(checkInInterval) * 60000);
    }

    res.json({
        message: 'Session updated successfully',
        data: session
    });
});

// Check-in during guardian session
router.post('/checkin', validateSession, (req, res) => {
    const session = req.session;

    // Update next check-in time
    session.nextCheckIn = new Date(Date.now() + session.checkInInterval * 60000);

    res.json({
        message: 'Check-in successful',
        nextCheckIn: session.nextCheckIn
    });
});

// End guardian session
router.post('/end', validateSession, (req, res) => {
    const sessionId = req.headers['session-id'] || req.query.sessionId;
    activeSessions.delete(sessionId);

    res.json({
        message: 'Guardian session ended successfully'
    });
});

// Get guardian settings
router.get('/settings', validateSession, (req, res) => {
    const session = req.session;

    res.json({
        checkInInterval: session.checkInInterval
    });
});

// Update guardian settings
router.put('/settings', validateSession, (req, res) => {
    const session = req.session;
    const { checkInInterval } = req.body;

    if (checkInInterval) {
        session.checkInInterval = parseInt(checkInInterval);
        session.nextCheckIn = new Date(Date.now() + parseInt(checkInInterval) * 60000);
    }

    res.json({
        message: 'Settings updated successfully',
        checkInInterval: session.checkInInterval
    });
});

// Get trusted contacts
router.get('/contacts', validateSession, (req, res) => {
    const session = req.session;

    res.json({
        trustedContacts: session.trustedContacts
    });
});

// Add a trusted contact
router.post('/contacts', validateSession, (req, res) => {
    const session = req.session;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({
            error: 'Contact name is required'
        });
    }

    const newContact = {
        id: uuidv4(),
        name,
        isMonitoring: true
    };

    session.trustedContacts.push(newContact);

    // Also update the main contacts storage
    if (!trustedContacts.has(session.userId)) {
        trustedContacts.set(session.userId, []);
    }
    trustedContacts.get(session.userId).push(newContact);

    res.status(201).json({
        message: 'Contact added successfully',
        contact: newContact
    });
});

// Toggle contact monitoring
router.put('/contacts/:contactId', validateSession, (req, res) => {
    const session = req.session;
    const { contactId } = req.params;
    const { isMonitoring } = req.body;

    const contact = session.trustedContacts.find(c => c.id === contactId);
    if (!contact) {
        return res.status(404).json({
            error: 'Contact not found'
        });
    }

    contact.isMonitoring = isMonitoring;

    // Also update the main contacts storage
    const userContacts = trustedContacts.get(session.userId) || [];
    const mainContact = userContacts.find(c => c.id === contactId);
    if (mainContact) {
        mainContact.isMonitoring = isMonitoring;
    }

    res.json({
        message: 'Contact updated successfully',
        contact
    });
});

export default router;