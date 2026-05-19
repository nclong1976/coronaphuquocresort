/**
 * Lấy tỉ lệ trả thưởng theo game, khung giờ và thứ trong tuần.
 * Sic Bo: mặc định 1:1 (ratio 2). Khi admin Bật payoutBoost → dùng GamePayoutConfig.
 */
import { Prisma, PrismaClient } from '@prisma/client';
import {
  getIsoWeekdayMon1Sun7,
  matchesConfigWeekdays,
  timeHHMM,
} from './payoutWeekday.js';

const prisma = new PrismaClient();

export function getServerTimeHHMM(): string {
  return timeHHMM(new Date());
}

function isInRange(current: string, start: string, end: string): boolean {
  if (start <= end) return current >= start && current <= end;
  return current >= start || current <= end;
}

function storedWeekdaysLabel(w: Prisma.JsonValue | null): number[] | null {
  if (w == null) return null;
  if (!Array.isArray(w) || w.length === 0) return null;
  return w.map((x) => Number(x)).filter((n) => n >= 1 && n <= 7);
}

/** Tổng trả về = cược × ratio (đã gồm vốn). Lợi nhuận = cược × (ratio − 1). Hiển thị 1:(ratio−1). */
const SICBO_DEFAULT_RATIO = 2; // 1:1 → ratio 2

export type SicBoActiveWindow = {
  startTime: string;
  endTime: string;
  /** null = áp mọi ngày */
  weekdays: number[] | null;
};

export type SicBoPayoutSnapshot = {
  BIG: number;
  SMALL: number;
  payoutBoost: boolean;
  activeWindow: SicBoActiveWindow | null;
  serverTime: string;
  isoWeekday: number;
};

/** Một lần đọc DB — dùng cho API, broadcast và ván Sic Bo. */
export async function getSicBoPayoutSnapshot(at: Date = new Date()): Promise<SicBoPayoutSnapshot> {
  const serverTime = timeHHMM(at);
  const isoWeekday = getIsoWeekdayMon1Sun7(at);
  const gameConfig = await prisma.gameConfig.findUnique({ where: { gameId: 'sicbo' } });
  const payoutBoost = gameConfig?.payoutBoost ?? false;

  if (!payoutBoost) {
    return {
      BIG: SICBO_DEFAULT_RATIO,
      SMALL: SICBO_DEFAULT_RATIO,
      payoutBoost: false,
      activeWindow: null,
      serverTime,
      isoWeekday,
    };
  }

  const [configsBig, configsSmall] = await Promise.all([
    prisma.gamePayoutConfig.findMany({ where: { gameId: 'sicbo', optionKey: 'BIG' }, orderBy: { startTime: 'asc' } }),
    prisma.gamePayoutConfig.findMany({ where: { gameId: 'sicbo', optionKey: 'SMALL' }, orderBy: { startTime: 'asc' } }),
  ]);

  const matchB = configsBig.find(
    (c) => isInRange(serverTime, c.startTime, c.endTime) && matchesConfigWeekdays(c.weekdays, at)
  );
  const matchS = configsSmall.find(
    (c) => isInRange(serverTime, c.startTime, c.endTime) && matchesConfigWeekdays(c.weekdays, at)
  );

  const big = matchB ? Number(matchB.ratio) : SICBO_DEFAULT_RATIO;
  const small = matchS ? Number(matchS.ratio) : SICBO_DEFAULT_RATIO;

  let activeWindow: SicBoActiveWindow | null = null;
  if (matchB) {
    activeWindow = {
      startTime: matchB.startTime,
      endTime: matchB.endTime,
      weekdays: storedWeekdaysLabel(matchB.weekdays),
    };
  } else if (matchS) {
    activeWindow = {
      startTime: matchS.startTime,
      endTime: matchS.endTime,
      weekdays: storedWeekdaysLabel(matchS.weekdays),
    };
  }

  return { BIG: big, SMALL: small, payoutBoost: true, activeWindow, serverTime, isoWeekday };
}

/**
 * Lấy tỉ lệ trả thưởng cho optionKey (BIG, SMALL) của sicbo.
 * - Khi payoutBoost = false: luôn 1:1 (ratio 2)
 * - Khi payoutBoost = true: dùng GamePayoutConfig theo khung giờ + thứ
 */
export async function getSicBoPayoutRatio(optionKey: 'BIG' | 'SMALL'): Promise<number> {
  const s = await getSicBoPayoutSnapshot();
  return optionKey === 'BIG' ? s.BIG : s.SMALL;
}

/**
 * Tỉ lệ trả thưởng theo khung giờ + thứ — Tiger Baccarat, Long Hổ, Bài Cào, v.v.
 */
export async function getTimedPayoutRatio(gameId: string, optionKey: string, fallback: number, at: Date = new Date()): Promise<number> {
  const configs = await prisma.gamePayoutConfig.findMany({
    where: { gameId, optionKey },
    orderBy: { startTime: 'asc' },
  });
  if (configs.length === 0) return fallback;
  const hh = timeHHMM(at);
  const match = configs.find(
    (c) => isInRange(hh, c.startTime, c.endTime) && matchesConfigWeekdays(c.weekdays, at)
  );
  return match ? Number(match.ratio) : fallback;
}
