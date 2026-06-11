// @ts-nocheck
import { Prisma } from '@prisma/client';

/** Thứ ISO: 1 = Thứ 2 … 7 = Chủ nhật */
export function getIsoWeekdayMon1Sun7(d: Date): number {
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const w = vn.getUTCDay();
  return w === 0 ? 7 : w;
}

export function timeHHMM(d: Date): string {
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const h = vn.getUTCHours().toString().padStart(2, '0');
  const m = vn.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** null = mọi ngày; mảng rỗng = mọi ngày; đủ 7 ngày = mọi ngày */
export function normalizeWeekdaysInput(raw: unknown): number[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const nums = raw.map((x) => Number(x)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 7);
  const uniq = [...new Set(nums)].sort((a, b) => a - b);
  if (uniq.length === 0 || uniq.length === 7) return null;
  return uniq;
}

export function weekdaysToSig(wd: number[] | null): string {
  if (wd == null || wd.length === 0) return '*';
  return wd.join('-');
}

export function matchesConfigWeekdays(weekdays: Prisma.JsonValue | null | undefined, at: Date): boolean {
  if (weekdays == null) return true;
  if (!Array.isArray(weekdays)) return true;
  if (weekdays.length === 0) return true;
  const iso = getIsoWeekdayMon1Sun7(at);
  return weekdays.some((x) => Number(x) === iso);
}
