import { getRouletteNumber } from '../rng/provablyFair.js';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export interface RouletteBet {
  RED?: number;
  BLACK?: number;
}

export interface RouletteResult {
  number: number;
  isRed: boolean;
  winAmount: number;
  payout: number;
}

export function playRoulette(
  bets: RouletteBet,
  serverSeed: string,
  clientSeed: string,
  nonce: number
): RouletteResult {
  const number = getRouletteNumber(serverSeed, clientSeed, nonce);
  const isRed = number > 0 && RED_NUMBERS.includes(number);

  let winAmount = 0;
  if (number === 0) {
    winAmount = 0;
  } else if (isRed && (bets.RED ?? 0) > 0) {
    winAmount = (bets.RED ?? 0) * 2;
  } else if (!isRed && (bets.BLACK ?? 0) > 0) {
    winAmount = (bets.BLACK ?? 0) * 2;
  }

  const totalBet = (bets.RED ?? 0) + (bets.BLACK ?? 0);
  const payout = winAmount - totalBet;

  return { number, isRed, winAmount, payout };
}
