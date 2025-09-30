"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
const GuardianSession_1 = __importDefault(require("../models/GuardianSession"));
const Contact_1 = __importDefault(require("../models/Contact"));
const router = (0, express_1.Router)();
// Database status endpoint
router.get('/database', async (req, res) => {
    try {
        const dbState = mongoose_1.default.connection.readyState;
        const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
        // Get collection statistics
        const stats = {
            users: await User_1.default.countDocuments(),
            notifications: await Notification_1.default.countDocuments(),
            guardianSessions: await GuardianSession_1.default.countDocuments(),
            contacts: await Contact_1.default.countDocuments(),
            activeSessions: await GuardianSession_1.default.countDocuments({ isActive: true }),
            unreadNotifications: await Notification_1.default.countDocuments({ isRead: false })
        };
        res.json({
            status: 'ok',
            database: {
                status: dbStatus,
                name: mongoose_1.default.connection.name,
                host: mongoose_1.default.connection.host,
                port: mongoose_1.default.connection.port,
                collections: stats
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Database status check failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Notification system status
router.get('/notifications', async (req, res) => {
    try {
        const notificationStats = {
            total: await Notification_1.default.countDocuments(),
            unread: await Notification_1.default.countDocuments({ isRead: false }),
            byType: {
                guardian_mode_started: await Notification_1.default.countDocuments({ type: 'guardian_mode_started' }),
                location_update: await Notification_1.default.countDocuments({ type: 'location_update' }),
                check_in_reminder: await Notification_1.default.countDocuments({ type: 'check_in_reminder' }),
                session_ended: await Notification_1.default.countDocuments({ type: 'session_ended' })
            },
            recent: await Notification_1.default.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
            })
        };
        res.json({
            status: 'ok',
            notifications: notificationStats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Notification status check failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Guardian mode status
router.get('/guardian-mode', async (req, res) => {
    try {
        const guardianStats = {
            activeSessions: await GuardianSession_1.default.countDocuments({ isActive: true }),
            totalSessions: await GuardianSession_1.default.countDocuments(),
            recentSessions: await GuardianSession_1.default.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
            }),
            averageSessionDuration: await calculateAverageSessionDuration()
        };
        res.json({
            status: 'ok',
            guardianMode: guardianStats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Guardian mode status check failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
async function calculateAverageSessionDuration() {
    try {
        const sessions = await GuardianSession_1.default.find({
            isActive: false,
            createdAt: { $exists: true },
            updatedAt: { $exists: true }
        }).limit(100);
        if (sessions.length === 0)
            return 0;
        const totalDuration = sessions.reduce((sum, session) => {
            const duration = session.updatedAt.getTime() - session.createdAt.getTime();
            return sum + duration;
        }, 0);
        return Math.round(totalDuration / sessions.length / (1000 * 60)); // Convert to minutes
    }
    catch (error) {
        return 0;
    }
}
exports.default = router;
