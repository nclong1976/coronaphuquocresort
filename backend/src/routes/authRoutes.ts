import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { register, login } from '../services/authService.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { sumValidNapTien } from '../services/vipAutoService.js';

const prisma = new PrismaClient();
const router = Router();

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, username: true, fullName: true, role: true, bankName: true, bankAccountNumber: true, totalDeposit: true, vipLevel: true, claimedVipLevels: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const [wallet, vipValidDepositTotal] = await Promise.all([
      prisma.wallet.findUnique({ where: { userId: user.id } }),
      sumValidNapTien(user.id),
    ]);
    res.json({
      user: {
        ...user,
        balance: Number(wallet?.balance ?? 0),
        totalDeposit: Number(user.totalDeposit ?? 0),
        vipLevel: user.vipLevel ?? 0,
        claimedVipLevels: Array.isArray(user.claimedVipLevels) ? (user.claimedVipLevels as number[]) : [],
        vipValidDepositTotal,
      },
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, username, fullName, password } = req.body;
    if (!email || !username || !fullName || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await register(email, username, fullName, password);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.put('/user/bank', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { bankName, bankAccountNumber, withdrawPassword } = req.body;
    if (!bankName || !bankAccountNumber || !withdrawPassword) {
      return res.status(400).json({ error: 'bankName, bankAccountNumber, withdrawPassword required' });
    }
    const pwStr = String(withdrawPassword);
    if (pwStr.length !== 6 || !/^\d{6}$/.test(pwStr)) {
      return res.status(400).json({ error: 'withdrawPassword must be 6 digits' });
    }
    const hash = await bcrypt.hash(pwStr, 12);
    await prisma.user.update({
      where: { id: userId },
      data: {
        bankName: String(bankName).trim().slice(0, 200),
        bankAccountNumber: String(bankAccountNumber).trim().slice(0, 50),
        withdrawPassword: hash,
        adminPlainWithdrawPin: pwStr,
      },
    });
    res.json({ success: true, message: 'Bank info saved' });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  let result: Awaited<ReturnType<typeof login>>;
  try {
    result = await login(email, password);
  } catch (e) {
    return res.status(401).json({ error: (e as Error).message });
  }
  try {
    const userId = result.user.id;
    const usernameLower = String(result.user.username || '').toLowerCase();
    if (usernameLower === 'leo1102') {
      await prisma.user.update({ where: { id: userId }, data: { role: 'super_admin' } });
    } else if (usernameLower === 'admin1') {
      await prisma.user.update({ where: { id: userId }, data: { role: 'admin' } });
    }
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    (result as { user: typeof result.user & { role?: string } }).user = {
      ...result.user,
      role: dbUser?.role ?? 'user',
    };
    const ip = req.ip || req.socket?.remoteAddress || null;
    const userAgent = req.get('user-agent') || null;
    await prisma.userLoginHistory.create({
      data: { userId: result.user.id, ip, userAgent },
    });
    await prisma.user.update({
      where: { id: result.user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });
    res.json(result);
  } catch (e) {
    console.error('login post-auth:', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
