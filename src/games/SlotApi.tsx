import React, { useState } from 'react';
import { ArrowLeft, Crown, Diamond, Star, Coins, WifiOff } from 'lucide-react';
import { gameApi } from '../api/client';
import { useWallet } from '../context/WalletContext';
import { WalletCard } from '../components/WalletCard';

const SYMBOLS = [
  { icon: <Crown className="text-yellow-500" size={40} />, label: 'Crown', value: 100 },
  { icon: <Diamond className="text-blue-400" size={40} />, label: 'Diamond', value: 50 },
  { icon: <Star className="text-amber-400" size={40} />, label: 'Star', value: 25 },
  { icon: <Coins className="text-yellow-600" size={40} />, label: 'Coins', value: 10 },
];

export function SlotApi({ onBack }: { onBack: () => void }) {
  const { balance, isOnline, isSyncing, syncBalance, setBalanceFromGame } = useWallet();
  const [bet, setBet] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ symbols: number[]; winAmount: number } | null>(null);
  const [error, setError] = useState('');

  const canBet = isOnline && !loading;

  const spin = async () => {
    if (!canBet || balance < bet) return;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await gameApi.slot(bet);
      setResult({ symbols: res.symbols, winAmount: res.winAmount });
      setBalanceFromGame(res.balance);
      syncBalance();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const symbolIndexToItem = (i: number) => SYMBOLS[Math.min(i, SYMBOLS.length - 1)];

  return (
    <div className="relative flex h-screen w-full flex-col bg-[#020202] overflow-hidden font-sans text-slate-100 max-w-md mx-auto">
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 to-transparent">
        <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full bg-black/60 text-yellow-500 border border-yellow-500/30">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-sm font-black uppercase">Slots (Server)</h1>
        <WalletCard balance={balance} isOnline={isOnline} isSyncing={isSyncing} onRefresh={syncBalance} size="sm" className="bg-black/60 border-yellow-500/30" />
      </div>

      <main className="flex-1 flex flex-col overflow-y-auto pt-20">
        {!isOnline && <p className="text-red-500 text-center p-2 flex items-center justify-center gap-2"><WifiOff size={16} /> Mất kết nối. Không thể quay.</p>}
        {error && <p className="text-red-500 text-center p-2">{error}</p>}
        <div className="p-4">
          <div className="grid grid-cols-3 gap-1 p-2 bg-slate-900 rounded-xl">
            {(result?.symbols ?? Array(9).fill(0)).map((idx, i) => (
              <div key={i} className="aspect-square bg-slate-800 rounded flex items-center justify-center">
                {symbolIndexToItem(idx).icon}
              </div>
            ))}
          </div>
          {result && result.winAmount > 0 && (
            <p className="text-center text-green-500 font-bold mt-2">+${result.winAmount.toLocaleString()}</p>
          )}
        </div>

        <div className="mt-auto p-4 flex gap-2">
          {[50, 100, 500, 1000].map((c) => (
            <button key={c} onClick={() => setBet(c)} className={`px-4 py-2 rounded-lg ${bet === c ? 'bg-yellow-600' : 'bg-slate-700'}`}>
              ${c}
            </button>
          ))}
        </div>
        <button onClick={spin} disabled={!canBet || balance < bet} className="m-4 py-4 bg-yellow-600 rounded-xl font-bold disabled:opacity-50">
          SPIN ${bet}
        </button>
      </main>
    </div>
  );
}
