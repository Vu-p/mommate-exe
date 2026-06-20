import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import carerRoutes from './routes/carerRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import contractRoutes from './routes/contractRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import userRoutes from './routes/userRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import messagingRoutes from './routes/messagingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import careProfileRoutes from './routes/careProfileRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

const normalizeOrigin = (origin?: string) => {
  if (!origin) return '';

  try {
    const url = new URL(origin.trim());
    return url.origin;
  } catch {
    return origin.trim().replace(/\/$/, '');
  }
};

const configuredOrigins = [
  process.env.APP_PUBLIC_URL,
  process.env.ADMIN_PUBLIC_URL,
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGINS,
]
  .flatMap((origin) => origin?.split(',') ?? [])
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const devOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

const allowedOrigins = new Set([
  ...configuredOrigins,
  ...(process.env.NODE_ENV === 'production' ? [] : devOrigins),
]);

// Middlewares
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(normalizeOrigin(origin))) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', 1);

const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });
const sensitiveLimiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false });

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/carers', carerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/messages', sensitiveLimiter, messagingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/care-profiles', careProfileRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('Mommate API is running...');
});

app.use(notFound);
app.use(errorHandler);
export default app;
