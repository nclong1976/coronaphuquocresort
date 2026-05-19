import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { adminMiddleware, superAdminMiddleware } from '../middleware/adminAuth.js';
import { executeLedgerEntry, ensureWallet } from '../ledger/walletService.js';
import { setGameEnabled, ensureGameConfigs } from '../services/gameConfigService.js';
import { emitGameConfigUpdated } from '../services/gameConfigBroadcast.js';
import { normalizeWeekdaysInput, weekdaysToSig } from '../services/payoutWeekday.js';
import { buildAdminPayoutLivePayload } from '../services/payoutLiveService.js';
import { afterAdminNapTienCredit, sumValidNapTien } from '../services/vipAutoService.js';
import {
  getAdminAuditDelegate,
  logAdminAction,
  replayUserLedger,
  verifySuperAdmin,
} from '../services/adminAuditService.js';

const router = Router();
const prisma = new PrismaClient();

/** Tránh lỗi runtime Prisma `upsert` với unique 4 cột + JSON; dùng find + update/create. */
async function upsertGamePayoutConfigRow(input: {
  gameId: string;
  optionKey: string;
  startTime: string;
  endTime: string;
  ratio: number;
  wd: number[] | null;
  sig: string;
}): Promise<void> {
  const { gameId, optionKey, startTime, endTime, ratio, wd, sig } = input;
  const where = {
    gameId_optionKey_startTime_weekdaysSig: { gameId, optionKey, startTime, weekdaysSig: sig },
  };
  const dec = new Prisma.Decimal(Number(ratio).toFixed(2));
  const existing = await prisma.gamePayoutConfig.findUnique({ where });
  if (existing) {
    await prisma.gamePayoutConfig.update({
      where,
      data: {
        ratio: dec,
        endTime,
        weekdays: wd === null ? Prisma.DbNull : wd,
      },
    });
    return;
  }
  await prisma.gamePayoutConfig.create({
    data: {
      gameId,
      optionKey,
      startTime,
      endTime,
      ratio: dec,
      weekdaysSig: sig,
      ...(wd === null ? {} : { weekdays: wd as Prisma.InputJsonValue }),
    },
  });
}

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users/:id/bets', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '80'), 10) || 80));
    const bets = await prisma.bet.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json({
      bets: bets.map((b) => ({
        id: b.id,
        game: b.game,
        roundId: b.roundId,
        betAmount: Number(b.betAmount),
        betData: b.betData,
        result: b.result,
        payout: Number(b.payout),
        createdAt: b.createdAt,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const viewer = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { role: true },
    });
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isBanned: true,
        bankName: true,
        bankAccountNumber: true,
        withdrawPassword: true,
        adminPlainPassword: true,
        adminPlainWithdrawPin: true,
        totalDeposit: true,
        vipLevel: true,
        vipBonusDueAt: true,
        pendingVipBonusLevel: true,
        createdAt: true,
        lastLoginAt: true,
        lastLoginIp: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'super_admin' && viewer?.role !== 'super_admin') {
      return res.status(404).json({ error: 'User not found' });
    }

    const [wallet, transactions, loginHistory, withdrawSum, vipValidDepositTotal] = await Promise.all([
      prisma.wallet.findUnique({ where: { userId: id } }),
      prisma.transaction.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.userLoginHistory.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.transaction.aggregate({ where: { userId: id, type: 'withdraw' }, _sum: { amount: true } }),
      sumValidNapTien(id),
    ]);

    const { withdrawPassword: _wp, adminPlainPassword, adminPlainWithdrawPin, vipBonusDueAt: _vbd, pendingVipBonusLevel: _pvl, ...rest } =
      user!;
    res.json({
      user: {
        ...rest,
        balance: wallet ? Number(wallet.balance) : 0,
        hasWithdrawPassword: !!_wp,
        totalWithdraw: Number(withdrawSum._sum.amount ?? 0),
        loginPasswordPlain: adminPlainPassword ?? null,
        withdrawPinPlain: adminPlainWithdrawPin ?? null,
        vipValidDepositTotal,
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        game: t.game,
        createdAt: t.createdAt,
        metadata: t.metadata,
      })),
      loginHistory: loginHistory.map((l) => ({ ip: l.ip, userAgent: l.userAgent, createdAt: l.createdAt })),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/users/unban', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body;
    await prisma.user.update({ where: { id: userId }, data: { isBanned: false } });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await logAdminAction(req.userId!, 'user_unban', `Mở khóa tài khoản @${u?.username ?? userId}`, { userId });
    res.json({ success: true, message: 'User unbanned' });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/games', async (req: AuthRequest, res) => {
  try {
    const configs = await prisma.gameConfig.findMany({ orderBy: { gameId: 'asc' } });
    const betStats = await prisma.bet.groupBy({
      by: ['game'],
      _count: { id: true },
      _sum: { betAmount: true, payout: true },
    });
    const statsMap = new Map(betStats.map((b) => [b.game, { count: b._count.id, totalBet: Number(b._sum.betAmount ?? 0), totalPayout: Number(b._sum.payout ?? 0) }]));

    res.json({
      games: configs.map((g) => ({
        gameId: g.gameId,
        enabled: g.enabled,
        minBet: Number(g.minBet),
        maxBet: Number(g.maxBet),
        payoutBoost: g.payoutBoost ?? false,
        ...(statsMap.get(g.gameId) ?? { count: 0, totalBet: 0, totalPayout: 0 }),
      })),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/games/update-settings', async (req: AuthRequest, res) => {
  try {
    const { gameId, enabled, minBet, maxBet, payoutBoost } = req.body;
    const actor = await prisma.user.findUnique({ where: { id: req.userId! }, select: { role: true } });
    const touchesGameSwitchOrLimits =
      enabled !== undefined || minBet !== undefined || maxBet !== undefined;
    if (touchesGameSwitchOrLimits && actor?.role !== 'super_admin') {
      res.status(403).json({ error: 'Chỉ super admin được bật/tắt game hoặc đổi min/max bet' });
      return;
    }
    const update: Record<string, unknown> = {};
    if (enabled !== undefined) update.enabled = enabled;
    if (minBet !== undefined) update.minBet = minBet;
    if (maxBet !== undefined) update.maxBet = maxBet;
    if (payoutBoost !== undefined) update.payoutBoost = payoutBoost;
    await prisma.gameConfig.upsert({
      where: { gameId },
      update,
      create: { gameId, enabled: enabled ?? true, minBet: minBet ?? 10, maxBet: maxBet ?? 10000, payoutBoost: payoutBoost ?? false },
    });
    await emitGameConfigUpdated((req as any).app?.get?.('io'));
    await logAdminAction(req.userId!, 'game_settings', `Cập nhật cấu hình game ${gameId}`, { gameId, ...update });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/games/payout-configs', async (req: AuthRequest, res) => {
  try {
    const configs = await prisma.gamePayoutConfig.findMany({
      orderBy: [{ gameId: 'asc' }, { startTime: 'asc' }, { weekdaysSig: 'asc' }],
    });
    res.json({
      configs: configs.map((c) => ({
        id: c.id,
        gameId: c.gameId,
        optionKey: c.optionKey,
        ratio: Number(c.ratio),
        startTime: c.startTime,
        endTime: c.endTime,
        weekdaysSig: c.weekdaysSig,
        weekdays:
          Array.isArray(c.weekdays) && c.weekdays.length
            ? c.weekdays.map((x) => Number(x)).filter((n) => n >= 1 && n <= 7)
            : null,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/games/payout-live', async (req: AuthRequest, res) => {
  try {
    const payload = await buildAdminPayoutLivePayload();
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/games/payout-config', async (req: AuthRequest, res) => {
  try {
    const { gameId, optionKey, ratio, startTime, endTime, weekdays } = req.body;
    if (!gameId || !optionKey || ratio == null) return res.status(400).json({ error: 'gameId, optionKey, ratio required' });
    const r = Number(ratio);
    if (!Number.isFinite(r) || r <= 0) return res.status(400).json({ error: 'Invalid ratio' });
    const st = startTime || '00:00';
    const et = endTime || '23:59';
    const wd = normalizeWeekdaysInput(weekdays);
    const sig = weekdaysToSig(wd);
    await upsertGamePayoutConfigRow({
      gameId,
      optionKey,
      startTime: st,
      endTime: et,
      ratio: r,
      wd,
      sig,
    });
    await emitGameConfigUpdated((req as any).app?.get?.('io'));
    await logAdminAction(req.userId!, 'payout_config_row', `Payout ${gameId} · ${optionKey} ${st}-${et}`, { gameId, optionKey });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** Áp nhiều tỉ lệ cùng lúc (Corona Admin Payout). replaceAll = xóa mọi slot cũ của gameId trước khi ghi. */
router.post('/games/payout-config/bulk', async (req: AuthRequest, res) => {
  try {
    const { gameId, entries, replaceAll } = req.body as {
      gameId?: string;
      replaceAll?: boolean;
      entries?: Array<{ optionKey: string; ratio: number; startTime?: string; endTime?: string; weekdays?: number[] }>;
    };
    if (!gameId || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'gameId and entries[] required' });
    }
    if (replaceAll) {
      await prisma.gamePayoutConfig.deleteMany({ where: { gameId } });
    }
    for (const e of entries) {
      const r = Number(e.ratio);
      if (!e.optionKey || !Number.isFinite(r) || r <= 0) continue;
      const st = e.startTime || '00:00';
      const et = e.endTime || '23:59';
      const wd = normalizeWeekdaysInput(e.weekdays);
      const sig = weekdaysToSig(wd);
      await upsertGamePayoutConfigRow({
        gameId,
        optionKey: e.optionKey,
        startTime: st,
        endTime: et,
        ratio: r,
        wd,
        sig,
      });
    }
    await emitGameConfigUpdated((req as any).app?.get?.('io'));
    await logAdminAction(req.userId!, 'payout_bulk', `Bulk payout ${gameId} · ${entries.length} dòng${replaceAll ? ' (replaceAll)' : ''}`, {
      gameId,
      count: entries.length,
      replaceAll: !!replaceAll,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/chat/broadcast', async (req: AuthRequest, res) => {
  try {
    const { content, attachmentUrl, attachmentType } = req.body as {
      content?: string;
      attachmentUrl?: string | null;
      attachmentType?: string | null;
    };
    const contentStr = typeof content === 'string' ? content.trim().slice(0, 5000) : '';
    const attUrl = typeof attachmentUrl === 'string' && attachmentUrl.length > 0 ? attachmentUrl.slice(0, 2000) : null;
    const attType =
      typeof attachmentType === 'string' && attachmentType.length > 0 ? attachmentType.slice(0, 32) : attUrl ? 'file' : null;
    if (!contentStr && !attUrl) return res.status(400).json({ error: 'Cần nội dung hoặc file đính kèm' });
    const displayContent = contentStr || (attUrl ? '📎 Đính kèm từ Admin' : '');
    await prisma.supportMessage.create({
      data: {
        senderId: req.userId!,
        senderRole: 'admin',
        content: displayContent,
        attachmentUrl: attUrl,
        attachmentType: attUrl ? attType : null,
        targetUserId: null,
      },
    });
    const io = (req as any).app?.get?.('io');
    if (io) io.emit('admin_broadcast', { content: displayContent, attachmentUrl: attUrl, attachmentType: attUrl ? attType : null });
    await logAdminAction(req.userId!, 'chat_broadcast', 'Thông báo toàn hệ thống', {
      preview: displayContent.slice(0, 200),
      hasAttachment: !!attUrl,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/chat/direct', async (req: AuthRequest, res) => {
  try {
    const { targetUserId, content, attachmentUrl, attachmentType } = req.body as {
      targetUserId?: string;
      content?: string;
      attachmentUrl?: string | null;
      attachmentType?: string | null;
    };
    const contentStr = typeof content === 'string' ? content.trim().slice(0, 5000) : '';
    const attUrl = typeof attachmentUrl === 'string' && attachmentUrl.length > 0 ? attachmentUrl.slice(0, 2000) : null;
    const attType =
      typeof attachmentType === 'string' && attachmentType.length > 0 ? attachmentType.slice(0, 32) : attUrl ? 'file' : null;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId required' });
    if (!contentStr && !attUrl) return res.status(400).json({ error: 'Cần nội dung hoặc file đính kèm' });
    const displayContent = contentStr || (attUrl ? '📎 Đính kèm từ Admin' : '');
    await prisma.supportMessage.create({
      data: {
        senderId: req.userId!,
        senderRole: 'admin',
        content: displayContent,
        attachmentUrl: attUrl,
        attachmentType: attUrl ? attType : null,
        targetUserId,
      },
    });
    const io = (req as any).app?.get?.('io');
    if (io)
      io.to(`user:${targetUserId}`).emit('admin_direct', {
        content: displayContent,
        attachmentUrl: attUrl,
        attachmentType: attUrl ? attType : null,
      });
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { username: true },
    });
    await logAdminAction(req.userId!, 'chat_direct', `Gửi cá nhân → @${target?.username ?? targetUserId}`, {
      targetUserId,
      preview: displayContent.slice(0, 200),
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/users', async (req: AuthRequest, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    const me = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { role: true },
    });
    const hideSuperFromList = me?.role === 'admin' || me?.role === 'assistant';
    const parts: Prisma.UserWhereInput[] = [];
    if (search) {
      parts.push({
        OR: [
          { email: { contains: String(search), mode: 'insensitive' } },
          { username: { contains: String(search), mode: 'insensitive' } },
        ],
      });
    }
    if (hideSuperFromList) {
      parts.push({ role: { not: 'super_admin' } });
    }
    const where: Prisma.UserWhereInput = parts.length ? { AND: parts } : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: Number(offset),
        take: Number(limit),
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          isBanned: true,
          bankName: true,
          bankAccountNumber: true,
          createdAt: true,
          totalDeposit: true,
          vipLevel: true,
          adminPlainPassword: true,
          adminPlainWithdrawPin: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const userIds = users.map((u) => u.id);
    const [wallets, withdrawAgg] = await Promise.all([
      prisma.wallet.findMany({ where: { userId: { in: userIds } } }),
      prisma.transaction.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, type: 'withdraw' },
        _sum: { amount: true },
      }),
    ]);
    const walletMap = new Map(wallets.map((w) => [w.userId, Number(w.balance)]));
    const withdrawMap = new Map(withdrawAgg.map((r) => [r.userId, Number(r._sum.amount ?? 0)]));

    res.json({
      users: users.map((u) => {
        const { adminPlainPassword, adminPlainWithdrawPin, ...rest } = u;
        return {
          ...rest,
          balance: walletMap.get(u.id) ?? 0,
          totalDeposit: Number(u.totalDeposit ?? 0),
          totalWithdraw: withdrawMap.get(u.id) ?? 0,
          loginPasswordPlain: adminPlainPassword ?? null,
          withdrawPinPlain: adminPlainWithdrawPin ?? null,
        };
      }),
      total,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/transactions', async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit || '300'), 10) || 300));
    const { userId, type } = req.query;
    const whereLedger: Record<string, unknown> = {};
    if (userId) whereLedger.userId = userId;
    if (type) whereLedger.type = type;
    const hasLedgerFilter = Object.keys(whereLedger).length > 0;
    const takeEach = Math.min(800, limit * 3);

    const auditDlg = getAdminAuditDelegate(prisma);
    const [ledger, audits] = await Promise.all([
      prisma.transaction.findMany({
        where: hasLedgerFilter ? whereLedger : undefined,
        take: takeEach,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, username: true } } },
      }),
      hasLedgerFilter || !auditDlg
        ? Promise.resolve([] as any[])
        : auditDlg.findMany({
            take: takeEach,
            orderBy: { createdAt: 'desc' },
            include: { admin: { select: { username: true } } },
          }),
    ]);

    const feed = [
      ...ledger.map((t) => ({
        kind: 'ledger' as const,
        id: t.id,
        userId: t.userId,
        user: t.user,
        type: t.type,
        amount: Number(t.amount),
        previousBalance: Number(t.previousBalance),
        currentBalance: Number(t.currentBalance),
        game: t.game,
        createdAt: t.createdAt,
      })),
      ...audits.map((a) => ({
        kind: 'audit' as const,
        id: a.id,
        action: a.action,
        summary: a.summary,
        adminUsername: a.admin.username,
        meta: a.meta,
        createdAt: a.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    res.json({ feed, total: feed.length });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** Super admin (leo1102 + đúng MK): xóa dòng sổ cái hoặc nhật ký — không ghi audit mới */
router.post('/super/erase-feed-item', superAdminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { kind, id, superPassword } = req.body as {
      kind?: string;
      id?: string;
      superPassword?: string;
    };
    if (!id || (kind !== 'ledger' && kind !== 'audit')) {
      return res.status(400).json({ error: 'kind (ledger|audit) và id là bắt buộc' });
    }
    const ok = await verifySuperAdmin(req.userId!, String(superPassword || ''));
    if (!ok) return res.status(403).json({ error: 'Chỉ super admin (leo1102) + mật khẩu hợp lệ' });

    if (kind === 'audit') {
      const auditDlg = getAdminAuditDelegate(prisma);
      if (!auditDlg?.delete) {
        return res.status(503).json({
          error: 'Nhật ký admin chưa sẵn sàng. Chạy `npx prisma generate` trong thư mục backend và khởi động lại API.',
        });
      }
      await auditDlg.delete({ where: { id } });
      return res.json({ success: true });
    }

    const tx = await prisma.transaction.findUnique({ where: { id }, select: { userId: true } });
    if (!tx) return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    await prisma.transaction.delete({ where: { id } });
    await replayUserLedger(tx.userId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** Super admin: sửa amount/type một bút toán rồi replay sổ cái user — không ghi audit */
router.post('/super/patch-ledger', superAdminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id, superPassword, amount, type } = req.body as {
      id?: string;
      superPassword?: string;
      amount?: unknown;
      type?: string;
    };
    if (!id) return res.status(400).json({ error: 'id bắt buộc' });
    const ok = await verifySuperAdmin(req.userId!, String(superPassword || ''));
    if (!ok) return res.status(403).json({ error: 'Chỉ super admin (leo1102) + mật khẩu hợp lệ' });

    const allowed = new Set(['bet', 'win', 'lose', 'deposit', 'withdraw']);
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) return res.status(404).json({ error: 'Không tìm thấy giao dịch' });

    const data: { amount?: Prisma.Decimal; type?: string } = {};
    if (amount != null && Number.isFinite(Number(amount)) && Number(amount) >= 0) {
      data.amount = new Prisma.Decimal(Number(amount));
    }
    if (type != null && allowed.has(String(type))) {
      data.type = String(type);
    }
    if (!data.amount && !data.type) {
      return res.status(400).json({ error: 'Cần amount hoặc type hợp lệ' });
    }
    await prisma.transaction.update({ where: { id }, data });
    const newBal = await replayUserLedger(tx.userId);
    res.json({ success: true, newBalance: newBal });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** Danh sách tài khoản quản lý (admin / super) — chỉ super */
router.get('/super/staff-managers', superAdminMiddleware, async (req: AuthRequest, res) => {
  try {
    const managers = await prisma.user.findMany({
      where: { role: { in: ['admin', 'assistant', 'super_admin'] } },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isBanned: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ managers });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** Nâng tài khoản người chơi lên quản lý (admin) — chỉ super */
router.post('/super/promote-manager', superAdminMiddleware, async (req: AuthRequest, res) => {
  try {
    const username = String((req.body as { username?: string }).username || '').trim();
    if (!username) return res.status(400).json({ error: 'username required' });
    const u = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      select: { id: true, username: true, role: true },
    });
    if (!u) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    if (u.role !== 'user') return res.status(400).json({ error: 'Chỉ nâng được tài khoản người chơi thường' });
    await prisma.user.update({ where: { id: u.id }, data: { role: 'admin' } });
    await logAdminAction(req.userId!, 'promote_manager', `Thêm quản lý @${u.username}`, { userId: u.id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** Hạ quản lý về người chơi — chỉ super; không hạ chính mình */
router.post('/super/demote-manager', superAdminMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = String((req.body as { userId?: string }).userId || '');
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (userId === req.userId) return res.status(400).json({ error: 'Không thể thao tác trên chính mình' });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, role: true } });
    if (!u) return res.status(404).json({ error: 'Không tìm thấy' });
    if (u.role !== 'admin' && u.role !== 'assistant') {
      return res.status(400).json({ error: 'Chỉ hạ được tài khoản quản lý hoặc trợ lý' });
    }
    await prisma.user.update({ where: { id: userId }, data: { role: 'user' } });
    await logAdminAction(req.userId!, 'demote_manager', `Hạ quyền quản lý @${u.username}`, { userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** Nâng người chơi lên trợ lý (cùng quyền panel như admin) — chỉ super */
router.post('/super/promote-assistant', superAdminMiddleware, async (req: AuthRequest, res) => {
  try {
    const username = String((req.body as { username?: string }).username || '').trim();
    if (!username) return res.status(400).json({ error: 'username required' });
    const u = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      select: { id: true, username: true, role: true },
    });
    if (!u) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    if (u.role !== 'user') return res.status(400).json({ error: 'Chỉ nâng được tài khoản người chơi thường' });
    await prisma.user.update({ where: { id: u.id }, data: { role: 'assistant' } });
    await logAdminAction(req.userId!, 'promote_assistant', `Thêm trợ lý @${u.username}`, { userId: u.id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/deposits', async (req: AuthRequest, res) => {
  try {
    const { status = 'pending' } = req.query;
    const list = await prisma.depositRequest.findMany({
      where: status ? { status: String(status) } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, email: true, username: true, fullName: true } } },
    });
    res.json({
      deposits: list.map((d) => ({
        id: d.id,
        userId: d.userId,
        user: d.user,
        amount: Number(d.amount),
        method: d.method,
        reference: d.reference,
        status: d.status,
        createdAt: d.createdAt,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/withdraws', async (req: AuthRequest, res) => {
  try {
    const { status = 'pending' } = req.query;
    const list = await prisma.withdrawRequest.findMany({
      where: status ? { status: String(status) } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, email: true, username: true, fullName: true } } },
    });
    res.json({
      withdraws: list.map((w) => ({
        id: w.id,
        userId: w.userId,
        user: w.user,
        amount: Number(w.amount),
        bankInfo: w.bankInfo,
        status: w.status,
        createdAt: w.createdAt,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/deposit/approve', async (req: AuthRequest, res) => {
  try {
    const { id, adminNote } = req.body;
    if (!id) {
      res.status(400).json({ error: 'Deposit id required' });
      return;
    }
    const deposit = await prisma.depositRequest.findUnique({ where: { id } });
    if (!deposit) {
      res.status(404).json({ error: 'Deposit not found' });
      return;
    }
    if (deposit.status !== 'pending') {
      res.status(400).json({ error: 'Deposit already processed' });
      return;
    }

    const userId = deposit.userId;
    const depositAmount = Number(deposit.amount);

    await ensureWallet(userId);

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalDeposit: true },
    });
    const prevTotalDeposit = Number(dbUser?.totalDeposit ?? 0);
    const newTotalDeposit = prevTotalDeposit + depositAmount;

    const entry = await executeLedgerEntry({
      userId,
      type: 'deposit',
      amount: depositAmount,
      metadata: { depositId: id, method: deposit.method, reference: deposit.reference, source: 'deposit_request' },
    });
    if (!entry.success) {
      res.status(400).json({ error: entry.error });
      return;
    }

    await prisma.$transaction([
      prisma.depositRequest.update({
        where: { id },
        data: { status: 'approved', adminNote: adminNote || null, processedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          totalDeposit: new Prisma.Decimal(newTotalDeposit),
        },
      }),
    ]);

    const u = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await logAdminAction(req.userId!, 'deposit_approve', `Duyệt nạp $${depositAmount} — @${u?.username ?? userId}`, {
      depositId: id,
      userId,
      amount: depositAmount,
    });
    res.json({
      success: true,
      message: 'Deposit approved',
      newBalance: entry.newBalance,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/deposit/reject', async (req: AuthRequest, res) => {
  try {
    const { id, adminNote } = req.body;
    const deposit = await prisma.depositRequest.findUnique({ where: { id } });
    if (!deposit) {
      res.status(404).json({ error: 'Deposit not found' });
      return;
    }
    if (deposit.status !== 'pending') {
      res.status(400).json({ error: 'Deposit already processed' });
      return;
    }

    await prisma.depositRequest.update({
      where: { id },
      data: { status: 'rejected', adminNote: adminNote || null, processedAt: new Date() },
    });
    const u = await prisma.user.findUnique({ where: { id: deposit.userId }, select: { username: true } });
    await logAdminAction(req.userId!, 'deposit_reject', `Từ chối nạp $${Number(deposit.amount)} — @${u?.username ?? deposit.userId}`, {
      depositId: id,
      userId: deposit.userId,
    });
    res.json({ success: true, message: 'Deposit rejected' });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/withdraw/approve', async (req: AuthRequest, res) => {
  try {
    const { id, adminNote } = req.body;
    const withdraw = await prisma.withdrawRequest.findUnique({ where: { id } });
    if (!withdraw) {
      res.status(404).json({ error: 'Withdraw not found' });
      return;
    }
    if (withdraw.status !== 'pending') {
      res.status(400).json({ error: 'Withdraw already processed' });
      return;
    }

    // Tiền đã trừ khi tạo yêu cầu - chỉ cập nhật trạng thái
    await prisma.withdrawRequest.update({
      where: { id },
      data: { status: 'approved', adminNote: adminNote || null, processedAt: new Date() },
    });
    const u = await prisma.user.findUnique({ where: { id: withdraw.userId }, select: { username: true } });
    await logAdminAction(req.userId!, 'withdraw_approve', `Duyệt rút $${Number(withdraw.amount)} — @${u?.username ?? withdraw.userId}`, {
      withdrawId: id,
      userId: withdraw.userId,
    });
    res.json({ success: true, message: 'Withdraw approved' });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/withdraw/reject', async (req: AuthRequest, res) => {
  try {
    const { id, adminNote } = req.body;
    const withdraw = await prisma.withdrawRequest.findUnique({ where: { id } });
    if (!withdraw) {
      res.status(404).json({ error: 'Withdraw not found' });
      return;
    }
    if (withdraw.status !== 'pending') {
      res.status(400).json({ error: 'Withdraw already processed' });
      return;
    }

    // Hoàn tiền lại tài khoản người chơi khi admin từ chối
    const entry = await executeLedgerEntry({
      userId: withdraw.userId,
      type: 'deposit',
      amount: Number(withdraw.amount),
      metadata: { withdrawId: id, reason: 'reject_refund' },
    });
    if (!entry.success) {
      res.status(500).json({ error: entry.error || 'Failed to refund' });
      return;
    }

    await prisma.withdrawRequest.update({
      where: { id },
      data: { status: 'rejected', adminNote: adminNote || null, processedAt: new Date() },
    });
    const u = await prisma.user.findUnique({ where: { id: withdraw.userId }, select: { username: true } });
    await logAdminAction(req.userId!, 'withdraw_reject', `Từ chối rút (hoàn tiền) $${Number(withdraw.amount)} — @${u?.username ?? withdraw.userId}`, {
      withdrawId: id,
      userId: withdraw.userId,
    });
    res.json({ success: true, message: 'Withdraw rejected. Amount refunded.', newBalance: entry.newBalance });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/user/ban', async (req: AuthRequest, res) => {
  try {
    const { userId, banned } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId required' });
      return;
    }
    if (userId === req.userId) {
      res.status(400).json({ error: 'Cannot ban yourself' });
      return;
    }
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const caller = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { role: true },
    });
    if (
      (target.role === 'admin' || target.role === 'assistant' || target.role === 'super_admin') &&
      caller?.role !== 'super_admin'
    ) {
      res.status(403).json({ error: 'Không thể khóa tài khoản quản lý' });
      return;
    }
    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: !!banned },
    });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await logAdminAction(req.userId!, banned ? 'user_ban' : 'user_unban_panel', `${banned ? 'Khóa' : 'Mở'} tài khoản @${u?.username ?? userId}`, {
      userId,
      banned: !!banned,
    });
    res.json({ success: true, message: banned ? 'User banned' : 'User unbanned' });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/game/enable', async (req: AuthRequest, res) => {
  try {
    const { gameId, enabled } = req.body;
    await ensureGameConfigs();
    await setGameEnabled(gameId, !!enabled);
    await emitGameConfigUpdated((req as any).app?.get?.('io'));
    await logAdminAction(req.userId!, 'game_enable_toggle', `Game ${gameId} → ${enabled ? 'BẬT' : 'TẮT'}`, { gameId, enabled: !!enabled });
    res.json({ success: true, message: `Game ${gameId} ${enabled ? 'enabled' : 'disabled'}` });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/user/adjust-balance', async (req: AuthRequest, res) => {
  try {
    const { userId, amount, type, note, adjustReason } = req.body as {
      userId?: string;
      amount?: unknown;
      type?: string;
      note?: string;
      adjustReason?: string;
    };
    if (!userId || amount == null) return res.status(400).json({ error: 'userId and amount required' });
    const numAmount = Math.abs(Number(amount));
    if (!Number.isFinite(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    const isAdd = type === 'add';
    const io = (req as any).app?.get?.('io') ?? null;
    const allowed = new Set(['nap_tien', 'nop_phat', 'khuyen_mai', 'khac']);
    const reasonRaw = isAdd && adjustReason ? String(adjustReason) : '';
    const reason = isAdd ? (allowed.has(reasonRaw) ? reasonRaw : 'khac') : 'subtract';
    const metadata: Record<string, unknown> = { adminId: req.userId, note: note || null };
    if (isAdd) metadata.adminAdjustReason = reason;

    const entry = await executeLedgerEntry({
      userId,
      type: isAdd ? 'deposit' : 'withdraw',
      amount: numAmount,
      game: 'admin_adjust',
      metadata,
    });
    if (!entry.success) return res.status(400).json({ error: entry.error });

    if (isAdd && reason === 'nap_tien') {
      await afterAdminNapTienCredit(userId, io);
    }

    const u = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await logAdminAction(
      req.userId!,
      isAdd ? 'adjust_add' : 'adjust_subtract',
      `${isAdd ? 'Cộng' : 'Trừ'} $${numAmount} — @${u?.username ?? userId}${isAdd ? ` · ${reason}` : ''}`,
      { userId, amount: numAmount, type: isAdd ? 'add' : 'subtract', adjustReason: isAdd ? reason : undefined }
    );
    res.json({ success: true, newBalance: entry.newBalance });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/user/change-password', superAdminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'userId and newPassword (min 6 chars) required' });
    }
    const bcrypt = await import('bcrypt');
    const np = String(newPassword).slice(0, 128);
    const hash = await bcrypt.hash(String(newPassword), 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hash, adminPlainPassword: np } });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await logAdminAction(req.userId!, 'user_change_password', `Đổi mật khẩu user @${u?.username ?? userId}`, { userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/user/delete', superAdminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (userId === req.userId) return res.status(400).json({ error: 'Cannot delete yourself' });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, role: true } });
    if (!u) return res.status(404).json({ error: 'User not found' });
    if (u.role === 'super_admin') {
      return res.status(403).json({ error: 'Không thể xóa tài khoản này' });
    }
    await prisma.user.delete({ where: { id: userId } });
    await logAdminAction(req.userId!, 'user_delete', `Xóa vĩnh viễn @${u?.username ?? userId}`, { userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [userCount, transactionCount, totalDeposits, totalWithdraws, betCount, todayBets, todayPayouts, todayDeposits, todayWithdraws, betByHour, betByGame] =
      await Promise.all([
        prisma.user.count(),
        prisma.transaction.count(),
        prisma.transaction.aggregate({ where: { type: 'deposit' }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { type: 'withdraw' }, _sum: { amount: true } }),
        prisma.bet.count(),
        prisma.bet.aggregate({ where: { createdAt: { gte: today } }, _sum: { betAmount: true } }),
        prisma.bet.aggregate({ where: { createdAt: { gte: today }, payout: { gt: 0 } }, _sum: { payout: true } }),
        prisma.transaction.aggregate({ where: { type: 'deposit', createdAt: { gte: today } }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { type: 'withdraw', createdAt: { gte: today } }, _sum: { amount: true } }),
        prisma.bet.groupBy({ by: ['createdAt'], where: { createdAt: { gte: today } }, _sum: { betAmount: true } }),
        prisma.bet.groupBy({ by: ['game'], _count: { id: true }, _sum: { betAmount: true } }),
      ]);

    const totalBets = Number(todayBets._sum.betAmount ?? 0);
    const totalPayouts = Number(todayPayouts._sum.payout ?? 0);
    const profit = totalBets - totalPayouts;

    res.json({
      users: userCount,
      transactions: transactionCount,
      bets: betCount,
      totalDeposits: Number(totalDeposits._sum.amount ?? 0),
      totalWithdraws: Number(totalWithdraws._sum.amount ?? 0),
      todayBets: totalBets,
      todayPayouts: totalPayouts,
      todayProfit: profit,
      todayDeposits: Number(todayDeposits._sum.amount ?? 0),
      todayWithdraws: Number(todayWithdraws._sum.amount ?? 0),
      betByGame: betByGame.map((b) => ({ game: b.game, count: b._count.id, totalBet: Number(b._sum.betAmount ?? 0) })),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/withdrawals', async (req: AuthRequest, res) => {
  try {
    const { status = 'pending' } = req.query;
    const list = await prisma.withdrawRequest.findMany({
      where: status ? { status: String(status) } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, email: true, username: true, fullName: true } } },
    });
    res.json({
      withdrawals: list.map((w) => ({
        id: w.id,
        userId: w.userId,
        user: w.user,
        amount: Number(w.amount),
        bankInfo: w.bankInfo,
        status: w.status,
        createdAt: w.createdAt,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/site-content', superAdminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { entries } = req.body as { entries?: Record<string, string> };
    if (!entries || typeof entries !== 'object') {
      return res.status(400).json({ error: 'entries (object) required' });
    }
    for (const [key, value] of Object.entries(entries)) {
      if (typeof key !== 'string' || key.length > 200) continue;
      const v = String(value ?? '').slice(0, 100_000);
      await prisma.siteContent.upsert({
        where: { key },
        create: { key, value: v },
        update: { value: v },
      });
    }
    await logAdminAction(req.userId!, 'site_content_save', 'Cập nhật nội dung trang chủ / landing', {
      keyCount: Object.keys(entries).length,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
