import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Notification from '../models/Notification';
import GuardianSession from '../models/GuardianSession';
import Contact from '../models/Contact';

const router = Router();

// Database status endpoint
router.get('/database', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    
    // Get collection statistics
    const stats = {
      users: await User.countDocuments(),
      notifications: await Notification.countDocuments(),
      guardianSessions: await GuardianSession.countDocuments(),
      contacts: await Contact.countDocuments(),
      activeSessions: await GuardianSession.countDocuments({ isActive: true }),
      unreadNotifications: await Notification.countDocuments({ isRead: false })
    };

    res.json({
      status: 'ok',
      database: {
        status: dbStatus,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        collections: stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
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
      total: await Notification.countDocuments(),
      unread: await Notification.countDocuments({ isRead: false }),
      byType: {
        guardian_mode_started: await Notification.countDocuments({ type: 'guardian_mode_started' }),
        location_update: await Notification.countDocuments({ type: 'location_update' }),
        check_in_reminder: await Notification.countDocuments({ type: 'check_in_reminder' }),
        session_ended: await Notification.countDocuments({ type: 'session_ended' })
      },
      recent: await Notification.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      })
    };

    res.json({
      status: 'ok',
      notifications: notificationStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
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
      activeSessions: await GuardianSession.countDocuments({ isActive: true }),
      totalSessions: await GuardianSession.countDocuments(),
      recentSessions: await GuardianSession.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      }),
      averageSessionDuration: await calculateAverageSessionDuration()
    };

    res.json({
      status: 'ok',
      guardianMode: guardianStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Guardian mode status check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

async function calculateAverageSessionDuration() {
  try {
    const sessions = await GuardianSession.find({
      isActive: false,
      createdAt: { $exists: true },
      updatedAt: { $exists: true }
    }).limit(100);

    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((sum, session) => {
      const duration = session.updatedAt.getTime() - session.createdAt.getTime();
      return sum + duration;
    }, 0);

    return Math.round(totalDuration / sessions.length / (1000 * 60)); // Convert to minutes
  } catch (error) {
    return 0;
  }
}

export default router;
