import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getBalance, executeLedgerEntry, ensureWallet } from '../ledger/walletService.js';
import { getBets } from '../ledger/transactionService.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const balance = await getBalance(userId);
    res.json({ balance });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/bets', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const game = (req.query.game as string) || undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 15, 50);
    const bets = await getBets(userId, game, limit);
    res.json({
      bets: bets.map((b) => ({
        id: b.id,
        game: b.game,
        roundId: b.roundId,
        betAmount: Number(b.betAmount),
        betData: b.betData as Record<string, number>,
        result: b.result,
        payout: Number(b.payout),
        createdAt: b.createdAt,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/**
 * POST /api/wallet/sync - Centralized wallet sync
 * Always fetches balance from DB (never trust client).
 * Used after each game round to update UI.
 */
router.post('/sync', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const balance = await getBalance(userId);
    res.json({ balance });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/deposit-request', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { amount, method, reference } = req.body;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }
    if (numAmount > 1000000) {
      res.status(400).json({ error: 'Amount exceeds limit' });
      return;
    }

    const deposit = await prisma.depositRequest.create({
      data: {
        userId,
        amount: new Prisma.Decimal(numAmount),
        method: method || 'bank',
        reference: reference || null,
        status: 'pending',
      },
    });

    res.json({
      id: deposit.id,
      amount: numAmount,
      status: 'pending',
      message: 'Deposit request submitted. Admin will process shortly.',
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/withdraw-request', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { amount, bankInfo } = req.body;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    const balance = await getBalance(userId);
    if (balance < numAmount) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    // Trừ tiền ngay khi tạo yêu cầu
    await ensureWallet(userId);
    const entry = await executeLedgerEntry({
      userId,
      type: 'withdraw',
      amount: numAmount,
      metadata: {},
    });
    if (!entry.success) {
      res.status(400).json({ error: entry.error || 'Insufficient balance' });
      return;
    }

    const withdraw = await prisma.withdrawRequest.create({
      data: {
        userId,
        amount: new Prisma.Decimal(numAmount),
        bankInfo: bankInfo || null,
        status: 'pending',
      },
    });

    const io = (req as any).app?.get?.('io');
    if (io) {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, email: true, fullName: true },
      });
      io.to('admin').emit('withdraw_pending', {
        id: withdraw.id,
        userId,
        amount: numAmount,
        createdAt: withdraw.createdAt,
        user: u ? { username: u.username, email: u.email, fullName: u.fullName } : null,
      });
    }

    res.json({
      id: withdraw.id,
      amount: numAmount,
      status: 'pending',
      message: 'Withdraw request submitted. Admin will process shortly.',
      newBalance: entry.newBalance,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/deposit-requests', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const list = await prisma.depositRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({
      requests: list.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        method: r.method,
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/withdraw-requests', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const list = await prisma.withdrawRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({
      requests: list.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
