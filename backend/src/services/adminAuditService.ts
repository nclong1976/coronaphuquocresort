// @ts-nocheck
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export type AdminAuditDelegate = {
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  findMany: (args: Record<string, unknown>) => Promise<any[]>;
  delete: (args: { where: { id: string } }) => Promise<unknown>;
};

/** Khi server chưa chạy `npx prisma generate` sau khi thêm model, delegate có thể undefined */
export function getAdminAuditDelegate(p: PrismaClient): AdminAuditDelegate | null {
  const d = (p as unknown as { adminAuditLog?: Partial<AdminAuditDelegate> }).adminAuditLog;
  if (!d?.findMany || !d.create) return null;
  return d as AdminAuditDelegate;
}

const DEBIT_TYPES = new Set(['bet', 'withdraw', 'lose']);
const CREDIT_TYPES = new Set(['win', 'deposit']);

export async function verifySuperAdmin(adminUserId: string, plainPassword: string): Promise<boolean> {
  if (!plainPassword || !adminUserId) return false;
  const u = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { username: true, password: true, role: true },
  });
  if (!u || String(u.role) !== 'super_admin') return false;
  return bcrypt.compare(String(plainPassword), u.password);
}

export async function logAdminAction(
  adminId: string,
  action: string,
  summary: string,
  meta?: Record<string, unknown>
): Promise<void> {
  const dlg = getAdminAuditDelegate(prisma);
  if (!dlg) {
    console.warn('AdminAuditLog: chạy `cd backend && npx prisma generate` rồi khởi động lại API.');
    return;
  }
  try {
    await dlg.create({
      data: {
        adminId,
        action,
        summary: summary.slice(0, 2000),
        meta: meta ? (meta as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (e) {
    console.warn('logAdminAction:', (e as Error).message);
  }
}

/** Đồng bộ lại previous/current balance và ví sau khi super admin sửa/xóa bút toán */
export async function replayUserLedger(userId: string): Promise<number> {
  const txs = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  let bal = 0;
  for (const t of txs) {
    const prev = bal;
    if (DEBIT_TYPES.has(t.type)) bal -= Number(t.amount);
    else if (CREDIT_TYPES.has(t.type)) bal += Number(t.amount);
    await prisma.transaction.update({
      where: { id: t.id },
      data: {
        previousBalance: new Prisma.Decimal(prev),
        currentBalance: new Prisma.Decimal(bal),
      },
    });
  }
  await prisma.wallet.upsert({
    where: { userId },
    create: { userId, balance: new Prisma.Decimal(Math.max(0, bal)) },
    update: { balance: new Prisma.Decimal(Math.max(0, bal)) },
  });
  return Math.max(0, bal);
}
