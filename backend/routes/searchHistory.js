import express from 'express';
import SearchHistory from '../models/SearchHistory.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Save a search query
router.post('/', auth, async (req, res) => {
    try {
        const { query } = req.body;
        const history = new SearchHistory({
            userId: req.user.id,
            query,
        });
        await history.save();
        res.status(201).json({ message: 'Search saved', history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error saving search' });
    }
});

// Get all history for current user
router.get('/', auth, async (req, res) => {
    try {
        const history = await SearchHistory.find({ userId: req.user.id }).sort({ timestamp: -1 });
        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching history' });
    }
});

export default router;
