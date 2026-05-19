import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameContainer } from '../components/GameContainer';
import { PlayingCard, CardData } from '../components/PlayingCard';
import { Chip } from '../components/Chip';
import { useGameTimer } from '../hooks/useGameTimer';
import { useGameBalance } from '../hooks/useGameBalance';
import { useBalanceUpdate } from '../hooks/useBalanceUpdate';
import { getRandomCard } from '../utils/gameUtils';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

const CHIPS = [
  { val: '10', color: 'bg-blue-500', amount: 10 },
  { val: '50', color: 'bg-red-600', amount: 50 },
  { val: '100', color: 'bg-purple-600', amount: 100 },
  { val: '500', color: 'bg-yellow-500', amount: 500 },
  { val: '1K', color: 'bg-orange-500', amount: 1000 },
];

import { Dealer } from '../components/Dealer';

export function DragonTiger({ onBack }: { onBack: () => void }) {
  const { timeLeft, gameState } = useGameTimer(15);
  const updateBalance = useBalanceUpdate();
  const balance = useGameBalance();
  
  const [selectedChip, setSelectedChip] = useState(CHIPS[0]);
  const [bets, setBets] = useState<Record<string, number>>({ DRAGON: 0, TIGER: 0, TIE: 0 });
  const betsRef = useRef(bets);
  
  useEffect(() => {
    betsRef.current = bets;
  }, [bets]);

  const [history, setHistory] = useState<string[]>([]);
  
  const [dragonCard, setDragonCard] = useState<CardData | null>(null);
  const [tigerCard, setTigerCard] = useState<CardData | null>(null);
  const [winner, setWinner] = useState<string | null>(null);

  const getDealerMessage = () => {
    if (gameState === 'betting') return "Long hay Hổ? Quyết định nhanh nào!";
    if (gameState === 'revealing') return "Xem sức mạnh của Long Hổ!";
    if (winner === 'DRAGON') return "Long thắng! Uy lực quá!";
    if (winner === 'TIGER') return "Hổ thắng! Thật dũng mãnh!";
    if (winner === 'TIE') return "Hòa rồi! May mắn quá!";
    return "Chuẩn bị ván tiếp theo...";
  };

  const handleBet = (type: string) => {
    if (gameState !== 'betting') return;
    if (balance < selectedChip.amount) return;
    
    updateBalance(-selectedChip.amount);
    setBets(prev => ({ ...prev, [type]: prev[type] + selectedChip.amount }));
  };

  const resolveGame = useCallback(() => {
    const dCard = getRandomCard();
    const tCard = getRandomCard();
    
    setDragonCard(dCard);
    setTigerCard(tCard);
    
    let result = 'TIE';
    if (dCard.value > tCard.value) result = 'DRAGON';
    else if (tCard.value > dCard.value) result = 'TIGER';
    
    setWinner(result);
    setHistory(prev => [result[0], ...prev].slice(0, 20));

    // Payout
    let winAmount = 0;
    const currentBets = betsRef.current;
    if (result === 'DRAGON' && currentBets.DRAGON > 0) winAmount = currentBets.DRAGON * 2;
    if (result === 'TIGER' && currentBets.TIGER > 0) winAmount = currentBets.TIGER * 2;
    if (result === 'TIE' && currentBets.TIE > 0) winAmount = currentBets.TIE * 9;

    if (winAmount > 0) {
      setTimeout(() => {
        updateBalance(winAmount);
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#ff0000', '#0000ff', '#ffffff']
        });
      }, 1500);
    }
  }, [updateBalance]);

  useEffect(() => {
    if (gameState === 'revealing') {
      resolveGame();
    } else if (gameState === 'betting') {
      setBets({ DRAGON: 0, TIGER: 0, TIE: 0 });
      setDragonCard(null);
      setTigerCard(null);
      setWinner(null);
    }
  }, [gameState, resolveGame]);

  return (
    <GameContainer
      title="Baccarat Long Hổ"
      onBack={onBack}
      timeLeft={timeLeft}
      gameState={gameState}
      history={history}
      bgColor="#1a0f0a"
    >
      <div className="relative h-full flex flex-col">
        {/* Dealer Area */}
        <Dealer message={getDealerMessage()} name="Luna" />

        {/* Table Area */}
        <div className="flex-1 relative flex items-center justify-around p-4">
          {/* Dragon Side */}
          <div className="flex flex-col items-center gap-4">
            <div className={`text-2xl font-black tracking-widest transition-all ${winner === 'DRAGON' ? 'text-red-500 scale-125' : 'text-red-500/40'}`}>
              DRAGON
            </div>
            <div className="relative">
              <AnimatePresence>
                {dragonCard ? (
                  <PlayingCard 
                    card={dragonCard} 
                    isFlipped={gameState === 'revealing' || gameState === 'resetting'} 
                  />
                ) : (
                  <div className="w-24 h-36 rounded-xl border-2 border-red-500/20 bg-red-500/5 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-red-500/20 text-4xl font-black">L</div>
                  </div>
                )}
              </AnimatePresence>
              {winner === 'DRAGON' && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute -inset-4 border-2 border-red-500 rounded-2xl animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                />
              )}
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-px h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            <div className="text-white/20 font-black italic">VS</div>
            <div className="w-px h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          </div>

          {/* Tiger Side */}
          <div className="flex flex-col items-center gap-4">
            <div className={`text-2xl font-black tracking-widest transition-all ${winner === 'TIGER' ? 'text-blue-500 scale-125' : 'text-blue-500/40'}`}>
              TIGER
            </div>
            <div className="relative">
              <AnimatePresence>
                {tigerCard ? (
                  <PlayingCard 
                    card={tigerCard} 
                    isFlipped={gameState === 'revealing' || gameState === 'resetting'} 
                  />
                ) : (
                  <div className="w-24 h-36 rounded-xl border-2 border-blue-500/20 bg-blue-500/5 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-blue-500/20 text-4xl font-black">H</div>
                  </div>
                )}
              </AnimatePresence>
              {winner === 'TIGER' && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute -inset-4 border-2 border-blue-500 rounded-2xl animate-pulse shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                />
              )}
            </div>
          </div>
        </div>

        {/* Betting Area */}
        <div className="p-4 bg-black/60 backdrop-blur-2xl border-t border-white/10">
          <div className="grid grid-cols-3 gap-2 mb-6">
            <button 
              onClick={() => handleBet('DRAGON')}
              className={`h-24 rounded-xl border-2 transition-all flex flex-col items-center justify-center
                ${winner === 'DRAGON' ? 'border-red-500 bg-red-500/20' : 'border-red-500/20 bg-red-500/5'}`}
            >
              <span className="text-red-400 font-black text-lg">DRAGON</span>
              <span className="text-white font-bold mt-1">${bets.DRAGON}</span>
            </button>

            <button 
              onClick={() => handleBet('TIE')}
              className={`h-24 rounded-xl border-2 transition-all flex flex-col items-center justify-center
                ${winner === 'TIE' ? 'border-green-500 bg-green-500/20' : 'border-green-500/20 bg-green-500/5'}`}
            >
              <span className="text-green-400 font-black text-lg">TIE</span>
              <span className="text-white font-bold mt-1">${bets.TIE}</span>
            </button>

            <button 
              onClick={() => handleBet('TIGER')}
              className={`h-24 rounded-xl border-2 transition-all flex flex-col items-center justify-center
                ${winner === 'TIGER' ? 'border-blue-500 bg-blue-500/20' : 'border-blue-500/20 bg-blue-500/5'}`}
            >
              <span className="text-blue-400 font-black text-lg">TIGER</span>
              <span className="text-white font-bold mt-1">${bets.TIGER}</span>
            </button>
          </div>

          {/* Chip Selection */}
          <div className="flex justify-between items-center gap-1">
            {CHIPS.map((chip) => (
              <Chip 
                key={chip.val}
                value={chip.val}
                color={chip.color}
                isSelected={selectedChip.val === chip.val}
                onClick={() => setSelectedChip(chip)}
                size="sm"
              />
            ))}
          </div>
        </div>
      </div>
    </GameContainer>
  );
}
