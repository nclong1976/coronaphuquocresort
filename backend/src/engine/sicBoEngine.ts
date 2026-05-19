import { getSicBoDice } from '../rng/provablyFair.js';

/**
 * Sic Bo Engine - Quy tắc trả thưởng:
 * Hệ thống CHỈ trả thưởng khi:
 * 1. Thời gian ván cược đã kết thúc (0:00)
 * 2. Kết quả xúc xắc trùng với ô cược người chơi đã chọn
 *
 * Timeline: 4:59 → 0:01 bát úp (đặt cược) | 0:00 mở bát, hiệu ứng, âm thanh, trả thưởng
 */
export interface SicBoBet {
  BIG?: number;
  SMALL?: number;
}

export interface SicBoResult {
  dice: [number, number, number];
  sum: number;
  result: 'BIG' | 'SMALL';
  winAmount: number;
  payout: number;
}

/**
 * Chỉ tính Tài và Xỉu theo tổng 3 xúc xắc.
 * 3 quân giống nhau (111, 222, ..., 666) cộng vào kết quả: sum 3-10 = Xỉu, sum 11-18 = Tài.
 */
export function playSicBo(
  bets: SicBoBet,
  serverSeed: string,
  clientSeed: string,
  nonce: number
): SicBoResult {
  const [d1, d2, d3] = getSicBoDice(serverSeed, clientSeed, nonce);
  const sum = d1 + d2 + d3;
  const result: 'BIG' | 'SMALL' = sum >= 11 ? 'BIG' : 'SMALL';

  let winAmount = 0;
  if (result === 'BIG' && (bets.BIG ?? 0) > 0) winAmount += (bets.BIG ?? 0) * 2;
  if (result === 'SMALL' && (bets.SMALL ?? 0) > 0) winAmount += (bets.SMALL ?? 0) * 2;

  const totalBet = (bets.BIG ?? 0) + (bets.SMALL ?? 0);
  const payout = winAmount - totalBet;

  return { dice: [d1, d2, d3], sum, result, winAmount, payout };
}
