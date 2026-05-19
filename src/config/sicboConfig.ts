/**
 * Cấu hình trò chơi Sic Bo (client-side).
 * Thay đổi tại đây sẽ áp dụng cho game SicBo.tsx.
 */
export const SICBO_CONFIG = {
  /** Cho phép chọn nhiều ô cược cùng lúc (TÀI + XỈU) */
  allowMultipleZones: true,
  /** Số ô cược tối đa có thể chọn trong 1 ván */
  maxZonesPerBet: 2,
  /** Tỷ lệ trả thưởng TÀI/XỈU (1:1 = nhân 2) */
  payoutRatio: 2,
  /** Thời gian 1 chu kỳ (ms) - 299000 ≈ 5 phút */
  cycleTime: 299000,
  /** Thời gian đặt cược (ms) */
  bettingTime: 297000,
  /** Thời gian mở bát (ms) */
  revealingTime: 2000,
  /** Mệnh giá chip */
  chips: [10, 50, 100, 500, 1000],
  /** Cược tối thiểu */
  minBet: 10,
  /** Cược tối đa */
  maxBet: 10000,
} as const;
