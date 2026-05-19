/**
 * Toast thông báo kết quả ván cược khi người chơi reconnect.
 * "Ván cược lúc [Time] của bạn đã kết thúc. Kết quả: [Thắng +Số tiền] / [Thua]"
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SicBoToastProps {
  visible: boolean;
  onDismiss: () => void;
  betTime: string;
  won: boolean;
  winAmount?: number;
  autoHideMs?: number;
}

export function SicBoToast({ visible, onDismiss, betTime, won, winAmount = 0, autoHideMs = 5000 }: SicBoToastProps) {
  useEffect(() => {
    if (!visible || autoHideMs <= 0) return;
    const t = setTimeout(onDismiss, autoHideMs);
    return () => clearTimeout(t);
  }, [visible, onDismiss, autoHideMs]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed top-4 left-4 right-4 z-[200] max-w-md mx-auto pointer-events-auto"
        >
          <div
            className={`rounded-xl border-2 shadow-xl p-4 ${
              won ? 'bg-green-900/95 border-green-500/50' : 'bg-slate-800/95 border-slate-500/50'
            } backdrop-blur-md`}
          >
            <p className="text-white text-sm font-medium mb-1">Ván cược lúc {betTime} của bạn đã kết thúc.</p>
            <p className={`text-base font-bold ${won ? 'text-green-400' : 'text-red-400'}`}>
              {won ? `Thắng +$${winAmount.toLocaleString()}` : 'Thua'}
            </p>
            <button
              onClick={onDismiss}
              className="absolute top-2 right-2 text-white/60 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
