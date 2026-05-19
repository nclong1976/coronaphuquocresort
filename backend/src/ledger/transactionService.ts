import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTransactions(userId: string, limit = 50, offset = 0) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

export async function getBets(userId: string, game?: string, limit = 50) {
  return prisma.bet.findMany({
    where: { userId, ...(game && { game }) },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
