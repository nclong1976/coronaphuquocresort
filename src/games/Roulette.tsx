import React, { useState } from 'react';
import { ArrowLeft, Settings, Wallet, History, CheckCircle } from 'lucide-react';
import { useGameBalance } from '../hooks/useGameBalance';
import { useBalanceUpdate } from '../hooks/useBalanceUpdate';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const CHIP_VALUES = [50, 100, 500, 1000, 5000];

export function Roulette({ onBack }: { onBack: () => void }) {
  const updateBalance = useBalanceUpdate();
  const balance = useGameBalance();

  const [selectedChip, setSelectedChip] = useState(100);
  const [bets, setBets] = useState<{ RED: number; BLACK: number }>({ RED: 0, BLACK: 0 });
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [lastBets, setLastBets] = useState<{ RED: number; BLACK: number }>({ RED: 0, BLACK: 0 });

  const totalBet = bets.RED + bets.BLACK;

  const handleBet = (type: 'RED' | 'BLACK') => {
    if (isSpinning || balance < totalBet + selectedChip) return;
    setBets((prev) => ({ ...prev, [type]: prev[type] + selectedChip }));
  };

  const handleSpin = () => {
    if (isSpinning || totalBet === 0 || balance < totalBet) return;
    const currentBets = { ...bets };
    updateBalance(-totalBet);
    setLastBets(currentBets);
    setBets({ RED: 0, BLACK: 0 });
    setIsSpinning(true);
    setResult(null);

    setTimeout(() => {
      const num = Math.floor(Math.random() * 37);
      setResult(num);

      let winnings = 0;
      if (num === 0) {
        winnings = 0;
      } else if (RED_NUMBERS.includes(num) && currentBets.RED > 0) {
        winnings = currentBets.RED * 2;
      } else if (!RED_NUMBERS.includes(num) && currentBets.BLACK > 0) {
        winnings = currentBets.BLACK * 2;
      }

      if (winnings > 0) {
        setTimeout(() => updateBalance(winnings), 500);
      }
      setIsSpinning(false);
    }, 3000);
  };

  const handleRebet = () => {
    if (lastBets.RED > 0 || lastBets.BLACK > 0) {
      setBets({ ...lastBets });
    }
  };

  const handleConfirm = () => {
    handleSpin();
  };

  const isRed = result !== null && result > 0 && RED_NUMBERS.includes(result);

  return (
    <div className="relative flex h-screen w-full flex-col bg-[#020202] overflow-hidden font-sans text-slate-100 no-scrollbar max-w-md mx-auto shadow-2xl">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-[2px]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full bg-black/60 text-yellow-500 border border-yellow-500/30 backdrop-blur-md active:scale-90 transition-all">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-white text-sm font-black uppercase tracking-widest leading-tight">Corona Roulette</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 w-fit">
              <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[9px] font-black text-red-500 tracking-widest uppercase">LIVE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full border border-yellow-500/30 shadow-2xl">
            <Wallet size={16} className="text-yellow-500" />
            <span className="text-yellow-500 font-black text-sm tracking-wider">${balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
        {/* Live Dealer Section */}
        <div className="relative w-full aspect-video overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1596743444253-447c4bf23027?q=80&w=2070&auto=format&fit=crop" 
            alt="Dealer" 
            className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-black/40"></div>
          
          {/* Result overlay */}
          {result !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
              <div className={`text-6xl font-black px-8 py-4 rounded-2xl ${result === 0 ? 'bg-green-600' : isRed ? 'bg-red-600' : 'bg-slate-800'}`}>
                {result}
              </div>
            </div>
          )}
          
          {/* Roulette Wheel Overlay */}
          <div className="absolute bottom-4 right-4 size-24 rounded-full border-4 border-yellow-500/30 bg-black/60 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-2xl">
            <div className={`size-20 rounded-full border-2 border-yellow-500/50 flex items-center justify-center ${isSpinning ? 'animate-spin' : ''}`}>
              <div className="size-full bg-[conic-gradient(from_0deg,#000_0deg_10deg,#f00_10deg_20deg)] rounded-full opacity-40"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
            </div>
          </div>
        </div>

        {/* Betting Table */}
        <div className="p-4 space-y-4">
          <div className="bg-emerald-900/20 border-2 border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="flex h-48">
              <div className="w-14 flex items-center justify-center bg-green-600/40 border-r border-white/10 text-white font-black text-2xl">0</div>
              <div className="flex-1 grid grid-cols-12 grid-rows-3 text-center">
                {Array.from({ length: 36 }).map((_, i) => {
                  const num = i + 1;
                  const isRed = RED_NUMBERS.includes(num);
                  return (
                    <div key={num} className={`h-16 border border-white/5 flex items-center justify-center transition-all cursor-default ${isRed ? 'bg-red-600/40' : 'bg-black/40'}`}>
                      <span className="text-white font-black text-xs">{num}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Outside Bets - RED & BLACK only for simplicity */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleBet('RED')}
              disabled={isSpinning || balance < totalBet + selectedChip}
              className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 ${bets.RED > 0 ? 'bg-red-600 border-2 border-red-400' : 'bg-red-600/20 border border-red-500/30 hover:bg-red-600/40'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-red-100">RED</span>
              {bets.RED > 0 && <span className="text-white font-bold">${bets.RED}</span>}
            </button>
            <button 
              onClick={() => handleBet('BLACK')}
              disabled={isSpinning || balance < totalBet + selectedChip}
              className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 ${bets.BLACK > 0 ? 'bg-slate-800 border-2 border-slate-400' : 'bg-black/40 border border-white/10 hover:bg-slate-800/60'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-white">BLACK</span>
              {bets.BLACK > 0 && <span className="text-white font-bold">${bets.BLACK}</span>}
            </button>
          </div>
        </div>
      </main>

      {/* Chips and Controls */}
      <div className="bg-[#050505] border-t border-white/10 p-5 pt-3 space-y-5 backdrop-blur-xl">
        <div className="flex justify-between items-center gap-3 overflow-x-auto py-1 no-scrollbar">
          {CHIP_VALUES.map((val) => (
            <button 
              key={val} 
              onClick={() => setSelectedChip(val)}
              disabled={isSpinning}
              className={`flex-shrink-0 size-12 rounded-full border-2 border-dashed flex items-center justify-center shadow-2xl transform active:scale-90 transition-all hover:-translate-y-1 disabled:opacity-50 ${selectedChip === val ? 'metallic-gold border-yellow-400' : 'border-white/40 bg-black/60'}`}
            >
              <span className={`font-black text-[10px] ${selectedChip === val ? 'text-black' : 'text-white'}`}>${val >= 1000 ? val / 1000 + 'K' : val}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleRebet}
            disabled={isSpinning || (lastBets.RED === 0 && lastBets.BLACK === 0)}
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <History size={16} /> REBET
          </button>
          <button 
            onClick={handleConfirm}
            disabled={isSpinning || totalBet === 0 || balance < totalBet}
            className="metallic-gold text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all active:scale-95 hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle size={16} /> SPIN (${totalBet})
          </button>
        </div>
      </div>
    </div>
  );
}
