import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Info, Clock, Check, X, AlertTriangle, History, Lock } from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

type BetArea = 'PLAYER' | 'BANKER' | 'TIE';
type GameState = 'betting' | 'revealing' | 'resetting';

interface Card {
  suit: '♠' | '♣' | '♥' | '♦';
  value: string;
  numValue: number;
}

const CHIP_VALUES = [10, 50, 100, 500, 1000];

// --- CONSTANTS ---
const CYCLE_TIME = 299000; // 4 minutes 59 seconds per round
const BETTING_TIME = 297000; // 4 minutes 57 seconds
const REVEALING_TIME = 2000; // 2 seconds
const RESETTING_TIME = 0; // 0 seconds

interface BetData {
  roundId: number;
  bets: Record<BetArea, number>;
  isPending: boolean;
}

export function TigerBaccarat({ onBack, user, onUpdateBalance }: { onBack: () => void, user: any, onUpdateBalance: (amount: number) => void }) {
  const [gameState, setGameState] = useState<GameState>('betting');
  const [timeLeft, setTimeLeft] = useState(0);
  const [roundId, setRoundId] = useState(0);
  
  const [selectedChip, setSelectedChip] = useState<number>(10);
  const [customBetAmount, setCustomBetAmount] = useState('');
  
  const [bets, setBets] = useState<Record<BetArea, number>>({ PLAYER: 0, BANKER: 0, TIE: 0 });
  const [unconfirmedBets, setUnconfirmedBets] = useState<Record<BetArea, number>>({ PLAYER: 0, BANKER: 0, TIE: 0 });
  const [selectedZones, setSelectedZones] = useState<BetArea[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [bankerCards, setBankerCards] = useState<Card[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [bankerScore, setBankerScore] = useState(0);
  const [result, setResult] = useState<BetArea | null>(null);
  const [winAmount, setWinAmount] = useState(0);
  
  const [history, setHistory] = useState<BetArea[]>([]);
  const [showBetHistoryModal, setShowBetHistoryModal] = useState(false);
  const [betHistoryList, setBetHistoryList] = useState<{ time: string, zone: string, amount: number, result: string, payout: number }[]>([]);

  const [syncing, setSyncing] = useState(true);
  const [missedReceipt, setMissedReceipt] = useState<any | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const requestRef = useRef<number>();

  const getRandomCard = (): Card => {
    const suits: ('♠' | '♣' | '♥' | '♦')[] = ['♠', '♣', '♥', '♦'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const value = values[Math.floor(Math.random() * values.length)];
    let numValue = parseInt(value);
    if (value === 'A') numValue = 1;
    if (['10', 'J', 'Q', 'K'].includes(value)) numValue = 0;
    return { suit, value, numValue };
  };

  const calculateScore = (cards: Card[]) => {
    return cards.reduce((sum, card) => sum + card.numValue, 0) % 10;
  };

  const settleBets = useCallback((pScore: number, bScore: number, currentBets: Record<BetArea, number>) => {
    let gameResult: BetArea = 'TIE';
    if (pScore > bScore) gameResult = 'PLAYER';
    if (bScore > pScore) gameResult = 'BANKER';
    
    let winnings = 0;
    if (gameResult === 'PLAYER' && currentBets.PLAYER > 0) winnings += currentBets.PLAYER * 2;
    if (gameResult === 'BANKER' && currentBets.BANKER > 0) winnings += currentBets.BANKER * 1.95; // 5% commission
    if (gameResult === 'TIE' && currentBets.TIE > 0) winnings += currentBets.TIE * 9; // 8:1 payout means you get 9x back
    
    // Return original bets on TIE for Player/Banker
    if (gameResult === 'TIE') {
      winnings += currentBets.PLAYER;
      winnings += currentBets.BANKER;
    }

    return { winnings, gameResult };
  }, []);

  // --- GAME COORDINATOR ---
  const updateGameState = useCallback(() => {
    const now = Date.now();
    const currentCycleStart = Math.floor(now / CYCLE_TIME) * CYCLE_TIME;
    const elapsed = now - currentCycleStart;
    
    const currentRoundId = Math.floor(now / CYCLE_TIME);
    
    if (currentRoundId !== roundId) {
      setRoundId(currentRoundId);
      // Reset state for new round
      setUnconfirmedBets({ PLAYER: 0, BANKER: 0, TIE: 0 });
      setBets({ PLAYER: 0, BANKER: 0, TIE: 0 });
      setIsConfirmed(false);
      setSelectedZones([]);
      setPlayerCards([]);
      setBankerCards([]);
      setPlayerScore(0);
      setBankerScore(0);
      setResult(null);
      setWinAmount(0);
    }

    if (elapsed < BETTING_TIME) {
      setGameState('betting');
      setTimeLeft(Math.ceil((BETTING_TIME - elapsed) / 1000));
    } else if (elapsed < BETTING_TIME + REVEALING_TIME) {
      if (gameState === 'betting') {
        // Generate result
        const pCards = [getRandomCard(), getRandomCard()];
        const bCards = [getRandomCard(), getRandomCard()];
        let pScore = calculateScore(pCards);
        let bScore = calculateScore(bCards);

        if (pScore < 6 && bScore < 8) {
          pCards.push(getRandomCard());
          pScore = calculateScore(pCards);
        }
        if (bScore < 6 && pScore < 8) {
          bCards.push(getRandomCard());
          bScore = calculateScore(bCards);
        }

        setPlayerCards(pCards);
        setBankerCards(bCards);
        setPlayerScore(pScore);
        setBankerScore(bScore);
        
        // Settle bets if confirmed
        if (isConfirmed) {
          const { winnings, gameResult } = settleBets(pScore, bScore, bets);
          setResult(gameResult);
          setHistory(prev => [...prev, gameResult].slice(-20));
          
          if (winnings > 0) {
            setWinAmount(winnings);
            onUpdateBalance(winnings);
          }

          // Record history
          if (bets.PLAYER > 0 || bets.BANKER > 0 || bets.TIE > 0) {
            const newHistoryEntries = [];
            const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            
            if (bets.PLAYER > 0) {
              let payout = 0;
              let resStr = 'THUA';
              if (gameResult === 'PLAYER') { payout = bets.PLAYER * 2; resStr = 'THẮNG'; }
              else if (gameResult === 'TIE') { payout = bets.PLAYER; resStr = 'HÒA'; }
              newHistoryEntries.push({ time: timeStr, zone: 'PLAYER', amount: bets.PLAYER, result: resStr, payout });
            }
            if (bets.BANKER > 0) {
              let payout = 0;
              let resStr = 'THUA';
              if (gameResult === 'BANKER') { payout = bets.BANKER * 1.95; resStr = 'THẮNG'; }
              else if (gameResult === 'TIE') { payout = bets.BANKER; resStr = 'HÒA'; }
              newHistoryEntries.push({ time: timeStr, zone: 'BANKER', amount: bets.BANKER, result: resStr, payout });
            }
            if (bets.TIE > 0) {
              let payout = 0;
              let resStr = 'THUA';
              if (gameResult === 'TIE') { payout = bets.TIE * 9; resStr = 'THẮNG'; }
              newHistoryEntries.push({ time: timeStr, zone: 'TIE', amount: bets.TIE, result: resStr, payout });
            }
            setBetHistoryList(prev => [...newHistoryEntries, ...prev].slice(0, 50));
          }

          localStorage.removeItem('tigerbaccarat_pending_bet');
          setIsConfirmed(false); // Prevent double settling
        } else {
          // Just set result for display if no bets
          let gameResult: BetArea = 'TIE';
          if (pScore > bScore) gameResult = 'PLAYER';
          if (bScore > pScore) gameResult = 'BANKER';
          setResult(gameResult);
          setHistory(prev => [...prev, gameResult].slice(-20));
        }
      }
      setGameState('revealing');
      setTimeLeft(0);
      setShowConfirmDialog(false);
      setUnconfirmedBets({ PLAYER: 0, BANKER: 0, TIE: 0 });
    } else {
      setGameState('resetting');
      setTimeLeft(0);
    }

    requestRef.current = requestAnimationFrame(updateGameState);
  }, [roundId, gameState, isConfirmed, bets, onUpdateBalance, settleBets]);

  useEffect(() => {
    // Check missed games
    const savedBet = localStorage.getItem('tigerbaccarat_pending_bet');
    if (savedBet) {
      try {
        const betData: BetData = JSON.parse(savedBet);
        const currentRoundId = Math.floor(Date.now() / CYCLE_TIME);
        if (betData.isPending && betData.roundId < currentRoundId) {
          // Simulate result for missed game (deterministic by roundId - without server we cannot get the real result)
          const seed = (betData.roundId * 2654435761) % 2147483647;
          const pScore = Math.floor((seed % 1000) / 100);
          const bScore = Math.floor(((seed * 31) % 1000) / 100);
          
          const { winnings, gameResult } = settleBets(pScore, bScore, betData.bets);
          
          const totalBet = (Object.values(betData.bets) as number[]).reduce((a: number, b: number) => a + b, 0);
          const net = winnings - totalBet;
          
          if (winnings > 0) {
            onUpdateBalance(winnings);
          }

          setMissedReceipt({
            roundId: betData.roundId,
            result: gameResult,
            net: net > 0 ? `+${net}` : net.toString()
          });
          
          localStorage.removeItem('tigerbaccarat_pending_bet');
        }
      } catch (e) {}
    }

    setTimeout(() => setSyncing(false), 1000);
    requestRef.current = requestAnimationFrame(updateGameState);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [updateGameState, onUpdateBalance, settleBets]);

  const totalUnconfirmedBet = (Object.values(unconfirmedBets) as number[]).reduce((a: number, b: number) => a + b, 0);
  const totalConfirmedBet = (Object.values(bets) as number[]).reduce((a: number, b: number) => a + b, 0);

  const handleZoneSelect = (area: BetArea) => {
    if (gameState !== 'betting' || isConfirmed) return;
    setSelectedZones(prev => 
      prev.includes(area) ? prev.filter(z => z !== area) : [...prev, area]
    );
  };

  const handleChipClick = (chipValue: number) => {
    if (gameState !== 'betting' || isConfirmed) return;
    setSelectedChip(chipValue);
    
    if (selectedZones.length === 0) {
      alert("Vui lòng chọn cửa đặt trước");
      return;
    }
    
    const totalCost = chipValue * selectedZones.length;
    if (user.balance - totalUnconfirmedBet - totalConfirmedBet < totalCost) {
      alert("Số dư không đủ!");
      return;
    }
    
    setUnconfirmedBets(prev => {
      const newBets = { ...prev };
      selectedZones.forEach(z => newBets[z] += chipValue);
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
    if (user.balance - totalUnconfirmedBet - totalConfirmedBet < totalCost) {
      alert("Số dư không đủ!");
      return;
    }
    
    setUnconfirmedBets(prev => {
      const newBets = { ...prev };
      selectedZones.forEach(z => newBets[z] += amount);
      return newBets;
    });
    setCustomBetAmount('');
  };

  const handleAllIn = (area: BetArea) => {
    if (gameState !== 'betting' || isConfirmed) return;
    const availableBalance = user.balance - totalConfirmedBet - totalUnconfirmedBet;
    if (availableBalance <= 0) return;
    
    setUnconfirmedBets(prev => ({ ...prev, [area]: prev[area] + availableBalance }));
    setShowConfirmDialog(true);
  };

  const handleCancelBets = () => {
    if (gameState !== 'betting' || isConfirmed) return;
    setUnconfirmedBets({ PLAYER: 0, BANKER: 0, TIE: 0 });
    setSelectedZones([]);
  };

  const handleConfirmClick = () => {
    if (totalUnconfirmedBet === 0 || gameState !== 'betting' || isConfirmed) return;
    setShowConfirmDialog(true);
  };

  const confirmBets = () => {
    if (gameState !== 'betting') return;
    
    const newBets = {
      PLAYER: bets.PLAYER + unconfirmedBets.PLAYER,
      BANKER: bets.BANKER + unconfirmedBets.BANKER,
      TIE: bets.TIE + unconfirmedBets.TIE
    };
    
    setBets(newBets);
    onUpdateBalance(-totalUnconfirmedBet); // Deduct balance
    setIsConfirmed(true);
    
    const betData: BetData = {
      roundId,
      bets: newBets,
      isPending: true
    };
    localStorage.setItem('tigerbaccarat_pending_bet', JSON.stringify(betData));
    
    setUnconfirmedBets({ PLAYER: 0, BANKER: 0, TIE: 0 });
    setSelectedZones([]);
    setShowConfirmDialog(false);
  };

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(onBack, 500);
  };

  const renderCard = (card: Card, index: number) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <div key={index} className="w-12 h-16 bg-white rounded shadow-md border border-gray-200 flex flex-col items-center justify-center relative animate-in fade-in zoom-in duration-300">
        <span className={`text-sm font-bold ${isRed ? 'text-red-600' : 'text-black'} absolute top-1 left-1 leading-none`}>{card.value}</span>
        <span className={`text-2xl ${isRed ? 'text-red-600' : 'text-black'}`}>{card.suit}</span>
      </div>
    );
  };

  return (
    <div className={`max-w-md mx-auto bg-[#221610] relative flex flex-col h-screen overflow-hidden border-x border-[#ec5b13]/20 text-slate-100 font-sans transition-all duration-500 ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <style>{`
        .gold-gradient { background: linear-gradient(135deg, #f6d365 0%, #9c6b05 100%); }
        .silver-gradient { background: linear-gradient(135deg, #e2e2e2 0%, #8e8e8e 100%); }
        .luxury-glass { background: rgba(34, 22, 16, 0.7); backdrop-filter: blur(8px); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div className="flex items-center bg-[#221610]/90 p-4 border-b border-[#ec5b13]/20 sticky top-0 z-50 justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-[#ec5b13] hover:bg-[#ec5b13]/10 p-2 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-[#ec5b13] font-bold leading-tight tracking-tight">Tiger Baccarat</h2>
            <span className="text-[10px] text-[#ec5b13]/60 uppercase tracking-widest font-semibold">Luxury Gold Edition</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 uppercase">Balance</span>
            <span className="text-[#f6d365] font-bold">${(user.balance - totalUnconfirmedBet).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <button onClick={() => setShowBetHistoryModal(true)} className="p-2 rounded-full transition-colors text-[#ec5b13] hover:bg-[#ec5b13]/10">
            <History size={24} />
          </button>
        </div>
      </div>

      {/* Main Content Area Scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {/* Live Dealer Section */}
        <div className="relative w-full aspect-video bg-neutral-900">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBFoB7lvOMR-m7_duS0_XbALlqZlUufvLO0vRnDYpGoWsPEYHFtckFtrNHI_fwogLEswiQS7-d2h4iDyTgt-89Z7ZjoH_zBR4afYajICNz9Edwm9kDtLQtrWxCe8EQlAcP7jCZmZU5CxITy2djdGxE6wB6gxqj34QCoE4L2rqN9B5XNQCrC7ajgqkWTsWHGpvZKK8BAOVVvS9MR3WdeS03-jznil8UY3NXLQIgXYGtDW9ytfOAF0yRc-V-FtBWqA7hhwvz5PKQ-nPh-')" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#221610] via-transparent to-transparent opacity-60"></div>
          </div>
          
          {/* Live Label & Timer */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="bg-red-600 px-3 py-1 rounded flex items-center gap-1 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span className="text-[10px] font-bold text-white tracking-widest uppercase">TRỰC TIẾP</span>
            </div>
            {gameState === 'betting' && (
              <div className="luxury-glass px-3 py-1 rounded border border-[#ec5b13]/30 flex items-center gap-2">
                <Clock size={14} className="text-[#ec5b13]" />
                <span className={`font-mono text-sm font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-[#f6d365]'}`}>
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
            {gameState !== 'betting' && (
              <div className="luxury-glass px-3 py-1 rounded border border-red-500/50 flex items-center gap-2 bg-red-900/40">
                <Lock size={14} className="text-red-400" />
                <span className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest">Khóa Cược</span>
              </div>
            )}
          </div>

          <div className="absolute top-4 right-4 bg-black/60 px-2 py-0.5 rounded border border-[#ec5b13]/40 text-[10px] font-bold text-[#f6d365]">
            Mã: #{roundId.toString().slice(-6)}
          </div>

          {/* Result Overlay */}
          {gameState === 'revealing' && result && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20 animate-in fade-in duration-500">
              <div className="text-center">
                <h3 className={`text-4xl font-black uppercase tracking-widest drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] ${
                  result === 'PLAYER' ? 'text-blue-500' : result === 'BANKER' ? 'text-red-500' : 'text-green-500'
                }`}>
                  {result} WIN
                </h3>
                {winAmount > 0 && (
                  <p className="text-2xl font-bold text-[#f6d365] mt-2 animate-bounce">+{winAmount.toLocaleString()} USD</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Roadmap / Statistics */}
        <div className="px-4 mb-4 mt-4">
          <div className="bg-black/40 rounded-xl p-3 border border-[#ec5b13]/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#ec5b13] text-xs font-bold uppercase tracking-widest">Thống kê</span>
              <div className="flex gap-3">
                <span className="text-white text-[10px]">P: <span className="text-blue-400">{history.filter(h => h === 'PLAYER').length}</span></span>
                <span className="text-white text-[10px]">B: <span className="text-red-400">{history.filter(h => h === 'BANKER').length}</span></span>
                <span className="text-white text-[10px]">T: <span className="text-green-400">{history.filter(h => h === 'TIE').length}</span></span>
              </div>
            </div>
            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
              {history.length === 0 && <span className="text-xs text-slate-500 italic">Chưa có dữ liệu</span>}
              {history.map((res, idx) => (
                <div key={idx} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  res === 'PLAYER' ? 'bg-blue-500 text-white' : res === 'BANKER' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                }`}>
                  {res.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bet History Table Section */}
        <div className="px-4 mt-6">
          <h3 className="text-[#ec5b13] text-xs font-bold uppercase tracking-widest mb-2">Lịch sử cược gần đây</h3>
          <div className="bg-black/40 rounded-xl border border-[#ec5b13]/20 overflow-hidden">
            <table className="w-full text-xs text-left text-white/70">
              <thead className="bg-[#221610]/50 text-[#ec5b13] uppercase">
                <tr>
                  <th className="px-3 py-2">Loại</th>
                  <th className="px-3 py-2">Số tiền</th>
                  <th className="px-3 py-2">Kết quả</th>
                  <th className="px-3 py-2">Thưởng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ec5b13]/10">
                {betHistoryList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center italic">Chưa có lịch sử cược</td>
                  </tr>
                ) : (
                  betHistoryList.slice(0, 5).map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-bold">{item.zone}</td>
                      <td className="px-3 py-2 font-mono">${item.amount.toLocaleString()}</td>
                      <td className={`px-3 py-2 font-bold ${item.result === 'THẮNG' ? 'text-green-500' : 'text-red-500'}`}>{item.result}</td>
                      <td className="px-3 py-2 font-mono text-green-400">{item.payout > 0 ? `+${item.payout.toLocaleString()}` : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card Display Area */}
        <div className="flex justify-around py-6 bg-gradient-to-b from-[#221610] to-neutral-900 border-b border-[#ec5b13]/10 min-h-[160px]">
          <div className="flex flex-col items-center gap-2 w-1/2">
            <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">PLAYER</span>
            <div className="flex gap-1 justify-center min-h-[64px]">
              {playerCards.map((card, i) => renderCard(card, i))}
            </div>
            {playerCards.length > 0 && (
              <div className="mt-2 bg-blue-900/50 border border-blue-500/30 text-blue-300 text-xs px-3 py-1 rounded-full font-bold">
                {playerScore} Điểm
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-2 w-1/2">
            <span className="text-xs font-bold text-red-400 tracking-widest uppercase">BANKER</span>
            <div className="flex gap-1 justify-center min-h-[64px]">
              {bankerCards.map((card, i) => renderCard(card, i))}
            </div>
            {bankerCards.length > 0 && (
              <div className="mt-2 bg-red-900/50 border border-red-500/30 text-red-300 text-xs px-3 py-1 rounded-full font-bold">
                {bankerScore} Điểm
              </div>
            )}
          </div>
        </div>

        {/* Betting Main Area */}
        <div className="p-4 grid grid-cols-5 gap-2 relative">
          {/* Overlay when not betting */}
          {(gameState !== 'betting' || isConfirmed) && (
            <div className="absolute inset-0 z-10 bg-black/20 cursor-not-allowed"></div>
          )}

          <button 
            onClick={() => handleZoneSelect('PLAYER')}
            className={`col-span-2 aspect-[4/3] rounded-xl border border-blue-500/30 bg-blue-500/10 flex flex-col items-center justify-center group relative overflow-hidden transition-all hover:bg-blue-500/20 active:scale-95 ${(bets.PLAYER > 0 || unconfirmedBets.PLAYER > 0 || selectedZones.includes('PLAYER')) ? 'ring-2 ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] bg-blue-500/20' : ''}`}
          >
            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-blue-400 to-transparent"></div>
            <span className="text-blue-400 font-bold text-lg mb-1 relative">PLAYER</span>
            <span className="text-[10px] text-blue-400/80 font-semibold relative">1:1</span>
            
            {/* Chips display */}
            {(bets.PLAYER > 0 || unconfirmedBets.PLAYER > 0) && (
              <div className="absolute bottom-2 flex flex-col items-center">
                {bets.PLAYER > 0 && <span className="text-xs font-bold text-white bg-blue-600/80 px-2 py-0.5 rounded-full">${bets.PLAYER}</span>}
                {unconfirmedBets.PLAYER > 0 && <span className="text-[10px] font-bold text-yellow-400 mt-1 animate-pulse">+${unconfirmedBets.PLAYER}</span>}
              </div>
            )}
            {selectedZones.includes('PLAYER') && <div className="absolute inset-0 border-4 border-white/50 rounded-xl animate-pulse"></div>}
          </button>

          <button 
            onClick={() => handleZoneSelect('TIE')}
            className={`col-span-1 aspect-[4/3] rounded-xl border border-green-500/30 bg-green-500/10 flex flex-col items-center justify-center group relative overflow-hidden transition-all hover:bg-green-500/20 active:scale-95 ${(bets.TIE > 0 || unconfirmedBets.TIE > 0 || selectedZones.includes('TIE')) ? 'ring-2 ring-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)] bg-green-500/20' : ''}`}
          >
            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-green-400 to-transparent"></div>
            <span className="text-green-400 font-bold text-sm mb-1 relative uppercase">Tie</span>
            <span className="text-[10px] text-green-400/80 font-semibold relative">8:1</span>

            {(bets.TIE > 0 || unconfirmedBets.TIE > 0) && (
              <div className="absolute bottom-2 flex flex-col items-center">
                {bets.TIE > 0 && <span className="text-xs font-bold text-white bg-green-600/80 px-2 py-0.5 rounded-full">${bets.TIE}</span>}
                {unconfirmedBets.TIE > 0 && <span className="text-[10px] font-bold text-yellow-400 mt-1 animate-pulse">+${unconfirmedBets.TIE}</span>}
              </div>
            )}
            {selectedZones.includes('TIE') && <div className="absolute inset-0 border-4 border-white/50 rounded-xl animate-pulse"></div>}
          </button>

          <button 
            onClick={() => handleZoneSelect('BANKER')}
            className={`col-span-2 aspect-[4/3] rounded-xl border border-red-500/30 bg-red-500/10 flex flex-col items-center justify-center group relative overflow-hidden transition-all hover:bg-red-500/20 active:scale-95 ${(bets.BANKER > 0 || unconfirmedBets.BANKER > 0 || selectedZones.includes('BANKER')) ? 'ring-2 ring-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] bg-red-500/20' : ''}`}
          >
            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-red-400 to-transparent"></div>
            <span className="text-red-400 font-bold text-lg mb-1 relative uppercase">Banker</span>
            <span className="text-[10px] text-red-400/80 font-semibold relative">0.95:1</span>

            {(bets.BANKER > 0 || unconfirmedBets.BANKER > 0) && (
              <div className="absolute bottom-2 flex flex-col items-center">
                {bets.BANKER > 0 && <span className="text-xs font-bold text-white bg-red-600/80 px-2 py-0.5 rounded-full">${bets.BANKER}</span>}
                {unconfirmedBets.BANKER > 0 && <span className="text-[10px] font-bold text-yellow-400 mt-1 animate-pulse">+${unconfirmedBets.BANKER}</span>}
              </div>
            )}
            {selectedZones.includes('BANKER') && <div className="absolute inset-0 border-4 border-white/50 rounded-xl animate-pulse"></div>}
          </button>
        </div>

        {/* Action Buttons (All In, Cancel, Confirm) */}
        <div className="px-4 flex gap-2 mb-2">
          <button 
            onClick={handleCancelBets}
            disabled={totalUnconfirmedBet === 0 || gameState !== 'betting' || isConfirmed}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${totalUnconfirmedBet > 0 && gameState === 'betting' && !isConfirmed ? 'bg-stone-700 text-white hover:bg-stone-600' : 'bg-stone-800/50 text-stone-500'}`}
          >
            Hủy Cược
          </button>
          <button 
            onClick={handleConfirmClick}
            disabled={totalUnconfirmedBet === 0 || gameState !== 'betting' || isConfirmed}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${totalUnconfirmedBet > 0 && gameState === 'betting' && !isConfirmed ? 'gold-gradient text-black shadow-lg shadow-yellow-600/20' : 'bg-stone-800/50 text-stone-500'}`}
          >
            Xác Nhận (${totalUnconfirmedBet})
          </button>
        </div>
      </div>

      {/* Chips Selection Row - Fixed at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 px-4 py-3 bg-neutral-900/90 backdrop-blur-md border-t border-[#ec5b13]/20 flex flex-col gap-3 z-30 transition-opacity ${(!selectedZones.length || isConfirmed || gameState !== 'betting') ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'}`}>
        
        {/* Custom Bet Input */}
        <div className="flex items-center gap-2 bg-black/60 rounded-full border border-[#ec5b13]/30 px-4 py-2 shadow-inner w-full">
          <span className="text-[#ec5b13] font-bold">$</span>
          <input 
            type="number" 
            value={customBetAmount}
            onChange={(e) => setCustomBetAmount(e.target.value)}
            disabled={gameState !== 'betting' || isConfirmed}
            placeholder="Nhập số tiền..."
            className="bg-transparent text-white text-sm w-full outline-none font-mono placeholder:text-white/30"
          />
          <div className="flex gap-1">
            <button 
              onClick={handleCustomBet}
              disabled={gameState !== 'betting' || !customBetAmount || isConfirmed}
              className="text-slate-900 bg-gradient-to-r from-[#d4af37] to-[#996515] px-4 py-1 rounded text-xs font-black uppercase disabled:opacity-50 active:scale-95"
            >
              ĐẶT
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 flex justify-between items-center gap-2 overflow-x-auto no-scrollbar py-2">
            {CHIP_VALUES.map((val) => (
              <button 
                key={val} 
                onClick={() => handleChipClick(val)}
                className={`size-12 shrink-0 rounded-full border-4 border-dashed transition-all ${selectedChip === val ? 'border-yellow-400 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.8)] ring-2 ring-yellow-400' : 'border-white/20 hover:scale-105'} bg-blue-600 flex items-center justify-center`}
              >
                <div className="size-8 rounded-full bg-white flex items-center justify-center">
                  <span className="text-[10px] font-black text-blue-600">${val >= 1000 ? '1k' : val}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => handleAllIn('PLAYER')}
              disabled={gameState !== 'betting' || isConfirmed}
              className="silver-gradient px-3 py-1.5 rounded-lg shadow-lg transform active:scale-95 transition-all flex items-center justify-center group disabled:opacity-50"
            >
              <span className="text-[#221610] text-[10px] font-black italic tracking-tighter">ALL IN (P)</span>
            </button>
            <button 
              onClick={() => handleAllIn('BANKER')}
              disabled={gameState !== 'betting' || isConfirmed}
              className="silver-gradient px-3 py-1.5 rounded-lg shadow-lg transform active:scale-95 transition-all flex items-center justify-center group disabled:opacity-50"
            >
              <span className="text-[#221610] text-[10px] font-black italic tracking-tighter">ALL IN (B)</span>
            </button>
          </div>
        </div>
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
            <p className="text-slate-300 text-sm mb-4">Trong lúc bạn vắng mặt, ván #{missedReceipt.roundId.toString().slice(-6)} đã kết thúc.</p>
            <div className="bg-black/40 rounded-lg p-4 mb-6">
              <p className="text-white font-bold mb-2">Kết quả: <span className={missedReceipt.result === 'PLAYER' ? 'text-blue-500' : missedReceipt.result === 'BANKER' ? 'text-red-500' : 'text-emerald-500'}>{missedReceipt.result}</span></p>
              <p className="text-sm">Số tiền nhận được: <span className={missedReceipt.net.startsWith('+') ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>{missedReceipt.net}</span></p>
            </div>
            <button onClick={() => setMissedReceipt(null)} className="w-full py-3 bg-gradient-to-br from-[#996515] via-[#f9e498] to-[#d4af37] text-black font-black rounded-xl">XÁC NHẬN</button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#221610] border border-[#ec5b13]/50 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_40px_rgba(236,91,19,0.2)]"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-[#ec5b13]/20 flex items-center justify-center border border-[#ec5b13]/50">
                  <AlertTriangle className="text-[#ec5b13]" size={24} />
                </div>
              </div>
              <h3 className="text-[#f6d365] text-xl font-black mb-2 text-center uppercase tracking-widest">Xác nhận cược</h3>
              <p className="text-white/60 text-center text-sm mb-6">Bạn có chắc chắn muốn đặt cược với số tiền này?</p>
              
              <div className="bg-black/40 rounded-xl p-4 mb-6 border border-white/5 space-y-2">
                {unconfirmedBets.PLAYER > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-400 font-bold">PLAYER</span>
                    <span className="text-white font-mono">+${unconfirmedBets.PLAYER}</span>
                  </div>
                )}
                {unconfirmedBets.BANKER > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-400 font-bold">BANKER</span>
                    <span className="text-white font-mono">+${unconfirmedBets.BANKER}</span>
                  </div>
                )}
                {unconfirmedBets.TIE > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400 font-bold">TIE</span>
                    <span className="text-white font-mono">+${unconfirmedBets.TIE}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-3 mt-1 flex justify-between font-black">
                  <span className="text-white">TỔNG CƯỢC MỚI</span>
                  <span className="text-[#f6d365] font-mono text-lg">${totalUnconfirmedBet}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmBets}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#ec5b13] to-[#d4af37] text-white font-black shadow-lg shadow-[#ec5b13]/20"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Bet History Modal */}
      <AnimatePresence>
        {showBetHistoryModal && (
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
              className="bg-[#221610] border border-[#ec5b13]/30 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_40px_rgba(236,91,19,0.15)] max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[#ec5b13] text-xl font-black uppercase tracking-widest">Lịch sử cược</h3>
                <button onClick={() => setShowBetHistoryModal(false)} className="text-white/50 hover:text-white">
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
                          <span className={`text-xs font-black px-2 py-0.5 rounded ${item.zone === 'PLAYER' ? 'bg-blue-600 text-white' : item.zone === 'BANKER' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>{item.zone}</span>
                          <span className="text-white/40 text-[10px]">{item.time}</span>
                        </div>
                        <div className="text-white font-mono mt-1">${item.amount.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-black ${item.result === 'THẮNG' ? 'text-green-500' : item.result === 'HÒA' ? 'text-yellow-500' : 'text-red-500'}`}>
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
