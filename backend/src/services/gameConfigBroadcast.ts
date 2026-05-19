import { PrismaClient } from '@prisma/client';
import type { Server } from 'socket.io';
import { getSicBoPayoutSnapshot } from './payoutConfigService.js';

const prisma = new PrismaClient();

export type GameConfigBroadcastPayload = {
  updatedAt: number;
  games: Array<{
    gameId: string;
    enabled: boolean;
    minBet: number;
    maxBet: number;
    payoutBoost: boolean;
  }>;
  sicboPayout: { BIG: number; SMALL: number };
  sicboMeta: {
    payoutBoost: boolean;
    activeWindow: { startTime: string; endTime: string; weekdays: number[] | null } | null;
    serverTime: string;
    isoWeekday: number;
  };
};

export async function buildGameConfigBroadcastPayload(): Promise<GameConfigBroadcastPayload> {
  const configs = await prisma.gameConfig.findMany({ orderBy: { gameId: 'asc' } });
  const sic = await getSicBoPayoutSnapshot();
  return {
    updatedAt: Date.now(),
    games: configs.map((g) => ({
      gameId: g.gameId,
      enabled: g.enabled,
      minBet: Number(g.minBet),
      maxBet: Number(g.maxBet),
      payoutBoost: g.payoutBoost ?? false,
    })),
    sicboPayout: { BIG: sic.BIG, SMALL: sic.SMALL },
    sicboMeta: {
      payoutBoost: sic.payoutBoost,
      activeWindow: sic.activeWindow,
      serverTime: sic.serverTime,
      isoWeekday: sic.isoWeekday,
    },
  };
}

/** Gửi tới mọi client đang nối socket (người chơi + admin) để lobby / Sic Bo cập nhật tức thì. */
export async function emitGameConfigUpdated(io: Server | undefined | null): Promise<void> {
  if (!io) return;
  try {
    const payload = await buildGameConfigBroadcastPayload();
    io.emit('game_config_updated', payload);
  } catch (e) {
    console.warn('[emitGameConfigUpdated]', (e as Error).message);
  }
}
