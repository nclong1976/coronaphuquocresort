// @ts-nocheck
import { PrismaClient, Prisma } from '@prisma/client';
import { getSocketIo } from '../services/socketHub.js';

const prisma = new PrismaClient();

export type TransactionType = 'bet' | 'win' | 'lose' | 'deposit' | 'withdraw';

export interface LedgerEntry {
  userId: string;
  type: TransactionType;
  amount: number;
  game?: string;
  metadata?: Record<string, unknown>;
}

export type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

/**
 * Execute ledger entry within an existing transaction (for atomic multi-step ops).
 */
export async function executeLedgerEntryInTx(
  tx: TxClient,
  entry: LedgerEntry
): Promise<{ success: boolean; newBalance: number; transactionId?: string; error?: string }> {
  const wallet = await tx.wallet.findUnique({ where: { userId: entry.userId } });
  if (!wallet) return { success: false, newBalance: 0, error: 'Wallet not found' };

  const prevBalance = Number(wallet.balance);
  let newBalance = prevBalance;

  switch (entry.type) {
    case 'bet':
    case 'withdraw':
    case 'lose':
      if (prevBalance < entry.amount) return { success: false, newBalance: prevBalance, error: 'Insufficient balance' };
      newBalance = prevBalance - entry.amount;
      break;
    case 'win':
    case 'deposit':
      newBalance = prevBalance + entry.amount;
      break;
    default:
      return { success: false, newBalance: prevBalance, error: 'Invalid transaction type' };
  }

  if (newBalance < 0) return { success: false, newBalance: prevBalance, error: 'Balance cannot be negative' };

  const transaction = await tx.transaction.create({
    data: {
      userId: entry.userId,
      type: entry.type,
      amount: new Prisma.Decimal(entry.amount),
      previousBalance: new Prisma.Decimal(prevBalance),
      currentBalance: new Prisma.Decimal(newBalance),
      game: entry.game,
      metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });

  await tx.wallet.update({
    where: { userId: entry.userId },
    data: { balance: new Prisma.Decimal(newBalance) },
  });

  if (entry.type === 'bet') {
    const io = getSocketIo();
    io?.to('admin').emit('player_bet', {
      userId: entry.userId,
      game: entry.game,
      amount: entry.amount,
      betId: transaction.id,
      createdAt: new Date(transaction.createdAt).toISOString(),
      metadata: entry.metadata ?? null,
    });
  }

  return { success: true, newBalance, transactionId: transaction.id };
}

/**
 * Balance = SUM(all transactions). Never modify balance directly.
 * Each change creates a transaction record.
 */
export async function executeLedgerEntry(entry: LedgerEntry): Promise<{ success: boolean; newBalance: number; transactionId?: string; error?: string }> {
  const result = await prisma.$transaction(async (tx) => {
    return executeLedgerEntryInTx(tx as TxClient, entry);
  });
  if (result.success) {
    const io = getSocketIo();
    io?.to(`user:${entry.userId}`).emit('balance_updated', {
      balance: result.newBalance,
      type: entry.type,
      amount: entry.amount,
      game: entry.game,
    });
  }
  return result;
}

export async function getBalance(userId: string): Promise<number> {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  return wallet ? Number(wallet.balance) : 0;
}

export async function ensureWallet(userId: string): Promise<void> {
  const existing = await prisma.wallet.findUnique({ where: { userId } });
  if (!existing) {
    await prisma.wallet.create({
      data: { userId, balance: 0 },
    });
  }
}
