/** Bảng cấp VIP — đồng bộ với luồng người chơi (tổng nạp USD / thưởng). */
export const VIP_LEVEL_ROWS = [
  { name: 'VIP 0', gradient: 'from-gray-300 to-gray-500', totalDeposit: 0, vipReward: 0 },
  { name: 'VIP 1', gradient: 'from-slate-300 to-blue-400', totalDeposit: 5000, vipReward: 388 },
  { name: 'VIP 2', gradient: 'from-orange-300 to-orange-600', totalDeposit: 10000, vipReward: 1000 },
  { name: 'VIP 3', gradient: 'from-green-400 to-green-600', totalDeposit: 20000, vipReward: 2000 },
  { name: 'VIP 4', gradient: 'from-purple-500 to-blue-600', totalDeposit: 40000, vipReward: 4000 },
  { name: 'VIP 5', gradient: 'from-amber-600 to-yellow-700', totalDeposit: 60000, vipReward: 7000 },
  { name: 'VIP 6', gradient: 'from-purple-700 to-purple-900', totalDeposit: 100000, vipReward: 14000 },
  { name: 'VIP 7', gradient: 'from-emerald-500 to-emerald-700', totalDeposit: 150000, vipReward: 30000 },
  { name: 'VIP 8', gradient: 'from-red-500 to-red-700', totalDeposit: 200000, vipReward: 45000 },
  { name: 'VIP 9', gradient: 'from-teal-400 via-cyan-600 to-cyan-900', totalDeposit: 400000, vipReward: 90000 },
  { name: 'VIP 10', gradient: 'from-yellow-200 via-yellow-400 to-yellow-700', totalDeposit: 600000, vipReward: 140000 },
] as const;
