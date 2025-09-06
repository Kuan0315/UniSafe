import express from 'express';
import { auth } from '../middleware/auth.js';
import {
    createRoute,
    findRoutes,
    getRouteDetails,
    rateRoute,
    getPopularRoutes,
    updateRoute,
    getRouteStats
} from '../controllers/safeRouteController.js';

const router = express.Router();

// Create a new safe route
router.post('/create', auth, createRoute);

// Find safe routes between two points
router.get('/find', auth, findRoutes);

// Get route details
router.get('/:routeId', auth, getRouteDetails);

// Rate a route
router.post('/:routeId/rate', auth, rateRoute);

// Get popular routes
router.get('/popular', auth, getPopularRoutes);

// Update route (admin/creator only)
router.put('/:routeId', auth, updateRoute);

// Get route statistics (admin/security only)
router.get('/stats', auth, getRouteStats);

export default router;
