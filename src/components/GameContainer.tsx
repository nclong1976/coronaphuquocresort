import React from 'react';
import { ArrowLeft, Info, Wallet, History, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { AnimatedBalance } from './AnimatedBalance';

interface GameContainerProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  children: React.ReactNode;
  timeLeft: string;
  gameState: string;
  history: any[];
  bgColor?: string;
  accentColor?: string;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  title,
  subtitle = "Luxury Gold Edition",
  onBack,
  children,
  timeLeft,
  gameState,
  history,
  bgColor = "#0b1315",
  accentColor = "#d4af37"
}) => {
  const { token } = useAuth();
  const { balance: walletBalance } = useWallet();
  const storeUser = useStore(state => state.user);
  const balance = token ? walletBalance : storeUser.balance;

  return (
    <div className={`relative flex h-screen w-full flex-col overflow-hidden font-sans text-slate-100 no-scrollbar max-w-md mx-auto shadow-2xl`} style={{ backgroundColor: bgColor }}>
      <style>{`
        .gold-gradient-text {
          background: linear-gradient(to bottom, #f9e5a2 0%, #d4af37 50%, #996515 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full bg-black/40 text-white border border-white/10 backdrop-blur-md hover:bg-black/60 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-white text-sm font-bold leading-tight uppercase tracking-wider">{title}</h1>
            <div className="flex items-center gap-1.5">
              <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-white/60 tracking-widest uppercase">{subtitle}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
            <Wallet size={14} className="text-yellow-500" />
            <span className="text-yellow-500 font-bold text-sm tabular-nums">$<AnimatedBalance balance={balance} /></span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {children}
        
        {/* Timer Overlay */}
        <div className="absolute top-20 right-4 bg-black/60 backdrop-blur-md rounded-xl border border-yellow-500/30 p-2 flex flex-col items-center min-w-[60px]">
          <span className="text-[8px] font-bold text-yellow-500/80 tracking-widest mb-0.5 uppercase">
            {gameState === 'betting' ? 'Đặt cược' : gameState === 'revealing' ? 'Đang lật' : 'Ván mới'}
          </span>
          <span className={`text-xl font-black font-mono tracking-tighter ${gameState === 'betting' && parseInt(timeLeft.split(':')[1]) < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timeLeft}
          </span>
        </div>

        {/* Floating Controls */}
        <div className="absolute bottom-24 right-4 flex flex-col gap-2">
          <button className="size-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white backdrop-blur-md">
            <History size={20} />
          </button>
          <button className="size-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white backdrop-blur-md">
            <MessageCircle size={20} />
          </button>
        </div>
      </div>

      {/* History Bar */}
      <div className="bg-black/40 px-4 py-2 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
        {history.map((res, i) => (
          <div 
            key={i} 
            className={`shrink-0 size-6 rounded-full flex items-center justify-center text-[10px] font-black border border-white/10 shadow-lg
              ${res === 'PLAYER' || res === 'BIG' || res === 'LONG' ? 'bg-blue-600 text-white' : 
                res === 'BANKER' || res === 'SMALL' || res === 'HO' ? 'bg-red-600 text-white' : 
                'bg-green-600 text-white'}`}
          >
            {res[0]}
          </div>
        ))}
        {history.length === 0 && <span className="text-[10px] text-slate-500 uppercase tracking-widest py-1">Chưa có kết quả</span>}
      </div>
    </div>
  );
};
