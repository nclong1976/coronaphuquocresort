import { useState, useEffect } from 'react';

export const useGameTimer = (initialTime = 299) => { // 4:59 = 299 seconds
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [gameState, setGameState] = useState<'betting' | 'revealing'>('betting');

  useEffect(() => {
    if (gameState === 'betting') {
      if (timeLeft > 2) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState('revealing');
      }
    } else if (gameState === 'revealing') {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState('betting');
        setTimeLeft(initialTime);
      }
    }
  }, [timeLeft, gameState, initialTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return { timeLeft: formatTime(timeLeft), rawTime: timeLeft, gameState };
};
