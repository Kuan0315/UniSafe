import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

import authRouter from './routes/auth';
import contactsRouter from './routes/contacts';
import guardianRouter from './routes/guardian';
import locationsRouter from './routes/locations';
import universitiesRouter from './routes/universities';
import reportsRouter from './routes/reports';

dotenv.config();
// Fallback defaults so it runs without .env creation
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://unisafe:unisafestrongpass1234@cluster0.vjuq4ox.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'changeme';
process.env.PORT = process.env.PORT || '4000';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:19006';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:19006';

app.use(helmet());
// Allow mobile (no Origin header) and any dev web origin
app.use(cors({ origin: (_origin, cb) => cb(null, true), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/guardian', guardianRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/universities', universitiesRouter);
app.use('/api/reports', reportsRouter);

async function start() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not set');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

export default app;

