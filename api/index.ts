/**
 * Vercel Serverless Function — Express adapter
 * Route: /api/* → backend Express app
 * Socket.io chạy ở polling mode (không cần WebSocket upgrade)
 */
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';

// Import routes
import authRoutes from '../backend/src/routes/authRoutes.js';
import walletRoutes from '../backend/src/routes/walletRoutes.js';
import gameRoutes from '../backend/src/routes/gameRoutes.js';
import transactionRoutes from '../backend/src/routes/transactionRoutes.js';
import adminRoutes from '../backend/src/routes/adminRoutes.js';
import supportRoutes from '../backend/src/routes/supportRoutes.js';
import siteContentRoutes from '../backend/src/routes/siteContentRoutes.js';
import { apiLimiter } from '../backend/src/middleware/rateLimit.js';
import { initSocket } from '../backend/src/socket/index.js';
import { setSocketIo } from '../backend/src/services/socketHub.js';
import { ensureGameConfigs, ensureSicBoReady } from '../backend/src/services/gameConfigService.js';

const app = express();
app.set('trust proxy', 1);

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '22mb' }));
app.use(apiLimiter);

app.use('/api/site-content', siteContentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));
app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

// Socket.io với polling mode (Vercel serverless compatible)
const httpServer = createServer(app);
const { io } = initSocket(httpServer);
setSocketIo(io);
app.set('io', io);

// Init game configs (non-blocking)
ensureGameConfigs().catch(console.warn);
ensureSicBoReady().catch(console.warn);

export default app;
