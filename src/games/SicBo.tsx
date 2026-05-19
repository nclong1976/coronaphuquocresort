import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Wallet, History as HistoryIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameBalance } from '../hooks/useGameBalance';
import { useBalanceUpdate } from '../hooks/useBalanceUpdate';
import { useWallet } from '../context/WalletContext';
import { SICBO_CONFIG } from '../config/sicboConfig';
import confetti from 'canvas-confetti';

const CHIPS = [
  { val: '10', amount: 10, className: 'border-4 border-dashed border-white/20 bg-white/5 text-white font-bold' },
  { val: '50', amount: 50, className: 'border-4 border-white border-double bg-blue-600 text-white font-black' },
  { val: '100', amount: 100, className: 'border-4 border-[#d4af37] border-double gold-gradient text-slate-900 font-black shadow-xl' },
  { val: '500', amount: 500, className: 'border-4 border-white border-double bg-purple-600 text-white font-black' },
  { val: '1K', amount: 1000, className: 'border-4 border-white border-double bg-red-600 text-white font-black' },
];

const CYCLE_TIME = SICBO_CONFIG.cycleTime;
const BETTING_TIME = SICBO_CONFIG.bettingTime;
const REVEALING_TIME = SICBO_CONFIG.revealingTime;

interface BetData {
  roundId: number;
  bets: { BIG: number, SMALL: number };
  isPending: boolean;
}

const DiceFace = ({ value, className, isWinning }: { value: number, className?: string, isWinning?: boolean }) => {
  return (
    <div className={`size-12 md:size-16 gold-gradient rounded-xl dice-shadow flex items-center justify-center ${className} ${isWinning ? 'ring-4 ring-green-500' : ''}`}>
      <div className="grid grid-cols-3 grid-rows-3 gap-1 p-1 w-full h-full">
        {[...Array(9)].map((_, i) => {
          const show = (
            (value === 1 && i === 4) ||
            (value === 2 && (i === 0 || i === 8)) ||
            (value === 3 && (i === 0 || i === 4 || i === 8)) ||
            (value === 4 && (i === 0 || i === 2 || i === 6 || i === 8)) ||
            (value === 5 && (i === 0 || i === 2 || i === 4 || i === 6 || i === 8)) ||
            (value === 6 && (i === 0 || i === 2 || i === 3 || i === 5 || i === 6 || i === 8))
          );
          return (
            <div key={i} className={`rounded-full ${show ? (value === 1 || value === 4 ? 'bg-red-600' : 'bg-slate-900') : 'bg-transparent'} size-2 md:size-2.5 mx-auto my-auto`} />
          );
        })}
      </div>
    </div>
  );
};

export function SicBo({ onBack }: { onBack: () => void }) {
  const updateBalance = useBalanceUpdate();
  const balance = useGameBalance();
  const { syncBalance } = useWallet();
  
  const [gameState, setGameState] = useState<'betting' | 'revealing' | 'resetting'>('betting');
  const [timeLeft, setTimeLeft] = useState(0);
  const [roundId, setRoundId] = useState(0);

  const [selectedChip, setSelectedChip] = useState(CHIPS[0]);
  const [tempBets, setTempBets] = useState<{ BIG: number, SMALL: number }>({ BIG: 0, SMALL: 0 });
  const [confirmedBets, setConfirmedBets] = useState<{ BIG: number, SMALL: number }>({ BIG: 0, SMALL: 0 });
  const [selectedZones, setSelectedZones] = useState<('BIG' | 'SMALL')[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [customBetAmount, setCustomBetAmount] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [dice, setDice] = useState([1, 1, 1]);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [betHistoryList, setBetHistoryList] = useState<{ time: string, zone: string, amount: number, result: string, payout: number }[]>([]);
  
  const [syncing, setSyncing] = useState(true);
  const [missedReceipt, setMissedReceipt] = useState<any | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [lidVisible, setLidVisible] = useState(true);
  const [diceVisible, setDiceVisible] = useState(false);

  const requestRef = useRef<number>();

  const settleBets = useCallback((d1: number, d2: number, d3: number, currentBets: { BIG: number, SMALL: number }) => {
    const sum = d1 + d2 + d3;
    const res: 'BIG' | 'SMALL' = sum >= 11 ? 'BIG' : 'SMALL';

    let winAmount = 0;
    if (res === 'BIG' && currentBets.BIG > 0) winAmount += currentBets.BIG * 2;
    if (res === 'SMALL' && currentBets.SMALL > 0) winAmount += currentBets.SMALL * 2;

    return { winAmount, res, sum };
  }, []);

  const updateGameState = useCallback(() => {
    const now = Date.now();
    const currentCycleStart = Math.floor(now / CYCLE_TIME) * CYCLE_TIME;
    const elapsed = now - currentCycleStart;
    
    const currentRoundId = Math.floor(now / CYCLE_TIME);
    
    if (currentRoundId !== roundId) {
      setRoundId(currentRoundId);
      setTempBets({ BIG: 0, SMALL: 0 });
      setConfirmedBets({ BIG: 0, SMALL: 0 });
      setIsConfirmed(false);
      setSelectedZones([]);
      setResult(null);
      setLidVisible(true);
      setDiceVisible(false);
    }

    if (elapsed < BETTING_TIME) {
      setGameState('betting');
      setTimeLeft(Math.ceil((BETTING_TIME - elapsed) / 1000));
    } else if (elapsed < BETTING_TIME + REVEALING_TIME) {
      if (gameState === 'betting') {
        // Kích hoạt hiệu ứng mở bát
        setLidVisible(false);
        setTimeout(() => setDiceVisible(true), 900);

        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const d3 = Math.floor(Math.random() * 6) + 1;
        setDice([d1, d2, d3]);

        if (isConfirmed) {
          const { winAmount, res, sum } = settleBets(d1, d2, d3, confirmedBets);
          setResult(res);
          setHistory(prev => [res, ...prev].slice(0, 50));

          if (winAmount > 0) {
            updateBalance(winAmount);
            setTimeout(() => confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } }), 950);
          }

          if (confirmedBets.BIG > 0 || confirmedBets.SMALL > 0) {
            const newHistoryEntries: { time: string; zone: string; amount: number; result: string; payout: number }[] = [];
            const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            if (confirmedBets.BIG > 0) {
              newHistoryEntries.push({ time: timeStr, zone: 'TÀI', amount: confirmedBets.BIG, result: res === 'BIG' ? 'THẮNG' : 'THUA', payout: res === 'BIG' ? confirmedBets.BIG * 2 : 0 });
            }
            if (confirmedBets.SMALL > 0) {
              newHistoryEntries.push({ time: timeStr, zone: 'XỈU', amount: confirmedBets.SMALL, result: res === 'SMALL' ? 'THẮNG' : 'THUA', payout: res === 'SMALL' ? confirmedBets.SMALL * 2 : 0 });
            }
            setBetHistoryList(prev => [...newHistoryEntries, ...prev].slice(0, 50));
          }

          localStorage.removeItem('sicbo_pending_bet');
          setIsConfirmed(false);
          // Cập nhật số dư thực từ server sau khi kết toán
          setTimeout(() => syncBalance(), 1500);
        } else {
          const { res } = settleBets(d1, d2, d3, { BIG: 0, SMALL: 0 });
          setResult(res);
          setHistory(prev => [res, ...prev].slice(0, 50));
        }
      }
      setGameState('revealing');
      setTimeLeft(0);
      setShowConfirmModal(false);
    } else {
      setGameState('resetting');
      setTimeLeft(0);
    }

    requestRef.current = requestAnimationFrame(updateGameState);
  }, [roundId, gameState, isConfirmed, confirmedBets, updateBalance, settleBets]);

  useEffect(() => {
    // Check missed games
    const savedBet = localStorage.getItem('sicbo_pending_bet');
    if (savedBet) {
      try {
        const betData: BetData = JSON.parse(savedBet);
        const currentRoundId = Math.floor(Date.now() / CYCLE_TIME);
        if (betData.isPending && betData.roundId < currentRoundId) {
          // Simulate result for missed game
          const d1 = Math.floor(Math.random() * 6) + 1;
          const d2 = Math.floor(Math.random() * 6) + 1;
          const d3 = Math.floor(Math.random() * 6) + 1;
          
          const { winAmount, res, sum } = settleBets(d1, d2, d3, betData.bets);
          
          const totalBet = betData.bets.BIG + betData.bets.SMALL;
          const net = winAmount - totalBet;
          
          if (winAmount > 0) {
            updateBalance(winAmount);
          }

          setMissedReceipt({
            roundId: betData.roundId,
            result: res,
            sum: sum,
            net: net > 0 ? `+${net}` : net.toString()
          });
          
          localStorage.removeItem('sicbo_pending_bet');
        }
      } catch (e) {}
    }

    setTimeout(() => setSyncing(false), 1000);
    requestRef.current = requestAnimationFrame(updateGameState);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [updateGameState, updateBalance, settleBets]);

  const handleZoneSelect = (zone: 'BIG' | 'SMALL') => {
    if (gameState !== 'betting' || isConfirmed) return;
    const isSelected = selectedZones.includes(zone);
    if (isSelected) {
      setTempBets(prev => ({ ...prev, [zone]: 0 }));
      setSelectedZones(prev => prev.filter(z => z !== zone));
    } else if (SICBO_CONFIG.allowMultipleZones && selectedZones.length < SICBO_CONFIG.maxZonesPerBet) {
      setSelectedZones(prev => [...prev, zone]);
    } else if (!SICBO_CONFIG.allowMultipleZones) {
      setTempBets({ BIG: 0, SMALL: 0 });
      setSelectedZones([zone]);
    }
  };

  const handleChipClick = (chip: (typeof CHIPS)[0]) => {
    if (gameState !== 'betting' || isConfirmed) return;
    if (selectedZones.length === 0) {
      alert("Vui lòng chọn cửa đặt trước");
      return;
    }
    const totalCost = chip.amount * selectedZones.length;
    if (balance < tempBets.BIG + tempBets.SMALL + totalCost) {
      alert("Số dư không đủ");
      return;
    }
    setSelectedChip(chip);
    setTempBets(prev => {
      const newBets = { ...prev };
      selectedZones.forEach(z => {
        newBets[z] += chip.amount;
      });
      return newBets;
    });
  };

  const handleCustomBet = () => {
    if (gameState !== 'betting' || isConfirmed) return;
    if (selectedZones.length === 0) {
      alert("Vui lòng chọn cửa đặt trước");
      return;
    }
    const amount = parseInt(customBetAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const totalCost = amount * selectedZones.length;
    if (balance < tempBets.BIG + tempBets.SMALL + totalCost) {
      alert("Số dư không đủ");
      return;
    }
    
    setTempBets(prev => {
      const newBets = { ...prev };
      selectedZones.forEach(z => {
        newBets[z] += amount;
      });
      return newBets;
    });
    setCustomBetAmount('');
  };

  const handleConfirmClick = () => {
    if (gameState !== 'betting' || isConfirmed) return;
    const totalTemp = tempBets.BIG + tempBets.SMALL;
    const totalConfirmed = confirmedBets.BIG + confirmedBets.SMALL;
    const newBetAmount = totalTemp - totalConfirmed;

    if (newBetAmount <= 0) return;
    setShowConfirmModal(true);
  };

  const executeConfirm = () => {
    const totalTemp = tempBets.BIG + tempBets.SMALL;
    const totalConfirmed = confirmedBets.BIG + confirmedBets.SMALL;
    const newBetAmount = totalTemp - totalConfirmed;

    updateBalance(-newBetAmount);
    setConfirmedBets({ ...tempBets });
    setIsConfirmed(true);
    
    const betData: BetData = {
      roundId,
      bets: tempBets,
      isPending: true
    };
    localStorage.setItem('sicbo_pending_bet', JSON.stringify(betData));
    
    setShowConfirmModal(false);
  };

  const handleCancel = () => {
    if (gameState !== 'betting' || isConfirmed) return;
    setTempBets({ BIG: 0, SMALL: 0 });
    setSelectedZones([]);
  };

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(onBack, 500);
  };

  const sum = dice[0] + dice[1] + dice[2];

  const isBigActive = selectedZones.includes('BIG') || tempBets.BIG > 0 || confirmedBets.BIG > 0;
  const isSmallActive = selectedZones.includes('SMALL') || tempBets.SMALL > 0 || confirmedBets.SMALL > 0;

  return (
    <div className={`relative flex h-auto min-h-screen w-full max-w-md mx-auto flex-col overflow-x-hidden bg-[#0c0806] transition-all duration-500 ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`} style={{ fontFamily: "'Public Sans', sans-serif" }}>
      {/* Top App Bar - giống HTML */}
      <div className="flex items-center p-4 pb-2 justify-between bg-black/40 backdrop-blur-md sticky top-0 z-50 border-b border-[#d4af37]/20">
        <div onClick={handleBack} className="text-[#d4af37] flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-[#d4af37]/10 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-[#d4af37] text-lg font-extrabold leading-tight tracking-wider uppercase">Sic Bo Luxury</h2>
          <span className="text-[10px] text-[#d4af37]/60 tracking-[0.2em]">TABLE #{roundId.toString().slice(-3)}</span>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-[#996515]/20 to-[#d4af37]/20 px-3 py-1.5 rounded-full border border-[#d4af37]/30">
          <Wallet className="text-[#d4af37] size-4" />
          <p className="text-[#f9e498] text-sm font-bold leading-normal tracking-wide">${(balance - (tempBets.BIG + tempBets.SMALL - confirmedBets.BIG - confirmedBets.SMALL)).toLocaleString()}</p>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex flex-col flex-1 p-4 gap-6">
        {/* Dealer Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="size-16 rounded-full border-2 border-[#d4af37] p-0.5">
                <div className="w-full h-full rounded-full bg-center bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBgEEPQgAqAyDI24KIhCcUVWpLjq9r8YCDvEZdPWn4N8-I4e4iqEfhBYXuSLsgQSpqSiG7kS9iDqEBlv9Qc3zJ04qGfoJRB3jQIXPcnMRALE1aWdMYTK5dv5HsNNanoYwBduBLMf2vN_jEkCBiZUX1tpYfGuwJYGkRr8V4VXIhoeB-z72M1ZUdDO1PfkWB6gt5FwazWX14RoTphpwZMtzAyOWWAy8JZGMkHC6kgf4A9qVw_bQb67DH4NTZgFhzIUFry8hegzjpB0oMd")' }}></div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 size-4 rounded-full border-2 border-[#0c0806]"></div>
            </div>
            <div>
              <p className="text-white text-base font-bold leading-tight">Dealer Marc</p>
              <p className="text-[#d4af37] text-xs font-medium uppercase tracking-widest">Bàn VIP Gold</p>
            </div>
          </div>
          {/* Timer */}
          <div className="flex flex-col items-end">
            <div className="flex gap-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/20 border border-red-600 shadow-[0_0_20px_rgba(255,0,0,0.8)]">
                <p className="text-red-500 text-xl font-black drop-shadow-[0_0_5px_rgba(255,0,0,1)]">{Math.floor(timeLeft / 60).toString().padStart(2, '0')}</p>
              </div>
              <p className="text-red-500 text-xl font-black self-center">:</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/20 border border-red-600 shadow-[0_0_20px_rgba(255,0,0,0.8)]">
                <p className="text-red-500 text-xl font-black drop-shadow-[0_0_5px_rgba(255,0,0,1)]">{(timeLeft % 60).toString().padStart(2, '0')}</p>
              </div>
            </div>
            <p className="text-red-500 text-[10px] font-bold mt-1 tracking-tighter animate-pulse uppercase">
              {gameState === 'betting' ? 'ĐANG ĐẶT CƯỢC...' : 'ĐANG MỞ BÁT...'}
            </p>
          </div>
        </div>

        {/* Sic Bo Result / Opening Plate - giống HTML */}
        <div className="relative flex flex-col items-center justify-center py-8">
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full gold-gradient opacity-20 blur-2xl"></div>
            <div className="absolute inset-4 rounded-full border-[8px] border-[#d4af37]/40 border-dashed"></div>
            <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-full gold-gradient p-1 shadow-2xl luxury-shadow flex items-center justify-center overflow-hidden">
              <div className="w-full h-full rounded-full bg-[#1a130f] flex items-center justify-center relative">
                {/* Engraved Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #d4af37 1px, transparent 0)', backgroundSize: '10px 10px' }}></div>
                
                {/* The 3 Dices - stagger animation khi mở bát */}
                <div className="flex gap-4 z-10">
                  {dice.map((val, i) => (
                    <motion.div
                      key={`${roundId}-die-${i}`}
                      animate={diceVisible
                        ? { y: 0, opacity: 1, rotate: [12, -6, 45][i], scale: 1 }
                        : { y: -30, opacity: 0.06, rotate: [12, -6, 45][i], scale: 0.85 }
                      }
                      initial={false}
                      transition={diceVisible
                        ? { delay: i * 0.18, duration: 0.55, type: 'spring', stiffness: 260, damping: 18 }
                        : { duration: 0.2 }
                      }
                    >
                      <DiceFace value={val} isWinning={gameState === 'revealing' && diceVisible} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            {/* Lifted Lid Effect - Bowl Opening Animation */}
            <motion.div
              animate={lidVisible
                ? { y: 0, x: 16, opacity: 0.92, rotate: 0, scale: 1 }
                : { y: -180, x: 90, opacity: 0, rotate: -55, scale: 1.35 }
              }
              initial={false}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -top-12 -right-12 w-48 h-48 rounded-full gold-gradient shadow-2xl border-4 border-[#f9e498]/50 z-20 flex items-center justify-center"
            >
              <div className="w-10 h-10 gold-gradient rounded-full border-2 border-[#996515]/50 shadow-inner"></div>
            </motion.div>
          </div>

          {/* Result Badge - giống HTML */}
          <AnimatePresence>
            {result && diceVisible && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="mt-8 flex flex-col items-center gap-2"
              >
                <div className="px-8 py-2 gold-gradient rounded-full shadow-lg border border-[#f9e498]/50">
                  <span className="text-slate-900 font-black text-2xl tracking-widest italic">
                    {sum} - {result === 'BIG' ? 'TÀI' : 'XỈU'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Big Betting Buttons - giống HTML */}
        <div className="grid grid-cols-2 gap-4 px-4 mb-6 relative">
          {(gameState !== 'betting' || isConfirmed) && (
            <div className="absolute inset-0 z-10 bg-black/20 cursor-not-allowed rounded-2xl"></div>
          )}
          <button 
            onClick={() => handleZoneSelect('BIG')}
            className={`flex flex-col items-center justify-center h-28 rounded-2xl border-2 relative overflow-hidden group transition-all ${isBigActive ? 'gold-gradient luxury-shadow border-[#f9e498]/40' : 'bg-[#d4af37]/30 border-[#d4af37]/40'} ${gameState === 'revealing' && result === 'BIG' ? 'ring-4 ring-green-500' : ''}`}
          >
            <div className="absolute inset-0 bg-black/10 group-active:bg-black/30 transition-colors"></div>
            <span className="text-slate-900 text-3xl font-black tracking-widest italic relative z-10">TÀI</span>
            <span className="text-slate-900/60 text-sm font-bold mt-1 relative z-10">1:1</span>
            {tempBets.BIG > 0 && (
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full border border-white/50 shadow-lg">
                ${tempBets.BIG}
              </div>
            )}
            {selectedZones.includes('BIG') && <div className="absolute inset-0 border-2 border-white/40 rounded-2xl pointer-events-none"></div>}
          </button>
          <button 
            onClick={() => handleZoneSelect('SMALL')}
            className={`flex flex-col items-center justify-center h-28 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-slate-500/30 relative overflow-hidden group shadow-[0_0_15px_rgba(0,0,0,0.5)] ${isSmallActive ? 'ring-2 ring-slate-400' : ''} ${gameState === 'revealing' && result === 'SMALL' ? 'ring-4 ring-green-500' : ''}`}
          >
            <div className="absolute inset-0 bg-white/5 group-active:bg-black/30 transition-colors"></div>
            <span className="text-white text-3xl font-black tracking-widest italic relative z-10">XỈU</span>
            <span className="text-white/60 text-sm font-bold mt-1 relative z-10">1:1</span>
            {tempBets.SMALL > 0 && (
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full border border-white/50 shadow-lg">
                ${tempBets.SMALL}
              </div>
            )}
            {selectedZones.includes('SMALL') && <div className="absolute inset-0 border-2 border-white/30 rounded-2xl pointer-events-none"></div>}
          </button>
        </div>

        {/* Chips Selector - giống HTML */}
        <div className={`flex justify-center gap-3 overflow-x-auto pb-4 no-scrollbar transition-opacity ${(!selectedZones.length || isConfirmed || gameState !== 'betting') ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          {CHIPS.map(chip => (
            <div key={chip.val} className="flex flex-col items-center gap-2 shrink-0">
              <button 
                onClick={() => handleChipClick(chip)}
                disabled={gameState !== 'betting' || isConfirmed}
                className={`size-14 rounded-full flex items-center justify-center text-xs shadow-lg transition-all ${chip.className} ${gameState !== 'betting' ? 'grayscale opacity-50' : 'hover:scale-105 active:scale-95'} ${selectedChip.val === chip.val ? 'scale-110 ring-4 ring-[#d4af37]/20' : ''}`}
              >
                ${chip.val}
              </button>
            </div>
          ))}
        </div>
        
        {/* Custom Bet Input - ẩn gọn hơn */}
        {selectedZones.length > 0 && (
          <div className="flex items-center gap-2 bg-black/60 rounded-full border border-[#d4af37]/30 px-4 py-2 shadow-inner w-64 mx-auto">
            <span className="text-[#d4af37] font-bold">$</span>
            <input 
              type="number" 
              value={customBetAmount}
              onChange={(e) => setCustomBetAmount(e.target.value)}
              disabled={gameState !== 'betting' || isConfirmed}
              placeholder="Nhập số tiền..."
              className="bg-transparent text-white text-sm w-full outline-none font-mono placeholder:text-white/30"
            />
            <button 
              onClick={handleCustomBet}
              disabled={gameState !== 'betting' || !customBetAmount || isConfirmed}
              className="text-slate-900 gold-gradient px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider disabled:opacity-50 active:scale-95 transition-transform"
            >
              Đặt
            </button>
          </div>
        )}

        {/* Roadmap Statistics - giống HTML */}
        <div className="bg-black/40 rounded-xl border border-[#d4af37]/20 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2 border-b border-[#d4af37]/10">
            <span className="text-[#d4af37] text-[10px] font-bold uppercase tracking-wider">Lịch sử kết quả (Roadmap)</span>
            <div className="flex gap-2">
              <span className="text-white text-[10px]">Tài: <span className="text-[#d4af37]">{history.filter(h => h === 'BIG').length}</span></span>
              <span className="text-white text-[10px]">Xỉu: <span className="text-slate-400">{history.filter(h => h === 'SMALL').length}</span></span>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-1 p-2 h-24">
            {Array.from({ length: 12 }).map((_, colIndex) => {
              const idx = 11 - colIndex;
              const res = history[idx];
              return (
                <div key={colIndex} className="flex flex-col gap-1 justify-end">
                  {res && (
                    <div className={`size-4 rounded-full shadow-sm flex-shrink-0 ${res === 'BIG' ? 'gold-gradient' : res === 'SMALL' ? 'bg-slate-600' : 'bg-green-500'} ${idx === 0 ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : ''}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Extra Action Area - giống HTML */}
      <div className="p-4 flex gap-4 bg-gradient-to-t from-black to-transparent">
        <button 
          onClick={() => setShowHistoryModal(true)}
          className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
        >
          <HistoryIcon size={20} />
          Lịch sử cược
        </button>
        <button 
          onClick={handleConfirmClick}
          disabled={gameState !== 'betting' || isConfirmed || (tempBets.BIG === confirmedBets.BIG && tempBets.SMALL === confirmedBets.SMALL)}
          className="flex-1 h-12 rounded-xl gold-gradient text-slate-900 font-black flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20 uppercase tracking-tighter active:scale-95 transition-transform disabled:grayscale disabled:opacity-50"
        >
          Đặt CƯỢC
        </button>
      </div>

      {/* Sync Overlay */}
      {syncing && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="size-12 border-4 border-[#d4af37]/30 border-t-[#f9e498] rounded-full animate-spin mb-4"></div>
          <p className="text-[#f9e498] font-bold tracking-widest animate-pulse">Đang đồng bộ dữ liệu ván đấu...</p>
        </div>
      )}

      {/* Missed Receipt Modal */}
      {missedReceipt && (
        <div className="absolute inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#110b08] border border-[#d4af37]/50 rounded-2xl p-6 w-full max-w-sm text-center shadow-[0_0_30px_rgba(212,175,55,0.2)]">
            <h3 className="text-xl font-bold text-[#f9e498] mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>Kết Toán Vắng Mặt</h3>
            <p className="text-slate-300 text-sm mb-4">Trong lúc bạn vắng mặt, ván #{missedReceipt.roundId.toString().slice(-3)} đã kết thúc.</p>
            <div className="bg-black/40 rounded-lg p-4 mb-6">
              <p className="text-white font-bold mb-2">Kết quả: <span className={missedReceipt.result === 'BIG' ? 'text-[#d4af37]' : missedReceipt.result === 'SMALL' ? 'text-slate-300' : 'text-emerald-500'}>{missedReceipt.result === 'BIG' ? 'TÀI' : 'XỈU'} ({missedReceipt.sum})</span></p>
              <p className="text-sm">Số tiền nhận được: <span className={missedReceipt.net.startsWith('+') ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>{missedReceipt.net}</span></p>
            </div>
            <button onClick={() => setMissedReceipt(null)} className="w-full py-3 gold-gradient text-black font-black rounded-xl">XÁC NHẬN</button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-slate-800 to-slate-900 border border-[#d4af37]/50 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_30px_rgba(212,175,55,0.2)]"
            >
              <h3 className="text-[#d4af37] text-xl font-black text-center mb-4 uppercase tracking-widest">Xác nhận cược</h3>
              <div className="space-y-3 mb-6">
                {(tempBets.BIG - confirmedBets.BIG) > 0 && (
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/10">
                    <span className="text-white font-bold">TÀI</span>
                    <span className="text-[#f9e498] font-black">${(tempBets.BIG - confirmedBets.BIG).toLocaleString()}</span>
                  </div>
                )}
                {(tempBets.SMALL - confirmedBets.SMALL) > 0 && (
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/10">
                    <span className="text-white font-bold">XỈU</span>
                    <span className="text-[#f9e498] font-black">${(tempBets.SMALL - confirmedBets.SMALL).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-[#d4af37]/20 p-3 rounded-lg border border-[#d4af37]/50 mt-2">
                  <span className="text-[#d4af37] font-black uppercase">Tổng cược mới</span>
                  <span className="text-[#f9e498] font-black text-lg">${((tempBets.BIG + tempBets.SMALL) - (confirmedBets.BIG + confirmedBets.SMALL)).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold active:bg-white/20 transition-colors"
                >
                  HỦY
                </button>
                <button
                  onClick={executeConfirm}
                  className="flex-1 py-3 rounded-xl gold-gradient text-slate-900 font-black shadow-lg active:scale-95 transition-transform"
                >
                  XÁC NHẬN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bet History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#1a130f] border border-[#d4af37]/30 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_40px_rgba(212,175,55,0.15)] max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[#d4af37] text-xl font-black uppercase tracking-widest">Lịch sử cược</h3>
                <button onClick={() => setShowHistoryModal(false)} className="text-white/50 hover:text-white">
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                {betHistoryList.length === 0 ? (
                  <p className="text-center text-white/40 py-8 italic">Chưa có lịch sử cược</p>
                ) : (
                  betHistoryList.map((item, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black px-2 py-0.5 rounded ${item.zone === 'TÀI' ? 'bg-[#d4af37] text-slate-900' : 'bg-slate-600 text-white'}`}>{item.zone}</span>
                          <span className="text-white/40 text-[10px]">{item.time}</span>
                        </div>
                        <div className="text-white font-mono mt-1">${item.amount.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-black ${item.result === 'THẮNG' ? 'text-green-500' : 'text-red-500'}`}>
                          {item.result}
                        </div>
                        {item.payout > 0 && (
                          <div className="text-green-400 text-xs font-bold">+{item.payout.toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
