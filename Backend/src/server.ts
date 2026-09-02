import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import ocrRoutes from './routes/ocrRoutes';
import errorMiddleware from './middleware/errorMiddleware';
import AppError from './utils/AppError';

import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);

  req.on('aborted', () => {
    console.log('[REQUEST ABORTED] Client aborted request');
  });

  req.on('close', () => {
    console.log('[REQUEST CLOSE] Request stream closed');
  });

  req.on('error', (err) => {
    console.log('[REQUEST ERROR]', err.message);
  });

  next();
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow requests from the React Native development server and any local origin.
// In production, restrict this to your actual domain(s).

app.use(
  cors({
    origin: '*', // Expo/React Native apps don't have a fixed origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body parsers ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static files (uploaded images) ──────────────────────────────────────────
// Serve /uploads/<filename> — easy to replace with a CDN/S3 redirect later

app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '7d',
  })
);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/ocr', ocrRoutes);

// ─── 404 — unmatched routes ───────────────────────────────────────────────────

app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('Route not found', 404));
});

// ─── Central error handler ────────────────────────────────────────────────────
// Must come AFTER all routes

app.use(errorMiddleware);

// ─── Start server ─────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3000', 10);

const startServer = async () => {
  // Connect to MongoDB first
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Health:    GET  http://localhost:${PORT}/health`);
    console.log(`🔐 Auth:      POST http://localhost:${PORT}/api/auth/signup`);
    console.log(`🔐 Auth:      POST http://localhost:${PORT}/api/auth/login`);
    console.log(`📦 Products:  GET  http://localhost:${PORT}/api/products`);
    console.log(`🔍 OCR:       POST http://localhost:${PORT}/api/ocr/extract`);
    console.log('');
  });
};

// ─── Graceful shutdown ────────────────────────────────────────────────────────

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('💥 Unhandled Promise Rejection:', reason);
  process.exit(1);
});

startServer();

export default app;
