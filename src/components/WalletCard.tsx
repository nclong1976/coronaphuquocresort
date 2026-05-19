import React, { useEffect, useRef, useState } from 'react';
import { Wallet, WifiOff, RefreshCw } from 'lucide-react';

interface WalletCardProps {
  balance: number;
  isOnline: boolean;
  isSyncing?: boolean;
  onRefresh?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

function animateValue(
  from: number,
  to: number,
  duration: number,
  onUpdate: (v: number) => void,
  easing = (t: number) => t
) {
  const start = performance.now();
  const diff = to - from;

  function tick(now: number) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    const eased = easing(t);
    onUpdate(from + diff * eased);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function WalletCard({
  balance,
  isOnline,
  isSyncing = false,
  onRefresh,
  size = 'md',
  className = '',
}: WalletCardProps) {
  const [displayValue, setDisplayValue] = useState(balance);
  const prevBalance = useRef(balance);

  useEffect(() => {
    if (prevBalance.current !== balance) {
      animateValue(prevBalance.current, balance, 600, setDisplayValue, easeOutCubic);
      prevBalance.current = balance;
    } else {
      setDisplayValue(balance);
    }
  }, [balance]);

  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <div
      className={`flex items-center gap-2 rounded-full border shadow-lg transition-all ${sizeClasses} ${className} ${
        isOnline
          ? 'bg-black/60 border-yellow-500/30 text-yellow-500'
          : 'bg-red-900/30 border-red-500/50 text-red-400'
      }`}
    >
      {isOnline ? (
        <Wallet size={size === 'sm' ? 14 : 16} className="text-yellow-500 shrink-0" />
      ) : (
        <WifiOff size={size === 'sm' ? 14 : 16} className="text-red-400 shrink-0" />
      )}
      <span className="font-bold tabular-nums">
        ${displayValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      {isSyncing && (
        <RefreshCw size={12} className="animate-spin text-yellow-500/80 shrink-0" />
      )}
      {onRefresh && !isSyncing && (
        <button
          onClick={onRefresh}
          className="p-0.5 rounded hover:bg-white/10 transition-colors"
          title="Đồng bộ số dư"
        >
          <RefreshCw size={12} className="text-yellow-500/80" />
        </button>
      )}
    </div>
  );
}
