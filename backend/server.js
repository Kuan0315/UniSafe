import express from 'express';
import 'dotenv/config';
import bodyParser from "body-parser";
import http from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import mysql from 'mysql2/promise';

// Import your modules
import "./config/LoadEnv.js";
import { sequelize } from './config/database.js';
import userRoutes from './routes/users.js';
import testRoutes from './routes/testRoutes.js';
import User from './models/User.js'; // Import your models
import Device from './models/Device.js';
import LocationUpdate from './models/LocationUpdate.js';
import emergencyRoutes from "./routes/emergencyRoutes.js";
// ...existing imports
import guardianRoutes from './routes/guardian.js'; // <-- import your guardian router
import followMeRoutes from './routes/followMe.js'; // <-- import your followMe router


const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

// ---------------------------
// Routes
// ---------------------------
// Mount emergency routes
app.use('/api/guardian', guardianRoutes);
app.use('/api/followme', followMeRoutes);
app.use("/api/emergency", emergencyRoutes);

app.use('/api/test', testRoutes);
app.use('/api', userRoutes);

// Test route
app.get('/api/test', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({ 
            success: true, 
            message: '✅ Server and database connected successfully!',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

// ---------------------------
// Safe DB sync & seed
// ---------------------------
const syncAndSeedDB = async () => {
    try {
        // Disable foreign key checks temporarily
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Drop child tables first to avoid FK errors
        await Device.drop();
        await LocationUpdate.drop();
        await User.drop();

        // Re-enable FK checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        // Sync models
        await sequelize.sync({ alter: true });
        console.log('✅ Database synced successfully.');

        // Seed sample users
        await User.bulkCreate([
            { name: 'Alice Johnson', email: 'alice@example.com', password: 'hashed_password1', phone: '+60123456789', role: 'student', studentId: 'S001' },
            { name: 'Bob Lee', email: 'bob@example.com', password: 'hashed_password2', phone: '+60198765432', role: 'staff' },
            { name: 'Charlie Wong', email: 'charlie@example.com', password: 'hashed_password3', phone: '+60122334455', role: 'security' },
            { name: 'Diana Tan', email: 'diana@example.com', password: 'hashed_password4', phone: '+60111222333', role: 'admin' },
            { name: 'Eva Chen', email: 'eva@example.com', password: 'hashed_password5', phone: '+60199887766', role: 'student', studentId: 'S002' },
        ]);
        console.log('✅ Sample users inserted.');
    } catch (err) {
        console.error('❌ Error syncing DB:', err);
    }
};

// ---------------------------
// HTTP + Socket.IO server
// ---------------------------
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            const allowedOrigins = [
                process.env.FRONTEND_URL,
                process.env.CORS_ORIGIN,
                'http://localhost:19006',
                'http://localhost:3000',
                'http://192.168.0.170:19006',
                'http://192.168.0.170:3000',
                'http://192.168.0.170:5000'
            ].filter(Boolean);

            if (!origin) return callback(null, true);
            const isExpoDev = origin.startsWith('exp://') || origin.startsWith('@exp://');
            const isAllowed = isExpoDev || allowedOrigins.some(o => origin === o || origin.startsWith(o));
            if (isAllowed) return callback(null, true);
            return callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        methods: ['GET','POST','PUT','DELETE','PATCH'],
        credentials: true
    }
});
app.set('io', io);

// ---------------------------
// Socket.IO events
// ---------------------------
const userSockets = new Map();
io.on('connection', (socket) => {
    console.log('✅ Socket connected:', socket.id);

    socket.on('join-user', (userId) => {
        socket.join(`user_${userId}`);
        userSockets.set(userId, socket.id);
        console.log(`User ${userId} joined their room`);
        socket.emit('connected', { message: 'Connected to UniSafe server', userId, timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', socket.id, reason);
        for (const [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                console.log(`User ${userId} disconnected`);
                break;
            }
        }
    });
});

// ---------------------------
// Cron jobs
// ---------------------------
cron.schedule('0 0 * * *', async () => {
    try {
        const { checkOverdueCheckins } = await import('./services/notificationService.js');
        await checkOverdueCheckins();
        console.log('Checked for overdue check-ins');
    } catch (err) {
        console.error('Error in cron job:', err);
    }
});

// ---------------------------
// Start server
// ---------------------------
const startServer = async () => {
    await syncAndSeedDB();
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
        console.log(`💻 Use your computer IPv4 to connect from mobile, e.g., http://192.168.0.170:${PORT}`);
    });
};

startServer();

// ---------------------------
// Graceful shutdown
// ---------------------------
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down...`);
    server.close(() => console.log('HTTP server closed'));
    io.close();
    process.exit(0);
};

['SIGINT', 'SIGTERM'].forEach(event => {
    process.on(event, () => gracefulShutdown(event));
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});
