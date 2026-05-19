import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getTransactions } from '../ledger/transactionService.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const transactions = await getTransactions(userId, limit, offset);
    res.json({ transactions });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
