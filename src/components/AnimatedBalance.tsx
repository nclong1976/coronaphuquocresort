import React, { useEffect, useRef, useState } from 'react';

interface AnimatedBalanceProps {
  balance: number;
  className?: string;
  format?: { minimumFractionDigits?: number; maximumFractionDigits?: number };
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

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
    onUpdate(from + diff * easing(t));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function AnimatedBalance({
  balance,
  className = '',
  format = { minimumFractionDigits: 2, maximumFractionDigits: 2 },
}: AnimatedBalanceProps) {
  const [displayValue, setDisplayValue] = useState(balance);
  const prevBalance = useRef(balance);

  useEffect(() => {
    if (prevBalance.current !== balance) {
      animateValue(prevBalance.current, balance, 500, setDisplayValue, easeOutCubic);
      prevBalance.current = balance;
    } else {
      setDisplayValue(balance);
    }
  }, [balance]);

  return (
    <span className={className}>
      {displayValue.toLocaleString('en-US', format)}
    </span>
  );
}
