import React from 'react';
import { ArrowLeft, Settings, Wallet } from 'lucide-react';
import { useGameBalance } from '../hooks/useGameBalance';

export function TexasHoldem({ onBack }: { onBack: () => void }) {
  const balance = useGameBalance();
  return (
    <div className="relative flex h-screen w-full flex-col bg-[#020202] overflow-hidden font-sans text-slate-100 no-scrollbar max-w-md mx-auto shadow-2xl">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-[2px]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full bg-black/60 text-yellow-500 border border-yellow-500/30 backdrop-blur-md active:scale-90 transition-all">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-white text-sm font-black uppercase tracking-widest leading-tight">Corona Poker</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 w-fit">
              <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[9px] font-black text-red-500 tracking-widest uppercase">LIVE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full border border-yellow-500/30 shadow-2xl">
            <Wallet size={16} className="text-yellow-500" />
            <span className="text-yellow-500 font-black text-sm tracking-wider">${balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
        {/* Live Dealer Section */}
        <div className="relative w-full aspect-video overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1511193311914-0346f16efe90?q=80&w=2073&auto=format&fit=crop" 
            alt="Dealer" 
            className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-black/40"></div>
          
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <div className="size-10 rounded-full border-2 border-yellow-500/50 overflow-hidden shadow-2xl">
              <img src="https://i.pravatar.cc/100?u=sarah" alt="Dealer" className="w-full h-full object-cover" />
            </div>
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-2xl">
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Dealer Sarah</p>
              <p className="text-[9px] text-white/60">Welcome to the high stakes table.</p>
            </div>
          </div>
        </div>

        {/* Poker Table */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#020202_100%)]">
          <div className="w-full aspect-[2/1] relative p-1 rounded-[100px] luxury-border shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="w-full h-full relative rounded-[96px] flex flex-col items-center justify-center overflow-hidden bg-emerald-950/40 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
                <p className="text-6xl font-black rotate-[-15deg] uppercase text-white">Corona Casino</p>
              </div>
              
              {/* Community Cards */}
              <div className="flex gap-2 z-10 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-12 h-16 bg-[#0a0a0a] rounded-lg border border-yellow-500/20 flex flex-col items-center justify-center shadow-2xl overflow-hidden relative">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://casinocorona.vn/wp-content/uploads/2023/10/logo-corona-casino-phu-quoc.png')] bg-center bg-no-repeat bg-[length:80%]"></div>
                    <div className="text-yellow-500/20 font-black text-[8px] text-center uppercase tracking-tighter z-10">Corona<br/>Casino</div>
                  </div>
                ))}
              </div>
              
              {/* Pot */}
              <div className="absolute bottom-6 px-6 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-yellow-500/30 shadow-2xl">
                <span className="text-[10px] text-yellow-500 uppercase tracking-[0.2em] font-black">Main Pot: $1,250</span>
              </div>
            </div>
          </div>

          {/* Player Hand */}
          <div className="mt-10 flex flex-col items-center">
            <div className="flex gap-2">
              <div className="w-14 h-20 bg-white rounded-xl shadow-2xl flex flex-col items-center justify-between p-2 border-2 border-yellow-500/30 transform -rotate-6">
                <span className="text-black text-sm font-black self-start">A</span>
                <span className="text-red-600 text-2xl">♥</span>
                <span className="text-black text-sm font-black self-end rotate-180">A</span>
              </div>
              <div className="w-14 h-20 bg-white rounded-xl shadow-2xl flex flex-col items-center justify-between p-2 border-2 border-yellow-500/30 transform rotate-6">
                <span className="text-black text-sm font-black self-start">K</span>
                <span className="text-black text-2xl">♠</span>
                <span className="text-black text-sm font-black self-end rotate-180">K</span>
              </div>
            </div>
            <p className="text-[10px] text-yellow-500 mt-4 font-black tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">Your Hand</p>
          </div>
        </div>
      </main>

      {/* Controls Area */}
      <div className="bg-[#050505] border-t border-white/10 p-5 pt-3 space-y-5 backdrop-blur-xl">
        <div className="flex justify-between items-center gap-3 overflow-x-auto py-1 no-scrollbar">
          {[50, 100, 500, '1K', '5K'].map((val, i) => (
            <button 
              key={i} 
              className={`flex-shrink-0 size-12 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center shadow-2xl transform active:scale-90 transition-all hover:-translate-y-1 ${val === '1K' ? 'metallic-gold' : 'bg-black/60'}`}
            >
              <span className={`font-black text-[10px] ${val === '1K' ? 'text-black' : 'text-white'}`}>{typeof val === 'string' ? val : `$${val}`}</span>
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <button className="bg-white/5 border border-white/10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 active:bg-white/10">FOLD</button>
          <button className="bg-white/5 border border-white/10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 active:bg-white/10">CHECK</button>
          <button className="metallic-gold text-black font-black py-4 rounded-xl text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all active:scale-95 hover:brightness-110">RAISE</button>
        </div>
      </div>
    </div>
  );
}
