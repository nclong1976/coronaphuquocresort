import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info, Wallet, RotateCcw, Rocket, Trophy, Star, Diamond, Crown, Coins } from 'lucide-react';
import { useGameBalance } from '../hooks/useGameBalance';
import { useBalanceUpdate } from '../hooks/useBalanceUpdate';

const MIN_BET = 10;
const MAX_BET = 10000;

const SYMBOLS = [
  { icon: <Crown className="text-yellow-500" size={40} />, label: 'Crown', value: 100 },
  { icon: <Diamond className="text-blue-400" size={40} />, label: 'Diamond', value: 50 },
  { icon: <Star className="text-amber-400" size={40} />, label: 'Star', value: 25 },
  { icon: <Coins className="text-yellow-600" size={40} />, label: 'Coins', value: 10 },
];

export function SlotMachine({ onBack }: { onBack: () => void }) {
  const updateBalance = useBalanceUpdate();
  const balance = useGameBalance();
  const [isSpinning, setIsSpinning] = useState(false);
  const [symbols, setSymbols] = useState(Array(9).fill(SYMBOLS[0]));
  const [bet, setBet] = useState(100);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const spin = () => {
    const validBet = Math.max(MIN_BET, Math.min(MAX_BET, Math.floor(bet)));
    if (isSpinning || balance < validBet || validBet < MIN_BET) return;
    
    if (navigator.vibrate) navigator.vibrate(50);
    
    setIsSpinning(true);
    setWinMessage(null);
    updateBalance(-validBet);

    setTimeout(() => {
      const newSymbols = Array(9).fill(null).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      setSymbols(newSymbols);
      setIsSpinning(false);
      checkWin(newSymbols, validBet);
    }, 1500);
  };

  const checkWin = (currentSymbols: any[], betAmount: number) => {
    let winAmount = 0;
    for (let i = 0; i < 3; i++) {
        const row = [currentSymbols[i*3], currentSymbols[i*3+1], currentSymbols[i*3+2]];
        if (row[0].label === row[1].label && row[1].label === row[2].label) {
            winAmount += row[0].value * betAmount;
        }
    }
    
    if (winAmount > 0) {
      updateBalance(winAmount);
      setWinMessage(`BIG WIN: $${winAmount.toLocaleString()}`);
      setHistory(prev => [`Won $${winAmount}`, ...prev].slice(0, 5));
    } else {
      setHistory(prev => [`Lost`, ...prev].slice(0, 5));
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-[#020202] overflow-hidden font-sans text-slate-100 no-scrollbar max-w-md mx-auto shadow-2xl">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-[2px]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full bg-black/60 text-yellow-500 border border-yellow-500/30 backdrop-blur-md active:scale-90 transition-all">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-white text-sm font-black uppercase tracking-widest leading-tight">Corona Slots</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 w-fit">
              <span className="flex h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
              <span className="text-[9px] font-black text-yellow-500 tracking-widest uppercase">JACKPOT</span>
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

      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar pt-20">
        {/* Jackpot Display */}
        <div className="p-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-yellow-500/30 p-8 text-center shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
            <p className="text-yellow-500 text-[10px] font-black tracking-[0.3em] uppercase mb-2">Progressive Jackpot</p>
            <h2 className="text-4xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]">
              $1,250,540.<span className="text-yellow-500/50">80</span>
            </h2>
            <div className="mt-4 flex justify-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-yellow-500 fill-yellow-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
            </div>
          </div>
        </div>

        {/* Slot Machine Grid */}
        <div className="px-4 relative">
          <div className="bg-gradient-to-b from-[#1a1a1a] to-[#050505] rounded-3xl border-8 border-[#1a1a1a] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative">
            {/* Winning Lines Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute top-1/3 left-0 w-full h-0.5 bg-yellow-500/10"></div>
              <div className="absolute top-2/3 left-0 w-full h-0.5 bg-yellow-500/10"></div>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1">
              {symbols.map((item, i) => (
                <div key={i} className={`relative bg-[#0a0a0a] aspect-square flex flex-col items-center justify-center border border-white/5 transition-all duration-300 ${isSpinning ? 'blur-[2px] scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
                  <div className={`transform transition-all duration-500 ${isSpinning ? 'translate-y-20' : 'translate-y-0'}`}>
                    {item.icon}
                  </div>
                  <span className="mt-2 text-[8px] font-black text-white/20 uppercase tracking-widest">{item.label}</span>
                  
                  {/* Symbol Glow */}
                  {!isSpinning && <div className="absolute inset-0 bg-yellow-500/5 opacity-0 hover:opacity-100 transition-opacity"></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Win Message Overlay */}
          {winMessage && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-8 animate-bounce">
              <div className="metallic-gold p-6 rounded-2xl shadow-[0_0_50px_rgba(255,215,0,0.6)] text-center transform rotate-3">
                <Trophy size={48} className="mx-auto mb-2 text-black" />
                <p className="text-black font-black text-2xl tracking-tighter italic">{winMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats and History */}
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Current Bet</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setBet((b) => Math.max(MIN_BET, Math.min(MAX_BET, b - 10)))} className="size-8 rounded-full border border-white/10 flex items-center justify-center text-white/60 active:bg-white/10">-</button>
                <span className="text-2xl font-black text-white">${Math.max(MIN_BET, Math.min(MAX_BET, bet))}</span>
                <button onClick={() => setBet((b) => Math.max(MIN_BET, Math.min(MAX_BET, b + 10)))} className="size-8 rounded-full border border-white/10 flex items-center justify-center text-white/60 active:bg-white/10">+</button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Recent Wins</p>
              <div className="flex gap-2 justify-end">
                {history.filter(h => h.startsWith('Won')).slice(0, 3).map((h, i) => (
                  <div key={i} className="bg-yellow-500/10 border border-yellow-500/30 px-2 py-1 rounded text-[10px] font-black text-yellow-500">
                    {h.split(' ')[1]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Main Controls */}
      <div className="bg-[#050505] border-t border-white/10 p-6 pb-10 space-y-4 backdrop-blur-xl">
        <button 
          onClick={spin}
          disabled={isSpinning}
          className={`w-full h-20 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl ${isSpinning ? 'bg-white/5 border border-white/10 opacity-50' : 'metallic-gold shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:brightness-110'}`}
        >
          <RotateCcw size={32} className={`${isSpinning ? 'animate-spin text-white/40' : 'text-black'}`} />
          <span className={`text-2xl font-black tracking-tighter uppercase italic ${isSpinning ? 'text-white/40' : 'text-black'}`}>
            {isSpinning ? 'SPINNING...' : 'SPIN'}
          </span>
        </button>
        
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-white/5 border border-white/10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center justify-center gap-2 active:bg-white/10">
            <RotateCcw size={14} /> AUTO SPIN
          </button>
          <button onClick={() => setBet(Math.min(balance, MAX_BET))} className="bg-white/5 border border-white/10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center justify-center gap-2 active:bg-white/10">
            <Rocket size={14} /> MAX BET
          </button>
        </div>
      </div>
    </div>
  );
}
