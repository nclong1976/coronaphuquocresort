import React from 'react';
import { ArrowLeft, Menu, History } from 'lucide-react';
import { useGameBalance } from '../hooks/useGameBalance';

export function RussianPoker({ onBack }: { onBack: () => void }) {
  const balance = useGameBalance();
  return (
    <div className="bg-[#0a0805] font-display text-slate-100 antialiased overflow-hidden h-screen flex flex-col max-w-md mx-auto relative">
      <style>{`
        .gold-gradient {
            background: linear-gradient(145deg, #FCF6BA 0%, #B38728 100%);
        }
        .poker-table-gradient {
            background: radial-gradient(circle at center, #2b2311 0%, #0a0805 100%);
        }
        .glass-panel {
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 215, 0, 0.4);
        }
        .gold-text {
            background: linear-gradient(to right, #FCF6BA, #BF953F, #FCF6BA);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .gold-border {
            border-color: #FFD700;
        }
        .gold-bg {
            background: linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C);
            background-size: 200% 200%;
        }
        .glitter-overlay {
            position: absolute;
            inset: 0;
            background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" opacity="0.15" mix-blend-mode="screen"/%3E%3C/svg%3E');
            pointer-events: none;
            border-radius: inherit;
        }
        .chip-gold {
            background: radial-gradient(circle at center, #FCF6BA 0%, #B38728 70%, #8A5A19 100%);
            border: 2px solid #FFF8D6;
            box-shadow: 0 4px 8px rgba(0,0,0,0.5), inset 0 0 10px rgba(255,255,255,0.5);
        }
        .chip-dashed-border {
            border: 3px dashed rgba(255, 255, 255, 0.4);
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .text-shadow {
            text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }
      `}</style>

      {/* Header */}
      <header className="flex items-center px-4 py-3 justify-between bg-black/80 border-b border-[#FFD700]/40 shadow-[0_4px_20px_rgba(255,215,0,0.15)] relative z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#FFD700]">
            <ArrowLeft />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase gold-text">Xì Tố Nga</h1>
            <p className="text-[10px] opacity-90 uppercase tracking-widest text-[#FFD700]/90 font-medium">Table #082 • $5 - $500</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-black to-zinc-900 border border-[#FFD700]/60 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_10px_rgba(255,215,0,0.2)]">
            <span className="material-symbols-outlined text-[#FFD700] text-sm">payments</span>
            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FCF6BA] to-[#B38728]">${balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-full text-[#FFD700]">
            <Menu size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Live Dealer Section */}
        <div className="relative w-full aspect-[16/9] bg-black overflow-hidden shadow-2xl border-b border-[#FFD700]/30">
          <div className="absolute inset-0 bg-cover bg-center opacity-90" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAZsuo_dfcSJAagV4FuLOzHpOGsIvTqEiElT7waKrl9rp_vsViULrDSz7IgMP7j-2ixLi1UhakpjuV_dk_W1errvzdP5G-EuUroWGV8fOMOPOvPjgav13iOMa2Sf47iw1RNL2906KSCX2Sk1G5RgzPJAs8gHbyPNRV9sIi74a3yfjwNXIeOZGwJ1kaBMh2eJKGaXYmtfIOK-vVGQf5ql7jpfw_2A6bUDaGV-YzIgx9RfQX5EgFCl5Q_3IxKy10AIj0gH6Ex-chSoWhp')" }}>
          </div>
          
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-600/90 rounded text-[10px] font-bold text-white uppercase shadow-[0_0_10px_rgba(220,38,38,0.6)] border border-red-400/80">
            <span className="w-2 h-2 bg-white rounded-full shadow-[0_0_5px_#fff] animate-pulse"></span>
            Live
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-24 glass-panel flex flex-col-reverse p-3 gap-1 overflow-hidden pointer-events-none">
            <div className="flex items-center gap-2 opacity-90">
              <span className="text-[10px] font-bold text-[#FFD700]">System:</span>
              <span className="text-[10px] text-white">Please place your bets...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-blue-300">Alex:</span>
              <span className="text-[10px] text-white/90">Good luck everyone! Let's win big.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-green-300">Dealer:</span>
              <span className="text-[10px] text-white/90">Welcome to the table, high rollers.</span>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 poker-table-gradient relative border-t-2 border-[#FFD700]/50 shadow-[inset_0_15px_40px_rgba(0,0,0,0.8)]">
          <div className="absolute inset-0 flex flex-col items-center justify-around py-4 z-10">
            <div className="flex gap-8">
              <div className="w-24 h-24 border-[3px] border-[#FFD700]/60 rounded-xl flex flex-col items-center justify-center relative bg-black/50 shadow-[0_0_20px_rgba(255,215,0,0.25),inset_0_0_15px_rgba(255,215,0,0.1)] backdrop-blur-sm">
                <span className="text-xs font-bold text-[#FFD700] uppercase tracking-widest text-shadow">Ante</span>
                <div className="absolute -bottom-3 -right-3 gold-bg text-black text-[11px] px-2 py-1 rounded-md font-extrabold shadow-[0_4px_15px_rgba(255,215,0,0.6)] border border-[#FFF8D6] z-20">
                  <div className="glitter-overlay"></div>
                  $10
                </div>
              </div>
              <div className="w-24 h-24 border-[3px] border-[#FFD700]/60 rounded-full flex flex-col items-center justify-center relative bg-black/50 shadow-[0_0_20px_rgba(255,215,0,0.25),inset_0_0_15px_rgba(255,215,0,0.1)] backdrop-blur-sm">
                <span className="text-xs font-bold text-[#FFD700] uppercase tracking-widest text-shadow">Bonus</span>
              </div>
            </div>
            
            <div className="w-full px-6 flex justify-between items-end pb-4">
              <button className="relative gold-bg hover:brightness-110 text-[#2b2311] font-extrabold py-3.5 px-8 rounded-xl shadow-[0_6px_0_0_#8A5A19,0_10px_20px_rgba(0,0,0,0.5)] active:translate-y-1.5 active:shadow-[0_0px_0_0_#8A5A19,0_0px_0px_rgba(0,0,0,0.5)] transition-all uppercase text-sm border-2 border-[#FFF8D6] overflow-hidden">
                <div className="glitter-overlay"></div>
                <span className="relative z-10 tracking-wider">Deal Cards</span>
              </button>
              <button className="bg-black/80 border-2 border-[#FFD700]/80 hover:bg-black text-[#FFD700] font-bold py-3.5 px-8 rounded-xl transition-all uppercase text-sm shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                All In
              </button>
            </div>
          </div>
        </div>

        {/* Controls Area */}
        <div className="bg-gradient-to-b from-black/95 to-zinc-950 p-5 border-t border-[#FFD700]/40 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] relative z-20">
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFD700]/10 to-transparent pointer-events-none"></div>
          <div className="flex justify-between items-center max-w-md mx-auto gap-3 relative z-10">
            <button className="flex flex-col items-center gap-1 group">
              <div className="size-14 rounded-full chip-gold flex items-center justify-center group-active:scale-95 transition-transform relative overflow-hidden">
                <div className="absolute inset-1 rounded-full chip-dashed-border"></div>
                <div className="glitter-overlay"></div>
                <span className="text-sm font-black text-[#2b2311] relative z-10 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">$5</span>
              </div>
            </button>
            <button className="flex flex-col items-center gap-1 group">
              <div className="size-16 rounded-full chip-gold flex items-center justify-center group-active:scale-95 transition-transform ring-4 ring-[#FFD700]/40 ring-offset-2 ring-offset-black relative overflow-hidden shadow-[0_0_20px_rgba(255,215,0,0.5)]">
                <div className="absolute inset-1.5 rounded-full chip-dashed-border"></div>
                <div className="glitter-overlay"></div>
                <span className="text-base font-black text-[#2b2311] relative z-10 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">$25</span>
              </div>
            </button>
            <button className="flex flex-col items-center gap-1 group">
              <div className="size-14 rounded-full chip-gold flex items-center justify-center group-active:scale-95 transition-transform relative overflow-hidden">
                <div className="absolute inset-1 rounded-full chip-dashed-border"></div>
                <div className="glitter-overlay"></div>
                <span className="text-sm font-black text-[#2b2311] relative z-10 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">$100</span>
              </div>
            </button>
            <button className="flex flex-col items-center gap-1 group">
              <div className="size-14 rounded-full chip-gold flex items-center justify-center group-active:scale-95 transition-transform relative overflow-hidden">
                <div className="absolute inset-1 rounded-full chip-dashed-border"></div>
                <div className="glitter-overlay"></div>
                <span className="text-sm font-black text-[#2b2311] relative z-10 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">$500</span>
              </div>
            </button>
            
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-[#FFD700]/50 to-transparent mx-2"></div>
            
            <button className="p-3.5 bg-black rounded-full shadow-[0_0_10px_rgba(255,215,0,0.2)] hover:bg-zinc-900 active:scale-90 transition-all border border-[#FFD700]/50 text-[#FFD700]">
              <History size={20} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
