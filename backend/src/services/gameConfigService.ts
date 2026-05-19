import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_GAMES = [
  'sicbo', 'baccarat', 'dragontiger', 'roulette', 'blackjack', 'slot',
  'baicao', 'tigerbaccarat', 'baccaratlongho', 'threecard', 'caribbean',
  'niuniu', 'texasholdem', 'russianpoker',
];

export async function isGameEnabled(gameId: string): Promise<boolean> {
  const config = await prisma.gameConfig.findUnique({ where: { gameId } });
  if (!config) return true;
  return config.enabled;
}

export async function getGameLimits(gameId: string): Promise<{ minBet: number; maxBet: number }> {
  const config = await prisma.gameConfig.findUnique({ where: { gameId } });
  if (!config) return { minBet: 10, maxBet: 10000 };
  return { minBet: Number(config.minBet), maxBet: Number(config.maxBet) };
}

export async function ensureGameConfigs(): Promise<void> {
  for (const gameId of DEFAULT_GAMES) {
    await prisma.gameConfig.upsert({
      where: { gameId },
      update: {},
      create: { gameId, enabled: true, minBet: 10, maxBet: 10000 },
    });
  }
}

export async function setGameEnabled(gameId: string, enabled: boolean): Promise<void> {
  await prisma.gameConfig.upsert({
    where: { gameId },
    update: { enabled },
    create: { gameId, enabled, minBet: 10, maxBet: 10000 },
  });
}

/** Sic Bo: không giới hạn số tiền cược, luôn bật. payoutBoost mặc định false (1:1). */
export async function ensureSicBoReady(): Promise<void> {
  await prisma.gameConfig.upsert({
    where: { gameId: 'sicbo' },
    update: { enabled: true, maxBet: 999999999 },
    create: { gameId: 'sicbo', enabled: true, minBet: 10, maxBet: 999999999, payoutBoost: false },
  });
}
