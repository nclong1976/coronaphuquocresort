import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGameBalance } from '../hooks/useGameBalance';

export function NiuNiu({ onBack }: { onBack: () => void }) {
  const balance = useGameBalance();
  return (
    <div className="bg-[#050505] font-display text-slate-100 min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden">
      <style>{`
        .gold-gradient {
            background: linear-gradient(135deg, #fff3b0 0%, #d4af37 40%, #aa7c11 60%, #854d0e 100%);
            box-shadow: inset 0 1px 2px rgba(255,255,255,0.9), 0 4px 10px rgba(0,0,0,0.6);
        }
        .gold-glow {
            box-shadow: 0 0 20px rgba(212,175,55,0.6), inset 0 0 15px rgba(212,175,55,0.3);
            border: 1px solid rgba(212, 175, 55, 0.8);
        }
        .glass-panel {
            background: rgba(10, 10, 10, 0.75);
            backdrop-filter: blur(12px);
        }
        .metallic-text {
            background: linear-gradient(to bottom, #fff3b0 0%, #d4af37 50%, #854d0e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .sparkle-overlay {
            background-image: radial-gradient(circle at 50% 50%, rgba(255,243,176,0.15) 0%, transparent 60%);
        }
      `}</style>
      <div className="sticky top-0 z-50 flex items-center bg-black/90 backdrop-blur-md p-4 border-b border-primary/50 justify-between shadow-[0_2px_15px_rgba(212,175,55,0.2)]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="text-primary" />
          </button>
          <h1 className="text-lg font-bold leading-tight tracking-tight uppercase metallic-text">Niu Niu Poker</h1>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase font-bold text-primary/70">Balance</span>
          <p className="text-base font-bold leading-none text-[#fff3b0]">${balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
      </div>
      <main className="flex-1 flex flex-col">
        <div className="relative w-full aspect-video bg-neutral-950 overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] border-b border-primary/40">
          <div className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-luminosity" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAmd0ZTIYS63_banbMkGBXQvGgugKdDW4vpY0jfBISwzxFvGU6oLQK0xinyjkn7OXvcxjhSCHZx3o8C-QeEWeYXGVFe4fXRQYICQ32Dvo998LE74Fqe_HZbgr38DmkB1Nwnco_UBylQjQ5luidg3FCWKhiQkodizGnBJMBJmJWIYr2uRNczkHGCrzxj2vPRgkSdsLcFbxcZiPBWptMe0d7IFkfNm-TyWvUEoi89tAlF3LAf84YktYICoaSWmg7ZO3F4VDMdrxJhAoaQ")' }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80"></div>
          <div className="absolute inset-0 sparkle-overlay pointer-events-none"></div>
          <div className="absolute bottom-4 left-4 w-48 max-h-24 overflow-hidden glass-panel rounded-lg p-2 flex flex-col gap-1 border border-primary/30 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
            <div className="flex gap-2 items-center">
              <span className="text-[10px] font-bold text-primary">System</span>
              <p className="text-[10px] text-white/90">Welcome to Niu Niu Poker!</p>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-[10px] font-bold text-[#fff3b0]">Player77</span>
              <p className="text-[10px] text-white/90">Good luck everyone</p>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 grid grid-cols-2 gap-4 bg-[#141414] relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-screen"></div>
          <div className="col-span-2 glass-panel rounded-xl p-3 gold-glow flex flex-col items-center justify-center gap-2 relative overflow-hidden z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent"></div>
            <span className="text-sm font-bold uppercase tracking-widest text-[#fff3b0] relative z-10 drop-shadow-[0_0_5px_rgba(212,175,55,0.8)]">Banker</span>
            <div className="flex gap-2 relative z-10">
              <div className="w-12 h-16 bg-neutral-900 rounded-md border-2 border-primary/60 flex items-center justify-center overflow-hidden shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                <div className="w-full h-full flex items-center justify-center bg-black/60">
                  <span className="text-primary opacity-60">🂠</span>
                </div>
              </div>
              <div className="w-12 h-16 bg-neutral-900 rounded-md border-2 border-primary/60 flex items-center justify-center overflow-hidden shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                <div className="w-full h-full flex items-center justify-center bg-black/60">
                  <span className="text-primary opacity-60">🂠</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 z-10">
            <div className="flex flex-col glass-panel rounded-xl p-2 gold-glow min-h-[110px] justify-between transition-all cursor-pointer bg-neutral-950/80">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-[#fff3b0] drop-shadow-[0_0_2px_rgba(212,175,55,0.8)]">P1</span>
                <div className="flex gap-1">
                  <span className="px-1.5 py-0.5 rounded-sm bg-black/70 border border-primary/50 text-[8px] font-bold text-[#fff3b0]">EQ 1:1</span>
                  <span className="px-1.5 py-0.5 rounded-sm bg-black/70 border border-primary/50 text-[8px] font-bold text-[#fff3b0]">DB 1:3</span>
                </div>
              </div>
              <div className="flex justify-center -space-x-4 mt-2">
                <div className="w-10 h-14 bg-neutral-900 rounded-md border border-primary/60 shadow-[0_4px_8px_rgba(0,0,0,0.6)] transform -rotate-6 flex items-center justify-center">
                  <span className="text-primary/60">🂠</span>
                </div>
                <div className="w-10 h-14 bg-neutral-900 rounded-md border border-primary/60 shadow-[0_4px_8px_rgba(0,0,0,0.6)] transform rotate-6 flex items-center justify-center">
                  <span className="text-primary/60">🂠</span>
                </div>
              </div>
              <div className="text-center text-[10px] font-bold text-primary mt-2 tracking-widest drop-shadow-[0_0_3px_rgba(212,175,55,0.5)]">PLAYER 1</div>
            </div>
          </div>
          <div className="flex flex-col gap-2 z-10">
            <div className="flex flex-col glass-panel rounded-xl p-2 gold-glow min-h-[110px] justify-between transition-all cursor-pointer bg-neutral-950/80">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-[#fff3b0] drop-shadow-[0_0_2px_rgba(212,175,55,0.8)]">P2</span>
                <div className="flex gap-1">
                  <span className="px-1.5 py-0.5 rounded-sm bg-black/70 border border-primary/50 text-[8px] font-bold text-[#fff3b0]">EQ 1:1</span>
                </div>
              </div>
              <div className="flex justify-center -space-x-4 mt-2">
                <div className="w-10 h-14 bg-neutral-900 rounded-md border border-primary/60 shadow-[0_4px_8px_rgba(0,0,0,0.6)] transform -rotate-6 flex items-center justify-center">
                  <span className="text-primary/60">🂠</span>
                </div>
                <div className="w-10 h-14 bg-neutral-900 rounded-md border border-primary/60 shadow-[0_4px_8px_rgba(0,0,0,0.6)] transform rotate-6 flex items-center justify-center">
                  <span className="text-primary/60">🂠</span>
                </div>
              </div>
              <div className="text-center text-[10px] font-bold text-primary mt-2 tracking-widest drop-shadow-[0_0_3px_rgba(212,175,55,0.5)]">PLAYER 2</div>
            </div>
          </div>
          <div className="col-span-2 flex flex-col glass-panel rounded-xl p-3 gold-glow min-h-[110px] justify-between transition-all cursor-pointer bg-neutral-950/80 z-10">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-[#fff3b0] drop-shadow-[0_0_2px_rgba(212,175,55,0.8)]">P3</span>
              <div className="flex gap-2">
                <button className="px-5 py-1.5 rounded bg-black/70 text-[#fff3b0] text-[10px] font-bold border border-primary/60 hover:bg-primary/30 transition-colors shadow-[0_0_5px_rgba(212,175,55,0.3)]">EQUAL</button>
                <button className="px-5 py-1.5 rounded bg-black/70 text-[#fff3b0] text-[10px] font-bold border border-primary/60 hover:bg-primary/30 transition-colors shadow-[0_0_5px_rgba(212,175,55,0.3)]">DOUBLE</button>
              </div>
            </div>
            <div className="flex justify-center -space-x-4 mt-2">
              <div className="w-10 h-14 bg-neutral-900 rounded-md border border-primary/60 shadow-[0_4px_8px_rgba(0,0,0,0.6)] transform -rotate-12 flex items-center justify-center">
                <span className="text-primary/60">🂠</span>
              </div>
              <div className="w-10 h-14 bg-neutral-900 rounded-md border border-primary/60 shadow-[0_4px_12px_rgba(0,0,0,0.8)] flex items-center justify-center z-10">
                <span className="text-primary/60">🂠</span>
              </div>
              <div className="w-10 h-14 bg-neutral-900 rounded-md border border-primary/60 shadow-[0_4px_8px_rgba(0,0,0,0.6)] transform rotate-12 flex items-center justify-center">
                <span className="text-primary/60">🂠</span>
              </div>
            </div>
            <div className="text-center text-[10px] font-bold text-primary mt-2 tracking-widest drop-shadow-[0_0_3px_rgba(212,175,55,0.5)]">PLAYER 3</div>
          </div>
        </div>
        <div className="mt-auto p-4 bg-black border-t border-primary/40 shadow-[0_-10px_30px_rgba(212,175,55,0.15)] z-20">
          <div className="flex items-center justify-center mb-5 overflow-x-auto gap-3 pb-2">
            <button className="gold-gradient text-[#050505] text-[10px] font-black w-12 h-12 shrink-0 rounded-full border border-white/40 shadow-[0_0_15px_rgba(212,175,55,0.6)] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-1 border border-black/30 rounded-full border-dashed"></div>
              ALL IN
            </button>
            <div className="flex gap-3">
              <button className="gold-gradient text-[#050505] text-[11px] font-black w-12 h-12 rounded-full border border-white/40 shadow-[0_0_15px_rgba(212,175,55,0.6)] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-1 border border-black/30 rounded-full border-dashed"></div>
                $50
              </button>
              <button className="gold-gradient text-[#050505] text-[11px] font-black w-12 h-12 rounded-full border border-white/40 shadow-[0_0_15px_rgba(212,175,55,0.6)] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-1 border border-black/30 rounded-full border-dashed"></div>
                $100
              </button>
              <button className="gold-gradient text-[#050505] text-[11px] font-black w-12 h-12 rounded-full border border-white/40 shadow-[0_0_15px_rgba(212,175,55,0.6)] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-1 border border-black/30 rounded-full border-dashed"></div>
                $500
              </button>
              <button className="gold-gradient text-[#050505] text-[11px] font-black w-12 h-12 rounded-full border border-white/40 shadow-[0_0_15px_rgba(212,175,55,0.6)] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-1 border border-black/30 rounded-full border-dashed"></div>
                $1k
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button className="py-3 rounded-lg bg-neutral-900 border border-primary/40 text-primary hover:bg-neutral-800 transition-colors text-xs font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(212,175,55,0.1)]">Clear</button>
            <div className="flex flex-col bg-black border border-primary/50 rounded-lg justify-center items-center px-2 shadow-[inset_0_0_15px_rgba(212,175,55,0.15)]">
              <span className="text-[8px] text-primary/80 uppercase font-bold tracking-wider">Bet Amount</span>
              <span className="text-sm font-bold text-[#fff3b0] drop-shadow-[0_0_2px_rgba(212,175,55,0.8)]">$100.00</span>
            </div>
            <button className="py-3 rounded-lg gold-gradient text-[#050505] text-sm font-black tracking-widest uppercase shadow-[0_0_25px_rgba(212,175,55,0.7)] border border-white/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
              Confirm
            </button>
          </div>
        </div>
        <div className="p-3 bg-black border-t border-primary/30 z-20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest drop-shadow-[0_0_2px_rgba(212,175,55,0.5)]">Roadmap / Stats</span>
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] border border-blue-300"></div>
                <span className="text-[10px] text-slate-300 font-medium">P: 42</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] border border-red-300"></div>
                <span className="text-[10px] text-slate-300 font-medium">B: 38</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-1 overflow-hidden">
            <div className="aspect-square bg-neutral-900/50 border border-primary/20 rounded-sm flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="size-3 rounded-full border-2 border-blue-500"></div>
            </div>
            <div className="aspect-square bg-neutral-900/50 border border-primary/20 rounded-sm flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="size-3 rounded-full border-2 border-red-500"></div>
            </div>
            <div className="aspect-square bg-neutral-900/50 border border-primary/20 rounded-sm flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="size-3 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.6)]"></div>
            </div>
            <div className="aspect-square bg-neutral-900/50 border border-primary/20 rounded-sm flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="size-3 rounded-full border-2 border-red-500"></div>
            </div>
            <div className="aspect-square bg-neutral-900/50 border border-primary/20 rounded-sm flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="size-3 rounded-full border-2 border-blue-500"></div>
            </div>
            <div className="aspect-square bg-neutral-900/50 border border-primary/20 rounded-sm flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="size-3 rounded-full border-2 border-blue-500"></div>
            </div>
            <div className="aspect-square bg-neutral-900/50 border border-primary/20 rounded-sm flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="size-3 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]"></div>
            </div>
            <div className="aspect-square bg-neutral-900/50 border border-primary/20 rounded-sm flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="size-3 rounded-full border-2 border-red-500"></div>
            </div>
            <div className="aspect-square bg-neutral-900/50 border border-primary/20 rounded-sm flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="size-3 rounded-full border-2 border-blue-500"></div>
            </div>
            <div className="aspect-square bg-neutral-900/50 border border-primary/20 rounded-sm flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="size-3 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.6)]"></div>
            </div>
            <div className="aspect-square bg-neutral-900/50 border border-primary/20 rounded-sm flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="size-3 rounded-full border-2 border-red-500"></div>
            </div>
            <div className="aspect-square bg-neutral-900/50 border border-primary/20 rounded-sm flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="size-3 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.6)]"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
