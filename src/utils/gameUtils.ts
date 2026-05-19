import { CardData, Suit, Rank } from '../components/PlayingCard';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const getRandomCard = (): CardData => {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  
  let value = 0;
  if (rank === 'A') value = 1;
  else if (['J', 'Q', 'K'].includes(rank)) value = 10;
  else value = parseInt(rank);
  
  return { suit, rank, value };
};

export const calculateBaiCaoScore = (cards: CardData[]) => {
  const sum = cards.reduce((acc, card) => acc + card.value, 0);
  return sum % 10;
};
