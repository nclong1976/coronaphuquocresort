import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Settings, Clock, Info, X } from 'lucide-react';
import { useGameBalance } from '../hooks/useGameBalance';
import { useBalanceUpdate } from '../hooks/useBalanceUpdate';

// --- CONSTANTS ---
const CYCLE_TIME = 299000; // 4 minutes 59 seconds per round
const BETTING_TIME = 297000; // 4 minutes 57 seconds
const REVEALING_TIME = 2000; // 2 seconds
const RESETTING_TIME = 0; // 0 seconds

const CHIPS = [50, 100, 500, 1000];

interface BetData {
  roundId: number;
  bets: Record<string, number>;
  isPending: boolean;
}

export function BaccaratLongHo({ onBack }: { onBack: () => void }) {
  const updateBalance = useBalanceUpdate();
  const balance = useGameBalance();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [tempBets, setTempBets] = useState<Record<string, number>>({});
  const [confirmedBets, setConfirmedBets] = useState<Record<string, number>>({});
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const [gameState, setGameState] = useState<'betting' | 'revealing' | 'resetting'>('betting');
  const [timeLeft, setTimeLeft] = useState(0);
  const [roundId, setRoundId] = useState(0);
  
  const [isExiting, setIsExiting] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [missedReceipt, setMissedReceipt] = useState<any | null>(null);
  const [showModal, setShowModal] = useState<'settings' | 'history' | 'rules' | null>(null);
  
  const [cards, setCards] = useState<{ long: number | null, ho: number | null }>({ long: null, ho: null });
  const [history, setHistory] = useState<string[]>(Array(24).fill('long').map(() => Math.random() > 0.5 ? 'long' : 'ho'));

  const requestRef = useRef<number>();

  // --- GAME COORDINATOR ---
  const updateGameState = useCallback(() => {
    const now = Date.now();
    const currentCycleStart = Math.floor(now / CYCLE_TIME) * CYCLE_TIME;
    const elapsed = now - currentCycleStart;
    
    const currentRoundId = Math.floor(now / CYCLE_TIME);
    
    if (currentRoundId !== roundId) {
      setRoundId(currentRoundId);
      // Reset state for new round
      setTempBets({});
      setConfirmedBets({});
      setIsConfirmed(false);
      setSelectedZone(null);
      setCards({ long: null, ho: null });
    }

    if (elapsed < BETTING_TIME) {
      setGameState('betting');
      setTimeLeft(Math.ceil((BETTING_TIME - elapsed) / 1000));
    } else if (elapsed < BETTING_TIME + REVEALING_TIME) {
      if (gameState === 'betting') {
        // Generate result
        const longCard = Math.floor(Math.random() * 13) + 1;
        const hoCard = Math.floor(Math.random() * 13) + 1;
        setCards({ long: longCard, ho: hoCard });
        
        // Settle bets if confirmed
        if (isConfirmed) {
          settleBets(longCard, hoCard);
        }
      }
      setGameState('revealing');
      setTimeLeft(0);
    } else {
      setGameState('resetting');
      setTimeLeft(0);
    }

    requestRef.current = requestAnimationFrame(updateGameState);
  }, [roundId, gameState, isConfirmed]);

  useEffect(() => {
    // Check missed games
    const savedBet = localStorage.getItem('longho_pending_bet');
    if (savedBet) {
      try {
        const betData: BetData = JSON.parse(savedBet);
        const currentRoundId = Math.floor(Date.now() / CYCLE_TIME);
        if (betData.isPending && betData.roundId < currentRoundId) {
          // Simulate result for missed game
          const longCard = Math.floor(Math.random() * 13) + 1;
          const hoCard = Math.floor(Math.random() * 13) + 1;
          let winAmount = 0;
          let resultStr = '';
          
          if (longCard > hoCard) {
            winAmount += (betData.bets['LONG'] || 0) * 2;
            resultStr = 'LONG';
          } else if (hoCard > longCard) {
            winAmount += (betData.bets['HỔ'] || 0) * 2;
            resultStr = 'HỔ';
          } else {
            winAmount += (betData.bets['HÒA'] || 0) * 9;
            winAmount += (betData.bets['LONG'] || 0) * 0.5; // Return half
            winAmount += (betData.bets['HỔ'] || 0) * 0.5;
            resultStr = 'HÒA';
          }
          
          const totalBet = Object.values(betData.bets).reduce((a: number, b: number) => a + b, 0);
          const net = winAmount - totalBet;
          
          updateBalance(winAmount);
          setMissedReceipt({
            roundId: betData.roundId,
            result: resultStr,
            net: net > 0 ? `+${net}` : net.toString()
          });
          
          localStorage.removeItem('longho_pending_bet');
        }
      } catch (e) {}
    }

    setTimeout(() => setSyncing(false), 1000);
    requestRef.current = requestAnimationFrame(updateGameState);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [updateGameState]);

  const settleBets = (longCard: number, hoCard: number) => {
    let winAmount = 0;
    if (longCard > hoCard) {
      winAmount += (confirmedBets['LONG'] || 0) * 2;
    } else if (hoCard > longCard) {
      winAmount += (confirmedBets['HỔ'] || 0) * 2;
    } else {
      winAmount += (confirmedBets['HÒA'] || 0) * 9;
      winAmount += (confirmedBets['LONG'] || 0) * 0.5;
      winAmount += (confirmedBets['HỔ'] || 0) * 0.5;
    }
    if (winAmount > 0) {
      updateBalance(winAmount);
    }
    localStorage.removeItem('longho_pending_bet');
  };

  // --- ACTIONS ---
  const handleZoneClick = (zone: string) => {
    if (gameState !== 'betting' || isConfirmed) return;
    setSelectedZone(zone);
  };

  const handleChipClick = (amount: number) => {
    if (gameState !== 'betting' || isConfirmed) return;
    if (!selectedZone) {
      alert("Vui lòng chọn cửa đặt trước");
      return;
    }
    const currentTotal = (Object.values(tempBets) as number[]).reduce((a: number, b: number) => a + b, 0);
    if (currentTotal + amount > balance) {
      alert("Số dư không đủ!");
      return;
    }
    setTempBets(prev => ({ ...prev, [selectedZone]: (prev[selectedZone] || 0) + amount }));
  };

  const handleAllIn = () => {
    if (gameState !== 'betting' || isConfirmed) return;
    if (!selectedZone) {
      alert("Vui lòng chọn cửa đặt trước");
      return;
    }
    const currentTotal = (Object.values(tempBets) as number[]).reduce((a: number, b: number) => a + b, 0);
    const remaining = balance - currentTotal;
    if (remaining > 0) {
      setTempBets(prev => ({ ...prev, [selectedZone]: (prev[selectedZone] || 0) + remaining }));
    }
  };

  const handleClear = () => {
    if (gameState !== 'betting' || isConfirmed) return;
    setTempBets({});
  };

  const handleConfirm = () => {
    if (gameState !== 'betting' || isConfirmed) return;
    const totalBet = (Object.values(tempBets) as number[]).reduce((a: number, b: number) => a + b, 0);
    if (totalBet === 0) return;
    
    updateBalance(-totalBet);
    setConfirmedBets(tempBets);
    setIsConfirmed(true);
    
    const betData: BetData = {
      roundId,
      bets: tempBets,
      isPending: true
    };
    localStorage.setItem('longho_pending_bet', JSON.stringify(betData));
  };

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(onBack, 500);
  };

  const totalTempBet = (Object.values(tempBets) as number[]).reduce((a: number, b: number) => a + b, 0);
  const displayBalance = balance - totalTempBet;

  return (
    <div className={`relative flex flex-col w-full max-w-md mx-auto min-h-screen bg-[#110b08] shadow-2xl border-x border-[#d4af37]/20 font-sans text-slate-100 transition-all duration-500 ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      
      {/* Top App Bar */}
      <header className="flex items-center justify-between p-4 bg-[#110b08]/80 sticky top-0 z-50 border-b border-[#d4af37]/30 backdrop-blur-md">
        <button onClick={handleBack} className="text-[#f9e498] hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[#f9e498] text-xl font-bold tracking-widest drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" style={{ fontFamily: '"Playfair Display", serif' }}>LONG HỔ</h1>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-[#d4af37]/60 uppercase font-bold tracking-tighter">Số dư</span>
          <p className="text-[#f9e498] text-sm font-bold">${displayBalance.toLocaleString()}</p>
        </div>
      </header>

      {/* Live Video Area */}
      <div className="relative w-full aspect-video bg-black overflow-hidden group">
        <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1596743444253-447c4bf23027?q=80&w=2070&auto=format&fit=crop')" }}></div>
        
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="flex items-center bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-white"></span>
            TRỰC TIẾP
          </div>
          <div className="bg-black/60 px-2 py-0.5 rounded border border-[#d4af37]/40 text-[10px] font-bold text-[#f9e498]">
            Mã: #{roundId.toString().slice(-6)}
          </div>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button onClick={() => setShowModal('rules')} className="size-8 rounded-full bg-black/60 border border-[#d4af37]/40 flex items-center justify-center text-[#f9e498] backdrop-blur-md">
            <Info size={16} />
          </button>
          <button onClick={() => setShowModal('history')} className="size-8 rounded-full bg-black/60 border border-[#d4af37]/40 flex items-center justify-center text-[#f9e498] backdrop-blur-md">
            <Clock size={16} />
          </button>
          <button onClick={() => setShowModal('settings')} className="size-8 rounded-full bg-black/60 border border-[#d4af37]/40 flex items-center justify-center text-[#f9e498] backdrop-blur-md">
            <Settings size={16} />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 w-1/2 max-h-24 overflow-hidden pointer-events-none">
          <div className="bg-white/5 backdrop-blur-md border border-[#d4af37]/20 p-2 rounded-lg text-[10px] space-y-1">
            <p className="text-white/70"><span className="text-[#f9e498] font-bold">User77:</span> Long thắng đậm!</p>
            <p className="text-white/70"><span className="text-[#f9e498] font-bold">VipPlayer:</span> Chuẩn bị all in hổ</p>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center">
            {gameState === 'betting' ? (
              <>
                <div className="text-[#f9e498] text-5xl font-black drop-shadow-[0_0_15px_rgba(212,175,55,0.8)] tracking-tight">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-[10px] text-white/80 bg-black/40 px-3 py-0.5 rounded-full backdrop-blur-sm border border-white/20">ĐANG ĐẶT CƯỢC</div>
              </>
            ) : (
              <div className="text-red-500 text-3xl font-black drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] tracking-widest uppercase">
                {gameState === 'revealing' ? 'MỞ BÀI' : 'CHỜ VÁN MỚI'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards Area */}
      <div className="flex justify-between items-center px-8 py-6 gap-6 bg-gradient-to-b from-[#110b08] to-black/90">
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-full aspect-[2/3] rounded-xl flex items-center justify-center p-2 bg-gradient-to-br from-slate-900 to-black overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.2)] border border-[#d4af37]/50 relative">
            {cards.long ? (
              <span className="text-4xl font-black text-white">{cards.long}</span>
            ) : (
              <img alt="Logo" className="w-16 h-16 object-contain opacity-50 grayscale contrast-125" src="https://casinocorona.vn/wp-content/uploads/2023/10/logo-corona-casino-phu-quoc.png" />
            )}
          </div>
          <span className="text-blue-500 font-black tracking-widest text-lg drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">LONG</span>
        </div>
        <div className="text-[#d4af37]/30 font-black text-2xl italic">VS</div>
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-full aspect-[2/3] rounded-xl flex items-center justify-center p-2 bg-gradient-to-br from-slate-900 to-black overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.2)] border border-[#d4af37]/50 relative">
            {cards.ho ? (
              <span className="text-4xl font-black text-white">{cards.ho}</span>
            ) : (
              <img alt="Logo" className="w-16 h-16 object-contain opacity-50 grayscale contrast-125" src="https://casinocorona.vn/wp-content/uploads/2023/10/logo-corona-casino-phu-quoc.png" />
            )}
          </div>
          <span className="text-red-500 font-black tracking-widest text-lg drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">HỔ</span>
        </div>
      </div>

      {/* Betting Area */}
      <div className="px-4 grid grid-cols-3 gap-2 py-2 relative">
        {isConfirmed && <div className="absolute inset-0 z-10"></div>}
        
        <button 
          onClick={() => handleZoneClick('LONG')}
          className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all ${selectedZone === 'LONG' ? 'bg-blue-800/60 border-[#f9e498] shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105' : 'bg-blue-900/40 border-[#d4af37]/50 hover:bg-blue-800/50'}`}
        >
          <span className="text-white text-xl font-black">LONG</span>
          <span className="text-[#f9e498] text-xs font-bold">1:1</span>
          {(tempBets['LONG'] || confirmedBets['LONG']) && (
            <div className="absolute top-2 right-2 bg-[#f9e498] text-black text-[10px] px-2 py-0.5 rounded-full font-bold">
              ${(tempBets['LONG'] || 0) + (confirmedBets['LONG'] || 0)}
            </div>
          )}
        </button>
        
        <button 
          onClick={() => handleZoneClick('HÒA')}
          className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all ${selectedZone === 'HÒA' ? 'bg-emerald-800/60 border-[#f9e498] shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-105' : 'bg-emerald-900/40 border-[#d4af37]/50 hover:bg-emerald-800/50'}`}
        >
          <span className="text-white text-xl font-black">HÒA</span>
          <span className="text-[#f9e498] text-xs font-bold">1:8</span>
          {(tempBets['HÒA'] || confirmedBets['HÒA']) && (
            <div className="absolute top-2 right-2 bg-[#f9e498] text-black text-[10px] px-2 py-0.5 rounded-full font-bold">
              ${(tempBets['HÒA'] || 0) + (confirmedBets['HÒA'] || 0)}
            </div>
          )}
        </button>
        
        <button 
          onClick={() => handleZoneClick('HỔ')}
          className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all ${selectedZone === 'HỔ' ? 'bg-red-800/60 border-[#f9e498] shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-105' : 'bg-red-900/40 border-[#d4af37]/50 hover:bg-red-800/50'}`}
        >
          <span className="text-white text-xl font-black">HỔ</span>
          <span className="text-[#f9e498] text-xs font-bold">1:1</span>
          {(tempBets['HỔ'] || confirmedBets['HỔ']) && (
            <div className="absolute top-2 right-2 bg-[#f9e498] text-black text-[10px] px-2 py-0.5 rounded-full font-bold">
              ${(tempBets['HỔ'] || 0) + (confirmedBets['HỔ'] || 0)}
            </div>
          )}
        </button>
      </div>

      {/* Chips System */}
      <div className={`px-4 py-6 overflow-x-auto no-scrollbar transition-opacity ${(!selectedZone || isConfirmed || gameState !== 'betting') ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center justify-between gap-3 min-w-max">
          {CHIPS.map((chip, idx) => {
            const colors = ['bg-blue-600', 'bg-red-600', 'bg-purple-600', 'bg-emerald-600'];
            const textColors = ['text-blue-600', 'text-red-600', 'text-purple-600', 'text-emerald-600'];
            return (
              <button key={chip} onClick={() => handleChipClick(chip)} className={`size-14 rounded-full border-4 border-dashed border-white/20 ${colors[idx]} flex items-center justify-center shadow-lg transform active:scale-95`}>
                <div className={`size-10 rounded-full bg-white flex items-center justify-center ${textColors[idx]} font-bold text-xs`}>{chip}</div>
              </button>
            );
          })}
          <button onClick={handleAllIn} className="size-14 rounded-full border-4 border-dashed border-[#d4af37]/40 bg-gradient-to-br from-slate-200 to-slate-500 flex items-center justify-center shadow-xl transform active:scale-95">
            <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 font-black text-[10px]">ALL IN</div>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 grid grid-cols-3 gap-3 pb-6">
        <button onClick={handleClear} disabled={isConfirmed || gameState !== 'betting'} className="py-3 rounded-lg flex items-center justify-center text-[#f9e498] font-bold text-sm tracking-widest hover:brightness-125 transition-all bg-black/40 border border-[#d4af37]/50 disabled:opacity-50">
          XÓA
        </button>
        <button onClick={handleAllIn} disabled={isConfirmed || gameState !== 'betting'} className="py-3 rounded-lg flex items-center justify-center text-[#f9e498] font-bold text-sm tracking-widest hover:brightness-125 transition-all bg-black/40 border border-[#d4af37]/50 disabled:opacity-50">
          TÁT TAY
        </button>
        <button onClick={handleConfirm} disabled={isConfirmed || gameState !== 'betting' || totalTempBet === 0} className="py-3 rounded-lg flex items-center justify-center text-black font-black text-sm tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.4)] bg-gradient-to-br from-[#996515] via-[#f9e498] to-[#d4af37] disabled:opacity-50">
          XÁC NHẬN
        </button>
      </div>

      {/* Roadmap / Statistics */}
      <div className="mt-auto bg-black/60 p-3 border-t border-[#d4af37]/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#d4af37]/60 font-bold uppercase tracking-widest">Lịch sử kết quả (Roadmap)</span>
          <div className="flex gap-2">
            <span className="text-[8px] text-blue-400">Long: 45%</span>
            <span className="text-[8px] text-red-400">Hổ: 48%</span>
            <span className="text-[8px] text-green-400">Hòa: 7%</span>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-1 overflow-x-auto">
          {history.map((res, i) => (
            <div key={i} className={`aspect-square rounded-full size-4 mx-auto ${res === 'long' ? 'bg-blue-600' : res === 'ho' ? 'bg-red-600' : 'border border-emerald-500'} ${i > 11 ? 'opacity-50' : ''}`}></div>
          ))}
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
              <p className="text-white font-bold mb-2">Kết quả: <span className={missedReceipt.result === 'LONG' ? 'text-blue-500' : missedReceipt.result === 'HỔ' ? 'text-red-500' : 'text-emerald-500'}>{missedReceipt.result}</span></p>
              <p className="text-sm">Số tiền nhận được: <span className={missedReceipt.net.startsWith('+') ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>{missedReceipt.net}</span></p>
            </div>
            <button onClick={() => setMissedReceipt(null)} className="w-full py-3 bg-gradient-to-br from-[#996515] via-[#f9e498] to-[#d4af37] text-black font-black rounded-xl">XÁC NHẬN</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <div className="absolute inset-0 z-[80] bg-black/70 backdrop-blur-[8px] flex items-center justify-center p-4">
          <div className="bg-[#110b08] border border-[#d4af37]/50 rounded-2xl w-full max-w-sm shadow-[0_0_30px_rgba(212,175,55,0.2)] flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-4 border-b border-[#d4af37]/20">
              <h3 className="text-lg font-bold text-[#f9e498]" style={{ fontFamily: '"Playfair Display", serif' }}>
                {showModal === 'settings' ? 'Cài Đặt' : showModal === 'history' ? 'Lịch Sử Cược' : 'Luật Chơi'}
              </h3>
              <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {showModal === 'settings' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Âm thanh</span>
                    <div className="w-10 h-6 bg-emerald-500 rounded-full relative">
                      <div className="absolute right-1 top-1 size-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Rung</span>
                    <div className="w-10 h-6 bg-emerald-500 rounded-full relative">
                      <div className="absolute right-1 top-1 size-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}
              {showModal === 'history' && (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-black/40 p-3 rounded-lg flex justify-between items-center border border-white/5">
                      <div>
                        <p className="text-xs text-slate-400">Ván #{roundId - i}</p>
                        <p className="font-bold text-white">Cược: LONG</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${i === 1 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>{i === 1 ? '+1000' : '-500'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showModal === 'rules' && (
                <div className="space-y-4 text-sm text-slate-300" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  <p>Long Hổ là trò chơi so sánh điểm số giữa hai lá bài được chia cho cửa Long và cửa Hổ.</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><span className="text-blue-400 font-bold">LONG thắng:</span> Tỷ lệ 1:1</li>
                    <li><span className="text-red-400 font-bold">HỔ thắng:</span> Tỷ lệ 1:1</li>
                    <li><span className="text-emerald-400 font-bold">HÒA:</span> Tỷ lệ 1:8 (Hoàn 50% tiền cược Long/Hổ)</li>
                  </ul>
                  <p className="text-xs text-slate-500 mt-4 italic">* K (13 điểm) là lớn nhất, A (1 điểm) là nhỏ nhất.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

