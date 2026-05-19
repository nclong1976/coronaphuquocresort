import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { VIP_LEVEL_ROWS } from './vipLevels';
import { VipBanner } from './VipBanner';
import { PrivilegeSection } from './PrivilegeSection';
import { VipDetails } from './VipDetails';

/**
 * Nội dung chính từ project ƯU ĐÃI — vuốt ngang để đổi cấp VIP, đồng bộ mốc với hạng hiện tại của người chơi.
 */
export function VipPromotionsPanel({ playerVipLevel }: { playerVipLevel: number }) {
  const clamped = Math.min(Math.max(0, Math.floor(playerVipLevel)), VIP_LEVEL_ROWS.length - 1);
  const [currentIndex, setCurrentIndex] = useState(clamped);

  useEffect(() => {
    setCurrentIndex(clamped);
  }, [clamped]);

  const row = VIP_LEVEL_ROWS[currentIndex];

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -50 && currentIndex < VIP_LEVEL_ROWS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (info.offset.x > 50 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-center h-12 sm:h-14 bg-[#d32f2f] text-white px-4 shadow-md">
        <h2 className="text-base sm:text-lg font-bold">Chi tiết VIP</h2>
      </div>
      <main className="bg-white text-gray-800 antialiased">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing touch-pan-y"
        >
          <VipBanner
            gradient={row.gradient}
            name={row.name}
            onNext={() => currentIndex < VIP_LEVEL_ROWS.length - 1 && setCurrentIndex(currentIndex + 1)}
            onPrev={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
          />
          <PrivilegeSection totalDeposit={row.totalDeposit} vipReward={row.vipReward} />
        </motion.div>
        <VipDetails />
      </main>
    </>
  );
}
