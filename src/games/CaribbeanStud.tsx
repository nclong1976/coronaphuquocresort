import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGameBalance } from '../hooks/useGameBalance';

export function CaribbeanStud({ onBack }: { onBack: () => void }) {
  const balance = useGameBalance();
  return (
    <div className="bg-black font-display text-white min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden">
      <style>{`
        .gold-glitter {
            background: linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C);
        }
        .gold-glitter-dark {
            background: linear-gradient(135deg, #8A6D2B, #D4AF37, #59430D, #AA8C2C);
        }
        .shadow-gold-glow {
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.6), 0 0 30px rgba(184, 134, 11, 0.4);
        }
        .shadow-gold-glow-intense {
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.5);
        }
        .shadow-gold-border {
            box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
        }
      `}</style>
      <div className="flex items-center bg-black/90 backdrop-blur-md p-4 sticky top-0 z-50 justify-between border-b border-primary shadow-gold-glow">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center justify-center p-2 rounded-full hover:bg-yellow-900/50 transition-colors">
            <ArrowLeft className="text-yellow-300" />
          </button>
          <h2 className="text-lg font-bold leading-tight tracking-tight bg-clip-text text-transparent gold-glitter drop-shadow-md">Caribbean Stud Poker</h2>
        </div>
        <div className="flex items-center gap-2 bg-black/80 px-4 py-1.5 rounded-full border border-primary shadow-gold-border">
          <p className="bg-clip-text text-transparent gold-glitter text-sm font-bold">${balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
      </div>
      <div className="relative w-full aspect-video bg-black overflow-hidden border-b-2 border-primary shadow-gold-glow">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDwMX9mMs8NnQu2h1u0lHbfZsf0pZ3y4vIas3KocNRIITP6G59oWyPGu4ZbH4puNSqx8QEOnz6JHBe7jscIJzRf3jxXdZ4sHfR__E9RHNhf6MYsRwGVnEcObZF5FHi7l8VwHOKMtvEtTOC2XKQs6EfXOrgV1BWzBk4dgjHEmuslSOQ1X4UAOBnFC32BGKKBYoafP6Un1ZY7a7ONnuOQZNQYvFkhj30-gk8Hwkqcj7y8TrMXLMrr-vSLGgevrUOtEQbTiv1Q-mk80DQY')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20"></div>
          <div className="absolute inset-0 bg-yellow-500/20 mix-blend-overlay"></div>
        </div>
        <div className="absolute bottom-4 left-4 w-1/2 max-w-[200px]">
          <div className="bg-black/70 backdrop-blur-md rounded-lg p-2 text-[10px] border border-primary/50 shadow-gold-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-primary">Dealer:</span>
              <span className="text-yellow-200">Place your bets!</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-yellow-400">Player77:</span>
              <span className="text-yellow-200">Good luck all</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4 gap-6 bg-black flex-1">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary drop-shadow-[0_0_5px_rgba(212,175,55,0.8)]">Dealer Hand</span>
          <div className="flex gap-2">
            <div className="w-12 h-16 bg-white rounded border-2 border-primary flex flex-col items-center justify-between p-1 shadow-gold-glow">
              <div className="text-black font-bold text-xs self-start">A♠</div>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-black text-xl">♠</span>
              </div>
              <div className="text-black font-bold text-xs self-end rotate-180">A♠</div>
            </div>
            <div className="w-12 h-16 gold-glitter rounded border-2 border-white/50 shadow-gold-glow flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
            </div>
            <div className="w-12 h-16 gold-glitter rounded border-2 border-white/50 shadow-gold-glow flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
            </div>
            <div className="w-12 h-16 gold-glitter rounded border-2 border-white/50 shadow-gold-glow flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
            </div>
            <div className="w-12 h-16 gold-glitter rounded border-2 border-white/50 shadow-gold-glow flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <button className="gold-glitter px-8 py-3 rounded-full shadow-gold-glow-intense border-2 border-white flex items-center gap-3 transform hover:scale-105 transition-transform relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full duration-1000"></div>
            <span className="text-black font-black text-sm uppercase tracking-widest drop-shadow-sm">Jackpot $1.2M</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-dashed border-primary bg-black/60 shadow-gold-glow">
            <span className="text-[10px] font-bold uppercase text-primary drop-shadow-[0_0_5px_rgba(212,175,55,0.8)]">Ante</span>
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center gold-glitter shadow-gold-glow-intense">
              <span className="text-xs font-black text-black drop-shadow-sm">$100</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-dashed border-primary/50 bg-black/60 shadow-gold-border">
            <span className="text-[10px] font-bold uppercase text-primary/70">Call</span>
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center bg-transparent">
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-2 opacity-80 mt-auto">
          <div className="w-10 h-14 border-2 border-dashed border-primary rounded bg-black/40 shadow-gold-border"></div>
          <div className="w-10 h-14 border-2 border-dashed border-primary rounded bg-black/40 shadow-gold-border"></div>
          <div className="w-10 h-14 border-2 border-dashed border-primary rounded bg-black/40 shadow-gold-border"></div>
          <div className="w-10 h-14 border-2 border-dashed border-primary rounded bg-black/40 shadow-gold-border"></div>
          <div className="w-10 h-14 border-2 border-dashed border-primary rounded bg-black/40 shadow-gold-border"></div>
        </div>
      </div>
      <div className="bg-black p-4 border-t-2 border-primary shadow-[0_-5px_20px_rgba(212,175,55,0.3)] space-y-6">
        <div className="flex justify-between items-center px-1">
          <button className="w-11 h-11 rounded-full gold-glitter border-2 border-white flex items-center justify-center shadow-gold-glow transform hover:scale-110 transition-transform">
            <span className="text-[10px] font-black text-black drop-shadow-sm">$50</span>
          </button>
          <button className="w-11 h-11 rounded-full gold-glitter border-2 border-white flex items-center justify-center shadow-gold-glow transform hover:scale-110 transition-transform">
            <span className="text-[10px] font-black text-black drop-shadow-sm">$100</span>
          </button>
          <button className="w-11 h-11 rounded-full gold-glitter border-2 border-white flex items-center justify-center shadow-gold-glow transform hover:scale-110 transition-transform">
            <span className="text-[10px] font-black text-black drop-shadow-sm">$500</span>
          </button>
          <button className="w-11 h-11 rounded-full gold-glitter border-2 border-white flex items-center justify-center shadow-gold-glow transform hover:scale-110 transition-transform">
            <span className="text-[10px] font-black text-black drop-shadow-sm">$1K</span>
          </button>
          <button className="h-11 px-5 rounded-full gold-glitter border-2 border-white flex items-center justify-center shadow-gold-glow-intense transform hover:scale-105 transition-transform">
            <span className="text-[11px] font-black text-black uppercase tracking-widest drop-shadow-sm">All In</span>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <button className="gold-glitter text-black font-black py-4 rounded-xl text-xs uppercase shadow-gold-glow border border-white tracking-widest hover:brightness-110 transition-all">Ante</button>
          <button className="gold-glitter-dark text-white font-black py-4 rounded-xl text-xs uppercase shadow-gold-border border border-primary tracking-widest hover:brightness-110 transition-all">Call</button>
          <button className="gold-glitter-dark text-white font-black py-4 rounded-xl text-xs uppercase shadow-gold-border border border-primary tracking-widest hover:brightness-110 transition-all">Fold</button>
          <button className="gold-glitter-dark text-white font-black py-4 rounded-xl text-xs uppercase shadow-gold-border border border-primary tracking-widest hover:brightness-110 transition-all">Clear</button>
        </div>
      </div>
    </div>
  );
}
