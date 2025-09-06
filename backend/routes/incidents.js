// routes/incidentRoutes.js
import express from 'express';
import Incident from '../models/Incident.js';
import {
    reportIncident,
    getIncidents,
    getIncident,
    updateIncident,
    getIncidentStats
} from '../controllers/incidentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadMedia } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/report', uploadMedia('media'), reportIncident);
router.get('/', getIncidents);
router.get('/:id', getIncident);
router.put('/:id', authorize('security', 'admin'), updateIncident);
router.get('/stats/overview', getIncidentStats);

// Get all incidents
router.get('/', (req, res) => {
    const incident = new Incident();
    incident.getAll((err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: 'Success',
            data: rows
        });
        incident.close();
    });
});

// Get incident by ID
router.get('/:id', (req, res) => {
    const incident = new Incident();
    incident.getById(req.params.id, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Incident not found' });
            return;
        }
        res.json({
            message: 'Success',
            data: row
        });
        incident.close();
    });
});

// Create new incident
router.post('/', (req, res) => {
    const { type, description, location } = req.body;

    if (!type || !description || !location) {
        res.status(400).json({ error: 'Type, description, and location are required' });
        return;
    }

    const incident = new Incident();
    incident.create({ type, description, location }, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({
            message: 'Incident reported successfully',
            data: result
        });
        incident.close();
    });
});

// Update incident status
router.patch('/:id/status', (req, res) => {
    const { status } = req.body;

    if (!status) {
        res.status(400).json({ error: 'Status is required' });
        return;
    }

    const incident = new Incident();
    incident.updateStatus(req.params.id, status, (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: 'Incident status updated successfully'
        });
        incident.close();
    });
});

// Delete incident
router.delete('/:id', (req, res) => {
    const incident = new Incident();
    incident.delete(req.params.id, (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: 'Incident deleted successfully'
        });
        incident.close();
    });
});

export default router;
