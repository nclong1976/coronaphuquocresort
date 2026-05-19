import React, { useState } from 'react';
import { ArrowLeft, WifiOff } from 'lucide-react';
import { gameApi } from '../api/client';
import { useWallet } from '../context/WalletContext';
import { WalletCard } from '../components/WalletCard';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const CHIPS = [50, 100, 500, 1000, 5000];

export function RouletteApi({ onBack }: { onBack: () => void }) {
  const { balance, isOnline, isSyncing, syncBalance, setBalanceFromGame } = useWallet();
  const [bets, setBets] = useState({ RED: 0, BLACK: 0 });
  const [selectedChip, setSelectedChip] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ number: number; isRed: boolean; winAmount: number } | null>(null);
  const [error, setError] = useState('');

  const totalBet = bets.RED + bets.BLACK;
  const canBet = isOnline && !loading;

  const handleBet = (type: 'RED' | 'BLACK') => {
    if (balance < totalBet + selectedChip || loading) return;
    setBets((prev) => ({ ...prev, [type]: prev[type] + selectedChip }));
  };

  const handleSpin = async () => {
    if (totalBet <= 0 || loading || !isOnline) return;
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await gameApi.roulette(bets);
      setResult({ number: res.number, isRed: res.isRed ?? RED_NUMBERS.includes(res.number), winAmount: res.winAmount });
      setBalanceFromGame(res.balance);
      syncBalance();
      setBets({ RED: 0, BLACK: 0 });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const isRed = result ? result.number > 0 && RED_NUMBERS.includes(result.number) : false;

  return (
    <div className="relative flex h-screen w-full flex-col bg-[#020202] overflow-hidden font-sans text-slate-100 max-w-md mx-auto">
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 to-transparent">
        <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full bg-black/60 text-yellow-500 border border-yellow-500/30">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-sm font-black uppercase">Roulette (Server)</h1>
        <WalletCard balance={balance} isOnline={isOnline} isSyncing={isSyncing} onRefresh={syncBalance} size="sm" className="bg-black/60 border-yellow-500/30" />
      </div>

      <main className="flex-1 flex flex-col overflow-y-auto pt-20">
        {!isOnline && <p className="text-red-500 text-center p-2 flex items-center justify-center gap-2"><WifiOff size={16} /> Mất kết nối. Không thể đặt cược.</p>}
        {error && <p className="text-red-500 text-center p-2">{error}</p>}
        {result && (
          <div className="flex justify-center p-4">
            <div className={`text-6xl font-black px-8 py-4 rounded-2xl ${result.number === 0 ? 'bg-green-600' : isRed ? 'bg-red-600' : 'bg-slate-800'}`}>
              {result.number}
            </div>
          </div>
        )}

        <div className="flex-1 p-4 grid grid-cols-2 gap-4">
          <button onClick={() => handleBet('RED')} disabled={!canBet || balance < totalBet + selectedChip} className="py-8 rounded-xl bg-red-900/40 border-2 border-red-500/50 hover:border-red-400">
            <p className="text-red-300 font-bold">RED</p>
            <p className="text-white text-xl">${bets.RED}</p>
          </button>
          <button onClick={() => handleBet('BLACK')} disabled={!canBet || balance < totalBet + selectedChip} className="py-8 rounded-xl bg-slate-800/40 border-2 border-slate-500/50 hover:border-slate-400">
            <p className="text-slate-300 font-bold">BLACK</p>
            <p className="text-white text-xl">${bets.BLACK}</p>
          </button>
        </div>

        <div className="p-4 flex gap-2">
          {CHIPS.map((c) => (
            <button key={c} onClick={() => setSelectedChip(c)} className={`size-12 rounded-full border-2 ${selectedChip === c ? 'border-yellow-400' : 'border-white/30'}`}>
              ${c >= 1000 ? '1k' : c}
            </button>
          ))}
        </div>
        <button onClick={handleSpin} disabled={totalBet <= 0 || loading || !isOnline} className="m-4 py-4 bg-yellow-600 rounded-xl font-bold disabled:opacity-50">
          SPIN (${totalBet})
        </button>
      </main>
    </div>
  );
}
