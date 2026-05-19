import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Info, 
  Wallet, 
  MessageSquare, 
  ChevronRight,
  History,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameBalance } from '../hooks/useGameBalance';
import { useBalanceUpdate } from '../hooks/useBalanceUpdate';
import { useGameTimer } from '../hooks/useGameTimer';
import { getRandomCard, calculateBaiCaoScore } from '../utils/gameUtils';
import type { CardData } from '../components/PlayingCard';

const CHIPS = [
  { val: '50', color: 'bg-blue-500', amount: 50 },
  { val: '100', color: 'bg-red-600', amount: 100 },
  { val: '500', color: 'bg-purple-600', amount: 500 },
  { val: '1K', color: 'bg-yellow-500', amount: 1000 },
  { val: '5K', color: 'bg-orange-500', amount: 5000 },
];

export function BaiCao({ onBack }: { onBack: () => void }) {
  const updateBalance = useBalanceUpdate();
  const balance = useGameBalance();
  const { timeLeft, rawTime, gameState } = useGameTimer(30);
  
  const [selectedChip, setSelectedChip] = useState(CHIPS[0]);
  const [tempBets, setTempBets] = useState<{ PLAYER: number, BANKER: number }>({ PLAYER: 0, BANKER: 0 });
  const [confirmedBets, setConfirmedBets] = useState<{ PLAYER: number, BANKER: number }>({ PLAYER: 0, BANKER: 0 });
  const [selectedZone, setSelectedZone] = useState<'PLAYER' | 'BANKER' | null>(null);

  const handleZoneSelect = (zone: 'PLAYER' | 'BANKER') => {
    if (gameState !== 'betting') return;
    setSelectedZone(zone);
  };

  const handleChipClick = (chip: typeof CHIPS[0]) => {
    if (gameState !== 'betting') return;
    if (!selectedZone) {
      alert("Vui lòng chọn cửa đặt trước");
      return;
    }
    if (balance < tempBets.PLAYER + tempBets.BANKER + chip.amount) {
      alert("Số dư không đủ");
      return;
    }
    setTempBets(prev => ({
      ...prev,
      [selectedZone]: prev[selectedZone] + chip.amount
    }));
  };

  const handleConfirm = () => {
    if (gameState !== 'betting') return;
    const totalTemp = tempBets.PLAYER + tempBets.BANKER;
    const totalConfirmed = confirmedBets.PLAYER + confirmedBets.BANKER;
    const newBetAmount = totalTemp - totalConfirmed;

    if (newBetAmount <= 0) return;

    updateBalance(-newBetAmount);
    setConfirmedBets({ ...tempBets });
    alert("Xác nhận đặt cược thành công!");
  };

  const handleCancel = () => {
    if (gameState !== 'betting') return;
    setTempBets({ ...confirmedBets });
    setSelectedZone(null);
  };

  // Settle bets when round ends (gameState -> revealing)
  const hasSettledRef = useRef(false);
  useEffect(() => {
    if (gameState === 'revealing' && (confirmedBets.PLAYER > 0 || confirmedBets.BANKER > 0) && !hasSettledRef.current) {
      hasSettledRef.current = true;
      const playerCards: CardData[] = [getRandomCard(), getRandomCard(), getRandomCard()];
      const bankerCards: CardData[] = [getRandomCard(), getRandomCard(), getRandomCard()];
      const playerScore = calculateBaiCaoScore(playerCards);
      const bankerScore = calculateBaiCaoScore(bankerCards);

      let winner: 'PLAYER' | 'BANKER' | 'TIE' = 'TIE';
      if (playerScore > bankerScore) winner = 'PLAYER';
      else if (bankerScore > playerScore) winner = 'BANKER';

      let winnings = 0;
      if (winner === 'PLAYER' && confirmedBets.PLAYER > 0) winnings += confirmedBets.PLAYER * 2;
      if (winner === 'BANKER' && confirmedBets.BANKER > 0) winnings += confirmedBets.BANKER * 1.95;
      if (winner === 'TIE') {
        winnings += confirmedBets.PLAYER + confirmedBets.BANKER;
      }

      if (winnings > 0) updateBalance(winnings);
      setConfirmedBets({ PLAYER: 0, BANKER: 0 });
    }
    if (gameState === 'betting') {
      hasSettledRef.current = false;
    }
  }, [gameState, confirmedBets.PLAYER, confirmedBets.BANKER, updateBalance]);

  useEffect(() => {
    if (gameState === 'betting') {
      setTempBets({ PLAYER: 0, BANKER: 0 });
      setConfirmedBets({ PLAYER: 0, BANKER: 0 });
      setSelectedZone(null);
    }
  }, [gameState]);

  return (
    <div className="relative flex h-screen w-full max-w-md mx-auto flex-col bg-[#221610] text-slate-100 overflow-hidden font-sans shadow-2xl">
      {/* Live Video Area Container */}
      <div className="relative flex-1 w-full bg-slate-900 overflow-hidden">
        {/* Background Image: Live Dealer */}
        <div 
          className="absolute inset-0 bg-center bg-cover" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBYSWtK0a_o-c8xcP6UF0XIWCv-1OyDuqYlZ0k8V5NhJsMo4e-4Zf8E7h8mH7lp9cPFWxh2cqOmEei-Jh6Kg32pykbXS9-SaK3mplVRJpKuLismNEeJXQLym_GNbnSLevMldn1gyic_oLKvRt586LIvfGnAcDzOy6DzCbHEDeBsXnzt7_-T1xeL_4BJvRZ8vsBZsGlDCn3L7nIkE_iDqzcloWyiGxWEaH9z_Usf4BPbioLQnUZJEiAmKGku-lcDWL_dNGDInJE2JqsH')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
        </div>

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 z-10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white border border-white/20 active:scale-90 transition-transform"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-white text-sm font-bold leading-tight drop-shadow-md uppercase tracking-wider">Corona Casino VIP</h2>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-md border border-yellow-500/20 shadow-[0_0_8px_rgba(212,175,55,0.2)]">
                <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_#ef4444]"></span>
                <span className="text-[8px] font-medium text-white/90 tracking-[0.15em] uppercase">TRỰC TIẾP</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-yellow-500/30">
              <Wallet size={14} className="text-yellow-500" />
              <span className="text-yellow-500 font-bold text-xs">${balance.toLocaleString()}</span>
            </div>
            <button className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white border border-white/20">
              <Info size={18} />
            </button>
          </div>
        </div>

        {/* Timer and Game Status */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <div className="flex flex-col items-center">
            <div className="text-yellow-500 text-[10px] font-black tracking-[0.3em] mb-2 drop-shadow-lg uppercase">
              {gameState === 'betting' ? 'Vui lòng đặt cược' : 'Đang mở bài'}
            </div>
            <div className="flex gap-1.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black/70 border border-yellow-500/50 shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                <p className="text-white text-2xl font-bold font-mono">{Math.floor(rawTime / 10)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black/70 border border-yellow-500/50 shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                <p className="text-white text-2xl font-bold font-mono">{rawTime % 10}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Betting Zones */}
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs px-4 z-10">
          <div className="grid gap-4 grid-cols-2">
            <button 
              onClick={() => handleZoneSelect('PLAYER')}
              className={`flex flex-col items-center gap-2 group transition-all duration-300 ${selectedZone === 'PLAYER' ? 'scale-105' : 'opacity-80'}`}
            >
              <div className={`w-full aspect-[2/3] rounded-xl border-2 shadow-2xl relative overflow-hidden backdrop-blur-md flex items-center justify-center transition-colors ${selectedZone === 'PLAYER' ? 'border-blue-400 bg-blue-900/40' : 'border-blue-500/30 bg-blue-900/20'}`}>
                <img 
                  alt="Corona Casino Logo" 
                  className="w-4/5 h-4/5 object-contain opacity-40 brightness-110" 
                  src="https://casinocorona.vn/wp-content/uploads/2024/01/Corona_Logo_Color.png"
                />
                {tempBets.PLAYER > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="size-12 rounded-full border-2 border-dashed border-white bg-blue-600 flex items-center justify-center shadow-lg animate-in zoom-in">
                      <span className="text-white font-black text-[10px]">${tempBets.PLAYER}</span>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-600/20"></div>
              </div>
              <div className={`w-full py-2 rounded-lg border shadow-lg transition-all ${selectedZone === 'PLAYER' ? 'bg-blue-600 border-blue-400 shadow-blue-500/40' : 'bg-blue-800/40 border-blue-500/30'}`}>
                <span className="text-white text-[10px] font-black tracking-widest block text-center uppercase">PLAYER</span>
              </div>
            </button>

            <button 
              onClick={() => handleZoneSelect('BANKER')}
              className={`flex flex-col items-center gap-2 group transition-all duration-300 ${selectedZone === 'BANKER' ? 'scale-105' : 'opacity-80'}`}
            >
              <div className={`w-full aspect-[2/3] rounded-xl border-2 shadow-2xl relative overflow-hidden backdrop-blur-md flex items-center justify-center transition-colors ${selectedZone === 'BANKER' ? 'border-red-400 bg-red-900/40' : 'border-red-500/30 bg-red-900/20'}`}>
                <img 
                  alt="Corona Casino Logo" 
                  className="w-4/5 h-4/5 object-contain opacity-40 brightness-110" 
                  src="https://casinocorona.vn/wp-content/uploads/2024/01/Corona_Logo_Color.png"
                />
                {tempBets.BANKER > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="size-12 rounded-full border-2 border-dashed border-white bg-red-600 flex items-center justify-center shadow-lg animate-in zoom-in">
                      <span className="text-white font-black text-[10px]">${tempBets.BANKER}</span>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-600/20"></div>
              </div>
              <div className={`w-full py-2 rounded-lg border shadow-lg transition-all ${selectedZone === 'BANKER' ? 'bg-red-600 border-red-400 shadow-red-500/40' : 'bg-red-800/40 border-red-500/30'}`}>
                <span className="text-white text-[10px] font-black tracking-widest block text-center uppercase">BANKER</span>
              </div>
            </button>
          </div>
        </div>

        {/* Chat Box */}
        <div className="absolute bottom-[230px] left-4 w-48 max-h-24 overflow-hidden pointer-events-none z-10">
          <div className="space-y-1">
            <div className="bg-black/60 backdrop-blur-md rounded-lg p-2 text-[10px] text-white/80 border border-white/10">
              <span className="text-yellow-500 font-bold">VIP_Player88:</span> Good luck everyone!
            </div>
            <div className="bg-black/60 backdrop-blur-md rounded-lg p-2 text-[10px] text-white/80 border border-white/10">
              <span className="text-yellow-500 font-bold">Corona_Host:</span> Welcome to the Gold Table.
            </div>
          </div>
        </div>

        {/* Chips Section */}
        <div className="absolute bottom-[170px] left-0 right-0 flex justify-center items-center gap-3 px-4 overflow-x-auto no-scrollbar py-2">
          {CHIPS.map((chip) => (
            <button 
              key={chip.val}
              onClick={() => handleChipClick(chip)}
              disabled={gameState !== 'betting'}
              className={`size-12 rounded-full border-2 border-dashed border-white/50 flex-shrink-0 flex items-center justify-center shadow-xl active:scale-90 transition-all duration-200 ${chip.color} ${gameState !== 'betting' ? 'grayscale opacity-50' : 'hover:scale-110'}`}
            >
              <span className="text-white font-black text-[10px]">${chip.val}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Roadmap & Stats Footer */}
      <div className="h-44 bg-[#150e0a] border-t border-yellow-500/30 flex flex-col p-3 gap-3">
        <div className="flex-1 flex gap-3">
          {/* Minimal Stats */}
          <div className="flex flex-col justify-center px-3 border-r border-white/10 text-[10px] min-w-[80px]">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between gap-4">
                <span className="text-blue-500 font-bold">P: 12</span>
                <span className="text-red-500 font-bold">B: 15</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-green-500 font-bold">T: 2</span>
                <span className="text-slate-400">#128</span>
              </div>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-500 w-[40%]"></div>
            </div>
          </div>
          {/* Compact Roadmap */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden no-scrollbar">
            <div className="h-full grid grid-flow-col grid-rows-4 gap-1 min-w-[300px]">
              {[...Array(32)].map((_, i) => (
                <div key={i} className={`size-3 rounded-full border ${i % 3 === 0 ? 'border-red-500 bg-red-500/20' : i % 5 === 0 ? 'border-green-500 bg-green-500/20' : 'border-blue-500 bg-blue-500/20'}`}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Mobile Controls */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => {
              if (gameState === 'betting' && selectedZone) {
                const availableBalance = balance - tempBets.PLAYER - tempBets.BANKER;
                if (availableBalance > 0) {
                  setTempBets(prev => ({ ...prev, [selectedZone]: prev[selectedZone] + availableBalance }));
                }
              }
            }}
            disabled={gameState !== 'betting' || !selectedZone || balance <= tempBets.PLAYER + tempBets.BANKER}
            className="bg-slate-800 text-slate-300 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest active:bg-slate-700 transition shadow-inner border border-white/5 disabled:opacity-50"
          >
            ALL IN
          </button>
          <button 
            onClick={handleCancel}
            className="bg-slate-700/40 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest border border-white/10 active:bg-slate-600/40 transition"
          >
            HỦY
          </button>
          <button 
            onClick={handleConfirm}
            disabled={gameState !== 'betting' || (tempBets.PLAYER === confirmedBets.PLAYER && tempBets.BANKER === confirmedBets.BANKER)}
            className={`bg-gradient-to-b from-[#ec5b13] to-[#b22222] text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-[0_4px_10px_rgba(236,91,19,0.4)] active:scale-95 transition disabled:grayscale disabled:opacity-50`}
          >
            XÁC NHẬN
          </button>
        </div>
      </div>
    </div>
  );
}
