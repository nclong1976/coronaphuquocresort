import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { betLimiter } from '../middleware/rateLimit.js';
import * as gameService from '../services/gameService.js';
import { getSicBoPayoutSnapshot } from '../services/payoutConfigService.js';
import { getSicBoRoundState } from '../services/sicBoRoundService.js';
import { ensureSicBoReady } from '../services/gameConfigService.js';
import { buildGameConfigBroadcastPayload } from '../services/gameConfigBroadcast.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

/** Catalog lobby + tỉ lệ Sic Bo — đồng bộ với sự kiện socket `game_config_updated`. */
router.get('/catalog', async (_req, res) => {
  try {
    const payload = await buildGameConfigBroadcastPayload();
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/sicbo/state', async (_req, res) => {
  try {
    const state = getSicBoRoundState();
    const serverTime = Date.now();
    res.json({ ...state, serverTime });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/sicbo/my-pending', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const state = getSicBoRoundState();
    if (state.phase !== 'betting') {
      return res.json({ hasPending: false, roundId: state.roundId });
    }
    const pending = await prisma.bet.findFirst({
      where: { userId, game: 'sicbo', roundId: state.roundId, result: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!pending) {
      return res.json({ hasPending: false, roundId: state.roundId });
    }
    const b = pending.betData as { BIG?: number; SMALL?: number };
    res.json({
      hasPending: true,
      roundId: pending.roundId,
      bets: { BIG: Number(b?.BIG ?? 0), SMALL: Number(b?.SMALL ?? 0) },
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.use(betLimiter);

router.get('/sicbo/payout', async (_req, res) => {
  try {
    const s = await getSicBoPayoutSnapshot();
    res.json({
      BIG: s.BIG,
      SMALL: s.SMALL,
      payoutBoost: s.payoutBoost,
      activeWindow: s.activeWindow,
      serverTime: s.serverTime,
      isoWeekday: s.isoWeekday,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/sicbo', async (req: AuthRequest, res) => {
  try {
    await ensureSicBoReady();
    const userId = req.userId!;
    const { bets, clientSeed } = req.body;
    const result = await gameService.playSicBoGame(userId, bets, clientSeed);
    res.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    console.error('[POST /sicbo]', msg);
    res.status(400).json({ error: msg });
  }
});

router.get('/sicbo/result', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const roundId = req.query.roundId as string;
    if (!roundId) return res.status(400).json({ error: 'roundId required' });
    const { getSicBoRoundResult } = await import('../services/sicBoRoundService.js');
    const result = await getSicBoRoundResult(userId, roundId);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/baccarat', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { bets, clientSeed } = req.body;
    const result = await gameService.playBaccaratGame(userId, bets, clientSeed);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/dragontiger', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { bets, clientSeed } = req.body;
    const result = await gameService.playDragonTigerGame(userId, bets, clientSeed);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/roulette', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { bets, clientSeed } = req.body;
    const result = await gameService.playRouletteGame(userId, bets, clientSeed);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/blackjack', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { amount, clientSeed } = req.body;
    const result = await gameService.playBlackjackGame(userId, amount, clientSeed);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/slot', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { amount, clientSeed } = req.body;
    const result = await gameService.playSlotGame(userId, amount ?? 0, clientSeed);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/tigerbaccarat', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { bets, clientSeed } = req.body;
    const result = await gameService.playTigerBaccaratGame(userId, bets ?? {}, clientSeed);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/baccaratlongho', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { bets, clientSeed } = req.body;
    const result = await gameService.playBaccaratLongHoGame(userId, bets ?? {}, clientSeed);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/baicao', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { bets, clientSeed } = req.body;
    const result = await gameService.playBaiCaoGame(userId, bets ?? {}, clientSeed);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/threecard', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { amount, clientSeed } = req.body;
    const result = await gameService.playThreeCardPokerGame(userId, amount ?? 0, clientSeed);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/caribbean', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { amount, clientSeed } = req.body;
    const result = await gameService.playCaribbeanStudGame(userId, amount ?? 0, clientSeed);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/niuniu', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { amount, clientSeed } = req.body;
    const result = await gameService.playNiuNiuGame(userId, amount ?? 0, clientSeed);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/texasholdem', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { amount, clientSeed } = req.body;
    const result = await gameService.playTexasHoldemGame(userId, amount ?? 0, clientSeed);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/russianpoker', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { amount, clientSeed } = req.body;
    const result = await gameService.playRussianPokerGame(userId, amount ?? 0, clientSeed);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
