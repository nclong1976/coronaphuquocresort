import React, { useState } from 'react';
import { ArrowLeft, Wallet } from 'lucide-react';
import { useGameBalance } from '../hooks/useGameBalance';
import { useBalanceUpdate } from '../hooks/useBalanceUpdate';
import { getRandomCard } from '../utils/gameUtils';
import { PlayingCard } from '../components/PlayingCard';
import type { CardData } from '../components/PlayingCard';

const CHIPS = [50, 100, 500, 1000, 5000];

function blackjackScore(cards: CardData[]): number {
  let sum = cards.reduce((a, c) => a + c.value, 0);
  const aces = cards.filter((c) => c.rank === 'A').length;
  for (let i = 0; i < aces && sum + 10 <= 21; i++) sum += 10;
  return sum;
}

export function XiDach({ onBack }: { onBack: () => void }) {
  const updateBalance = useBalanceUpdate();
  const balance = useGameBalance();

  const [bet, setBet] = useState(0);
  const [selectedChip, setSelectedChip] = useState(100);
  const [playerCards, setPlayerCards] = useState<CardData[]>([]);
  const [dealerCards, setDealerCards] = useState<CardData[]>([]);
  const [gameState, setGameState] = useState<'bet' | 'play' | 'result'>('bet');
  const [result, setResult] = useState<'win' | 'lose' | 'push' | null>(null);

  const playerScore = playerCards.length ? blackjackScore(playerCards) : 0;
  const dealerScore = dealerCards.length ? blackjackScore(dealerCards) : 0;

  const handlePlaceBet = () => {
    if (balance < selectedChip || gameState !== 'bet') return;
    setBet(selectedChip);
    updateBalance(-selectedChip);
    const p1 = getRandomCard();
    const p2 = getRandomCard();
    const d1 = getRandomCard();
    const d2 = getRandomCard();
    setPlayerCards([p1, p2]);
    setDealerCards([d1, d2]);
    setGameState('play');
    setResult(null);
  };

  const resolveGame = (finalPlayerCards: CardData[]) => {
    let dealer = [...dealerCards];
    while (blackjackScore(dealer) < 17) {
      dealer.push(getRandomCard());
    }
    setDealerCards(dealer);

    const pScore = blackjackScore(finalPlayerCards);
    const dScore = blackjackScore(dealer);

    let res: 'win' | 'lose' | 'push' = 'lose';
    if (pScore > 21) res = 'lose';
    else if (dScore > 21) res = 'win';
    else if (pScore > dScore) res = 'win';
    else if (pScore < dScore) res = 'lose';
    else res = 'push';

    setResult(res);
    setGameState('result');

    if (res === 'win') updateBalance(bet * 2);
    else if (res === 'push') updateBalance(bet);
  };

  const handleHit = () => {
    if (gameState !== 'play' || playerScore >= 21) return;
    const newCard = getRandomCard();
    const newPlayerCards = [...playerCards, newCard];
    setPlayerCards(newPlayerCards);
    if (blackjackScore(newPlayerCards) >= 21) {
      resolveGame(newPlayerCards);
    }
  };

  const handleStand = () => {
    if (gameState !== 'play') return;
    resolveGame(playerCards);
  };

  const handleNewGame = () => {
    setBet(0);
    setPlayerCards([]);
    setDealerCards([]);
    setGameState('bet');
    setResult(null);
  };

  const canHit = gameState === 'play' && playerScore < 21;

  return (
    <div className="relative flex h-screen w-full flex-col bg-[#020202] overflow-hidden font-sans text-slate-100 no-scrollbar max-w-md mx-auto shadow-2xl">
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-[2px]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full bg-black/60 text-yellow-500 border border-yellow-500/30 backdrop-blur-md active:scale-90 transition-all">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-white text-sm font-black uppercase tracking-widest leading-tight">Corona Blackjack</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 w-fit">
              <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[9px] font-black text-red-500 tracking-widest uppercase">LIVE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full border border-yellow-500/30 shadow-2xl">
            <Wallet size={16} className="text-yellow-500" />
            <span className="text-yellow-500 font-black text-sm tracking-wider">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar pt-20">
        <div className="relative w-full aspect-video overflow-hidden">
          <img src="https://images.unsplash.com/photo-1596743444253-447c4bf23027?q=80&w=2070&auto=format&fit=crop" alt="Dealer" className="absolute inset-0 w-full h-full object-cover object-center opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-black/40"></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#020202_100%)]">
          {/* Dealer */}
          <div className="mb-8">
            <p className="text-amber-500/80 text-xs font-bold mb-2">DEALER {dealerScore > 0 && `(${dealerScore})`}</p>
            <div className="flex gap-2">
              {dealerCards.map((c, i) => (
                <PlayingCard key={i} card={c} isFlipped={gameState === 'play' && i === 1} />
              ))}
            </div>
          </div>

          {/* Player */}
          <div>
            <p className="text-blue-400/80 text-xs font-bold mb-2">BẠN {playerScore > 0 && `(${playerScore})`}</p>
            <div className="flex gap-2">
              {playerCards.map((c, i) => (
                <PlayingCard key={i} card={c} />
              ))}
            </div>
          </div>

          {result && (
            <p className={`mt-4 text-xl font-black ${result === 'win' ? 'text-green-500' : result === 'lose' ? 'text-red-500' : 'text-yellow-500'}`}>
              {result === 'win' ? 'THẮNG!' : result === 'lose' ? 'THUA' : 'HÒA'}
            </p>
          )}
        </div>
      </main>

      <div className="bg-[#050505] border-t border-white/10 p-5 pt-3 space-y-5 backdrop-blur-xl">
        {gameState === 'bet' && (
          <>
            <div className="flex justify-between items-center gap-3 overflow-x-auto py-1 no-scrollbar">
              {CHIPS.map((val) => (
                <button
                  key={val}
                  onClick={() => setSelectedChip(val)}
                  disabled={balance < val}
                  className={`flex-shrink-0 size-12 rounded-full border-2 border-dashed flex items-center justify-center shadow-2xl transform active:scale-90 transition-all ${selectedChip === val ? 'metallic-gold border-yellow-400' : 'border-white/40 bg-black/60'} disabled:opacity-50`}
                >
                  <span className={`font-black text-[10px] ${selectedChip === val ? 'text-black' : 'text-white'}`}>${val >= 1000 ? val / 1000 + 'K' : val}</span>
                </button>
              ))}
            </div>
            <button onClick={handlePlaceBet} disabled={balance < selectedChip} className="w-full metallic-gold text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest disabled:opacity-50">
              ĐẶT CƯỢC ${selectedChip}
            </button>
          </>
        )}
        {(gameState === 'play' || gameState === 'result') && (
          <div className="grid grid-cols-4 gap-2">
            <button onClick={handleHit} disabled={!canHit} className="bg-white/5 border border-white/10 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-white disabled:opacity-50 disabled:cursor-not-allowed">HIT</button>
            <button onClick={handleStand} disabled={gameState !== 'play'} className="bg-white/5 border border-white/10 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-white disabled:opacity-50">STAND</button>
            <button onClick={handleNewGame} disabled={gameState !== 'result'} className="col-span-2 metallic-gold text-black font-black py-4 rounded-xl text-[9px] uppercase tracking-widest disabled:opacity-50">
              VÁN MỚI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
