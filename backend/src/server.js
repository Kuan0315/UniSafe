import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import guardianProfileRouter from './routes/guardianProfile';

// Routers
import authRouter from './routes/auth';
import contactsRouter from './routes/contacts';
import guardianRouter from './routes/guardian';
import locationsRouter from './routes/locations';
import universitiesRouter from './routes/universities';
import reportsRouter from './routes/reports';
import notificationsRouter from './routes/notifications';
import statusRouter from './routes/status';
import safetyAlertsRouter from './routes/safetyAlerts';
import sosRouter from './routes/sos';

// Models (register with mongoose)
import './models/User';
import './models/Contact';
import './models/GuardianSession';
import './models/Notification';
import './models/LocationUpdate';
import './models/Report';

// Database utils
import { initializeDatabase } from './database/init';
import { setupDatabaseConnection } from './database/connection';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import guardianAuthRouter from './routes/guardianAuth';
app.use('/api/auth', guardianAuthRouter);
import staffAuthRouter from './routes/staff';
app.use('/api/staff', staffAuthRouter);


app.use(bodyParser.json());

// --- File upload setup ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const upload = multer({ storage });

// --- File Upload API ---
app.post('/api/uploads', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const fileUrl = `${backendUrl}/uploads/${req.file.filename}`;
        res.json({ success: true, fileUrl });
    } catch (err) {
        console.error('❌ File upload error:', err);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// --- Serve uploaded files ---
app.use('/uploads', express.static(uploadDir));

dotenv.config();

// --- Environment defaults ---
process.env.MONGO_URI =
    process.env.MONGO_URI ||
    'mongodb+srv://unisafe:unisafestrongpass1234@cluster0.vjuq4ox.mongodb.net/unisafe?retryWrites=true&w=majority';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'changeme';
process.env.PORT = process.env.PORT || '4000';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:19006';
process.env.BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT}`;

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const backendUrl = process.env.BACKEND_URL;

// --- Middlewares ---
app.use(helmet());
app.use(
    cors({
        origin: (_origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) =>
            cb(null, true),
        credentials: true,
    })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Mock incidents (replace later with DB collection)
const mockIncidents = [
    { id: 1, title: "Robbery", lat: 3.121, lng: 101.653, type: "crime" },
    { id: 2, title: "Accident", lat: 3.118, lng: 101.655, type: "accident" },
];

app.get("/api/incidents", async (_req: Request, res: Response) => {
    try {
        res.json({ incidents: mockIncidents });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch incidents" });
    }
});

// --- Health Check ---
app.get('/api/health', async (_req, res) => {
    try {
        const dbState = mongoose.connection.readyState;
        const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

        const userCount = await mongoose.connection.db.collection('users').countDocuments();
        const notificationCount = await mongoose.connection.db
            .collection('notifications')
            .countDocuments();
        const sessionCount = await mongoose.connection.db
            .collection('guardiansessions')
            .countDocuments();

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            backendUrl,
            database: {
                status: dbStatus,
                collections: {
                    users: userCount,
                    notifications: notificationCount,
                    guardianSessions: sessionCount,
                },
            },
            services: {
                notifications: 'active',
                guardianMode: 'active',
                authentication: 'active',
            },
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// --- API Routes ---
app.use('/api/auth', authRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/guardian', guardianRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/universities', universitiesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/status', statusRouter);
app.use('/api/sos', sosRouter);
app.use('/api/alert', safetyAlertsRouter); 
// Mount route
app.use('/api/guardian', guardianProfileRouter);
// SOS Alert Schema
const sosSchema = new mongoose.Schema({
    userId: String,
    userName: String,
    userPhone: String,
    userPhoto: String,
    timestamp: { type: Date, default: Date.now },
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    mediaUrls: [{ url: String, type: String, thumbnail: String }],
    description: String,
    chatSummary: String,
    status: { type: String, default: 'active' }, // active, following, responding, resolved, false_alarm
    priority: { type: String, default: 'medium' },
    emergencyType: { type: String, default: 'general_emergency' },
    batteryLevel: Number,
    lastLocationUpdate: Date,
    isMoving: Boolean
});

const SOSAlert = mongoose.model('SOSAlert', sosSchema);

// Submit SOS
app.post('/sos', async (req, res) => {
    try {
        const sos = new SOSAlert(req.body);
        await sos.save();
        res.status(201).json({ message: 'SOS alert created', sos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create SOS alert' });
    }
});

// Update alert status
app.put('/sos/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const sos = await SOSAlert.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(sos);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update status' });
    }
});

// Get all SOS alerts
app.get('/sos', async (req, res) => {
    try {
        const alerts = await SOSAlert.find().sort({ timestamp: -1 });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch SOS alerts' });
    }
});

app.use('/api/safety-alerts', safetyAlertsRouter);

// --- Guardian Activation Push Notification ---
app.post('/api/guardian/activate', async (req: Request, res: Response) => {
    const { guardianPushToken, studentName } = req.body;

    if (!guardianPushToken || !studentName) {
        return res.status(400).json({ error: 'guardianPushToken and studentName are required' });
    }

    const message = {
        to: guardianPushToken,
        sound: 'default',
        title: 'Guardian Alert 🚨',
        body: `${studentName} has activated Guardian Mode. Tap to view location.`,
        data: { screen: 'GuardianLocation' },
    };

    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        res.json({ success: true, message: 'Notification sent to guardian' });
    } catch (err) {
        console.error('❌ Error sending guardian notification:', err);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// --- Start Server ---
async function start() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI not set');
        }

        setupDatabaseConnection();
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB:', mongoose.connection.name);

        await initializeDatabase();

        app.listen(port, () => {
            console.log(`🚀 Backend running on ${backendUrl}`);
            console.log(`📱 API base: ${backendUrl}/api`);
            console.log(`🔔 Notifications system ready`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

start();

export default app;

import express from "express";
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";

const app = express();
app.use(bodyParser.json());

// In-memory storage (replace with database in production)
const userLocations = new Map();
const guardianClients = new Map(); // userId -> Set of WS connections

// REST: Share location
app.post("/guardian/share-location", (req, res) => {
  const { userId, latitude, longitude, timestamp } = req.body;

  if (!userId || !latitude || !longitude) {
    return res.status(400).json({ status: "error", message: "Missing fields" });
  }

  const location = { userId, latitude, longitude, timestamp: timestamp || new Date().toISOString() };
  userLocations.set(userId, location);

  // Forward location to guardians subscribed via WebSocket
  if (guardianClients.has(userId)) {
    guardianClients.get(userId).forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: "location_update", data: location }));
      }
    });
  }

  res.json({ status: "success", message: "Location shared", locationId: Date.now().toString() });
});

// REST: Get last location
app.get("/guardian/live-location/:userId", (req, res) => {
  const { userId } = req.params;
  const location = userLocations.get(userId);

  if (!location) {
    return res.status(404).json({ status: "error", message: "No location found" });
  }

  res.json(location);
});

// Start HTTP server
const server = app.listen(4000, () => {
  console.log("🚀 Guardian API running on http://localhost:4000");
});

// WebSocket server for live updates
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  const userId = new URL(req.url, "http://localhost").pathname.split("/").pop();

  if (!guardianClients.has(userId)) {
    guardianClients.set(userId, new Set());
  }
  guardianClients.get(userId).add(ws);

  console.log(👀 Guardian subscribed to user ${userId});

  ws.on("close", () => {
    guardianClients.get(userId).delete(ws);
  });
});

const ws = new WebSocket("ws://localhost:4000/guardian/subscribe/12345");

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "location_update") {
    console.log("📍 New location:", message.data);
  }
};

