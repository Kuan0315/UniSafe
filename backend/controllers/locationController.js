import User from '../models/User.js';
import LocationUpdate from '../models/LocationUpdate.js';
import { sequelize } from '../config/database.js';
import { Op } from 'sequelize';

// Test database connection
export const testConnection = async (req, res) => {
    try {
        // Test raw SQL connection
        await sequelize.authenticate();
        
        // Test basic query
        const userCount = await User.count();
        const locationCount = await LocationUpdate.count();

        res.json({
            success: true,
            message: 'Database connection successful!',
            database: sequelize.config.database,
            userCount,
            locationCount,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Database connection test failed:', err);
        res.status(500).json({
            success: false,
            error: err.message,
            database: sequelize.config.database
        });
    }
};

// Test location update functionality
export const testLocationUpdate = async (req, res) => {
    try {
        const { userId, lat, lng } = req.body;

        // Test data validation
        if (!userId || typeof lat !== 'number' || typeof lng !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, lat, lng (numbers)'
            });
        }

        // Test user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: `User with ID ${userId} not found`
            });
        }

        // Test location update
        const point = { type: 'Point', coordinates: [lng, lat] };
        
        const updatedUser = await user.update({
            location: point,
            lastSeen: new Date()
        });

        // Test location update record creation
        const locationUpdate = await LocationUpdate.create({
            userId: userId,
            currentLocationLat: lat,
            currentLocationLng: lng,
            currentLocationTimestamp: new Date(),
            status: 'active'
        });

        res.json({
            success: true,
            message: 'Location update test successful!',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                location: updatedUser.location
            },
            locationUpdate: {
                id: locationUpdate.id,
                userId: locationUpdate.userId,
                lat: locationUpdate.currentLocationLat,
                lng: locationUpdate.currentLocationLng,
                timestamp: locationUpdate.currentLocationTimestamp
            }
        });

    } catch (err) {
        console.error('Location update test failed:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Get all test data
export const getAllTestData = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'lastSeen'],
            limit: 10
        });

        const locationUpdates = await LocationUpdate.findAll({
            attributes: ['id', 'userId', 'currentLocationLat', 'currentLocationLng', 'currentLocationTimestamp', 'status'],
            order: [['currentLocationTimestamp', 'DESC']],
            limit: 10
        });

        res.json({
            success: true,
            users: users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                lastSeen: user.lastSeen
            })),
            locationUpdates: locationUpdates.map(update => ({
                id: update.id,
                userId: update.userId,
                lat: update.currentLocationLat,
                lng: update.currentLocationLng,
                timestamp: update.currentLocationTimestamp,
                status: update.status
            })),
            totalUsers: await User.count(),
            totalLocationUpdates: await LocationUpdate.count()
        });

    } catch (err) {
        console.error('Get test data failed:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Reset test data (optional)
export const resetTestData = async (req, res) => {
    try {
        // Clear test location updates
        await LocationUpdate.destroy({
            where: {
                userId: { [Op.in]: [1, 2, 3] } // Adjust based on your test user IDs
            }
        });

        // Reset user locations
        await User.update({
            location: null,
            lastSeen: null
        }, {
            where: {
                id: { [Op.in]: [1, 2, 3] }
            }
        });

        res.json({
            success: true,
            message: 'Test data reset successfully'
        });

    } catch (err) {
        console.error('Reset test data failed:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};