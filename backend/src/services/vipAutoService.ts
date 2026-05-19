import { PrismaClient, Prisma } from '@prisma/client';
import { executeLedgerEntry } from '../ledger/walletService.js';
import type { Server } from 'socket.io';

const prisma = new PrismaClient();

/** Bảng VIP — tổng nạp hợp lệ = cộng tiền admin lý do Nạp tiền */
export const VIP_AUTO_TABLE = [
  { level: 0, threshold: 0, bonus: 0 },
  { level: 1, threshold: 5000, bonus: 388 },
  { level: 2, threshold: 10000, bonus: 1000 },
  { level: 3, threshold: 20000, bonus: 2000 },
  { level: 4, threshold: 40000, bonus: 4000 },
  { level: 5, threshold: 60000, bonus: 7000 },
  { level: 6, threshold: 100000, bonus: 14000 },
  { level: 7, threshold: 150000, bonus: 30000 },
  { level: 8, threshold: 200000, bonus: 45000 },
  { level: 9, threshold: 400000, bonus: 90000 },
  { level: 10, threshold: 600000, bonus: 140000 },
] as const;

export async function sumValidNapTien(userId: string): Promise<number> {
  const rows = await prisma.transaction.findMany({
    where: { userId, type: 'deposit', game: 'admin_adjust' },
    select: { amount: true, metadata: true },
  });
  let s = 0;
  for (const r of rows) {
    const m = r.metadata as Record<string, unknown> | null;
    if (m?.adminAdjustReason === 'nap_tien') s += Number(r.amount);
  }
  return s;
}

export function vipLevelFromValidDeposit(total: number): number {
  let lvl = 0;
  for (let i = VIP_AUTO_TABLE.length - 1; i >= 0; i--) {
    if (total >= VIP_AUTO_TABLE[i].threshold) {
      lvl = VIP_AUTO_TABLE[i].level;
      break;
    }
  }
  return lvl;
}

/** Sau khi ghi nhận giao dịch cộng tiền lý do Nạp tiền — kiểm tra lên VIP + hẹn thưởng 5 phút */
export async function afterAdminNapTienCredit(userId: string, io: Server | null): Promise<void> {
  const valid = await sumValidNapTien(userId);
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { vipLevel: true },
  });
  if (!u) return;
  const newLevel = vipLevelFromValidDeposit(valid);
  const oldLevel = u.vipLevel ?? 0;
  if (newLevel > oldLevel) {
    const due = new Date(Date.now() + 5 * 60 * 1000);
    await prisma.user.update({
      where: { id: userId },
      data: {
        vipLevel: newLevel,
        vipBonusDueAt: due,
        pendingVipBonusLevel: newLevel,
      },
    });
    io?.to(`user:${userId}`).emit('user_vip_updated', { vipLevel: newLevel, vipValidDepositTotal: valid });
  }
}

export async function processDueVipBonuses(io: Server | null): Promise<void> {
  const now = new Date();
  const due = await prisma.user.findMany({
    where: {
      pendingVipBonusLevel: { not: null },
      vipBonusDueAt: { lte: now },
    },
    take: 50,
  });
  for (const u of due) {
    const level = u.pendingVipBonusLevel!;
    const claimed = Array.isArray(u.claimedVipLevels) ? ([...(u.claimedVipLevels as number[])] as number[]) : [];
    if (claimed.includes(level)) {
      await prisma.user.update({
        where: { id: u.id },
        data: { vipBonusDueAt: null, pendingVipBonusLevel: null },
      });
      continue;
    }
    const row = VIP_AUTO_TABLE.find((v) => v.level === level);
    const bonus = row?.bonus ?? 0;
    if (bonus <= 0) {
      await prisma.user.update({
        where: { id: u.id },
        data: { vipBonusDueAt: null, pendingVipBonusLevel: null },
      });
      continue;
    }
    const entry = await executeLedgerEntry({
      userId: u.id,
      type: 'deposit',
      amount: bonus,
      game: 'vip_auto_bonus',
      metadata: { vipLevel: level, source: 'vip_auto_tier_bonus' },
    });
    if (!entry.success) continue;
    const newClaimed = [...new Set([...claimed, level])];
    await prisma.user.update({
      where: { id: u.id },
      data: {
        claimedVipLevels: newClaimed as Prisma.InputJsonValue,
        vipBonusDueAt: null,
        pendingVipBonusLevel: null,
      },
    });
    io?.to(`user:${u.id}`).emit('vip_bonus_credited', {
      message: 'Hệ thống đã cộng tiền VIP thành công vào tài khoản quý khách',
      amount: bonus,
      vipLevel: level,
      newBalance: entry.newBalance,
    });
  }
}
