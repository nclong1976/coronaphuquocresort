import React, { useEffect, useRef, useState } from 'react';
import { Wallet, RotateCw } from 'lucide-react';
import { AnimatedBalance } from './AnimatedBalance';

interface LuxuryWalletBarProps {
  balance: number;
  isSyncingBalance: boolean;
  handleRefreshBalance: () => void;
  size?: 'sm' | 'md';
}

interface Particle {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

export function LuxuryWalletBar({
  balance,
  isSyncingBalance,
  handleRefreshBalance,
  size = 'sm',
}: LuxuryWalletBarProps) {
  const [showShine, setShowShine] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const prevBalance = useRef(balance);
  const particleIdCounter = useRef(0);

  useEffect(() => {
    if (balance > prevBalance.current) {
      // Trigger gold shine sweep
      setShowShine(true);
      const timer = setTimeout(() => setShowShine(false), 800);

      // Trigger coin particles
      const newParticles: Particle[] = Array.from({ length: 8 }).map(() => ({
        id: particleIdCounter.current++,
        left: Math.random() * 80 + 10, // random left from 10% to 90%
        size: Math.random() * 6 + 6,   // random size from 6px to 12px
        delay: Math.random() * 250,    // random delay up to 250ms
        duration: Math.random() * 400 + 700, // random duration from 700ms to 1100ms
      }));
      setParticles((prev) => [...prev, ...newParticles]);

      // Cleanup particles after they finish animating
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
      }, 1500);

      prevBalance.current = balance;
    } else {
      prevBalance.current = balance;
    }
  }, [balance]);

  const barClass =
    size === 'sm'
      ? 'flex items-center gap-1.5 bg-gradient-to-r from-[#996515]/20 to-[#d4af37]/20 px-2.5 py-1 rounded-full border border-[#d4af37]/30 relative overflow-hidden'
      : 'flex items-center gap-2 bg-gradient-to-r from-[#996515]/20 to-[#d4af37]/20 px-3 py-1.5 rounded-full border border-[#d4af37]/30 relative overflow-hidden';

  const walletIconClass =
    size === 'sm' ? 'text-[#d4af37] size-3.5 shrink-0 z-10' : 'text-[#d4af37] size-4 shrink-0 z-10';

  const dollarClass =
    size === 'sm'
      ? 'text-[#f9e498] text-xs font-bold leading-none tracking-wide mr-0.5 z-10'
      : 'text-[#f9e498] text-sm font-bold leading-normal tracking-wide mr-0.5 z-10';

  const balanceClass =
    size === 'sm'
      ? 'text-[#f9e498] text-xs font-bold leading-none tracking-wide mr-0.5 z-10'
      : 'text-[#f9e498] text-sm font-bold leading-normal tracking-wide mr-0.5 z-10';

  const refreshBtnClass =
    size === 'sm'
      ? 'p-0.5 hover:bg-[#d4af37]/20 rounded-full text-[#d4af37] transition-colors active:scale-95 flex items-center justify-center cursor-pointer z-10'
      : 'p-0.5 hover:bg-[#d4af37]/20 rounded-full text-[#d4af37] transition-colors active:scale-95 flex items-center justify-center cursor-pointer z-10';

  const refreshIconClass =
    size === 'sm' ? `size-3 ${isSyncingBalance ? 'animate-spin' : ''}` : `size-3.5 ${isSyncingBalance ? 'animate-spin' : ''}`;

  return (
    <div className="relative overflow-visible inline-block">
      {/* CSS Styles Local Injection */}
      <style>{`
        @keyframes gold-shine-sweep {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes coin-float-up {
          0% {
            transform: translateY(12px) scale(0.4) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-45px) scale(1.1) rotate(270deg);
            opacity: 0;
          }
        }
        .luxury-shine-sweep {
          position: absolute;
          top: 0;
          height: 100%;
          width: 60%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(212, 175, 55, 0.35) 25%,
            rgba(255, 244, 180, 0.7) 50%,
            rgba(212, 175, 55, 0.35) 75%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-20deg);
          animation: gold-shine-sweep 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          pointer-events: none;
          z-index: 5;
        }
        .luxury-coin-particle {
          position: absolute;
          bottom: 90%;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fff176, #f57f17);
          box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 0 4px rgba(253,216,53,0.6);
          border: 0.5px solid #d4af37;
          pointer-events: none;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .luxury-coin-inner {
          width: 50%;
          height: 50%;
          border-radius: 50%;
          border: 0.5px solid rgba(255,255,255,0.4);
        }
      `}</style>

      {/* Floating coin particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="luxury-coin-particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `coin-float-up ${p.duration}ms ease-out ${p.delay}ms forwards`,
          }}
        >
          <div className="luxury-coin-inner" />
        </div>
      ))}

      {/* Wallet Bar */}
      <div className={barClass}>
        {/* Shine Overlay */}
        {showShine && <div className="luxury-shine-sweep" />}

        <Wallet className={walletIconClass} />
        <span className={dollarClass}>$</span>
        <AnimatedBalance
          balance={balance}
          format={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }}
          className={balanceClass}
        />
        <button
          onClick={handleRefreshBalance}
          disabled={isSyncingBalance}
          className={refreshBtnClass}
          title="Tải lại số dư"
        >
          <RotateCw className={refreshIconClass} />
        </button>
      </div>
    </div>
  );
}
