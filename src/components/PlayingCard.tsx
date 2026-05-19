import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface CardData {
  suit: Suit;
  rank: Rank;
  value: number;
}

const suitSymbols: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors: Record<Suit, string> = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-black',
  spades: 'text-black',
};

interface PlayingCardProps {
  card?: CardData;
  isFlipped?: boolean;
  className?: string;
  delay?: number;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({ card, isFlipped = false, className = '', delay = 0 }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: -200, rotate: -180 }}
      animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 100, delay }}
      className={`relative w-24 h-36 perspective-1000 ${className}`}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', damping: 20 }}
        className="w-full h-full relative preserve-3d"
      >
        {/* Back of Card */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl bg-gradient-to-br from-red-800 to-red-950 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
          <div className="absolute inset-2 border-2 border-yellow-500/30 rounded-lg flex items-center justify-center">
            <div className="w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #facc15 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
            <img 
              src="https://www.transparentpng.com/download/crest/gold-crest-png-2.png" 
              alt="Crest" 
              className="w-16 h-16 opacity-40 object-contain"
            />
          </div>
        </div>

        {/* Front of Card */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl bg-white border-2 border-slate-200 shadow-xl flex flex-col p-2 rotate-y-180">
          {card && (
            <>
              <div className={`flex flex-col items-start leading-none ${suitColors[card.suit]}`}>
                <span className="text-xl font-bold">{card.rank}</span>
                <span className="text-lg">{suitSymbols[card.suit]}</span>
              </div>
              <div className={`flex-1 flex items-center justify-center text-4xl ${suitColors[card.suit]}`}>
                {suitSymbols[card.suit]}
              </div>
              <div className={`flex flex-col items-end leading-none rotate-180 ${suitColors[card.suit]}`}>
                <span className="text-xl font-bold">{card.rank}</span>
                <span className="text-lg">{suitSymbols[card.suit]}</span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
