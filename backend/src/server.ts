import 'dotenv/config';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import siteContentRoutes from './routes/siteContentRoutes.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { initSocket } from './socket/index.js';
import { ensureGameConfigs, ensureSicBoReady } from './services/gameConfigService.js';
import { setSocketIo } from './services/socketHub.js';
import { processDueVipBonuses } from './services/vipAutoService.js';

const app = express();
/** Sau Vite/nginx, request thường có X-Forwarded-For; express-rate-limit v7 throw nếu trust proxy = false → 500. */
const trustHops = process.env.TRUST_PROXY_HOPS;
app.set(
  'trust proxy',
  trustHops != null && String(trustHops).trim() !== '' ? Math.max(1, Number(trustHops) || 1) : 1,
);
const PORT = process.env.PORT || 4000;
const httpServer = http.createServer(app);

const corsOriginsList = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
/** Production: set CORS_ORIGINS (comma-separated). Dev: omit để cho phép mọi origin (tiện LAN / proxy). */
app.use(
  cors({
    origin: corsOriginsList.length > 0 ? corsOriginsList : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '22mb' }));
app.use(apiLimiter);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/site-content', siteContentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const { io } = initSocket(httpServer);
setSocketIo(io);
app.set('io', io);

setInterval(() => {
  processDueVipBonuses(io).catch((err) => console.warn('VIP bonus scheduler:', (err as Error).message));
}, 20_000);

async function start() {
  try {
    await ensureGameConfigs();
    await ensureSicBoReady();
  } catch (e) {
    console.warn('Game config init:', (e as Error).message);
  }
  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Casino API running on http://localhost:${PORT} (0.0.0.0:${PORT})`);
  });
}
start();
