import { getBaccaratCard } from '../rng/provablyFair.js';

export type BetArea = 'PLAYER' | 'BANKER' | 'TIE';

export interface BaccaratBet {
  PLAYER?: number;
  BANKER?: number;
  TIE?: number;
}

function baccaratScore(cards: number[]): number {
  return cards.reduce((s, c) => s + c, 0) % 10;
}

export interface BaccaratResult {
  playerCards: number[];
  bankerCards: number[];
  playerScore: number;
  bankerScore: number;
  result: BetArea;
  winAmount: number;
  payout: number;
}

export interface BaccaratMults {
  player?: number;
  banker?: number;
  tie?: number;
}

export function playBaccarat(
  bets: BaccaratBet,
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  mults?: BaccaratMults
): BaccaratResult {
  const mP = mults?.player ?? 2;
  const mB = mults?.banker ?? 1.95;
  const mT = mults?.tie ?? 9;
  let nonceOffset = nonce;
  const playerCards: number[] = [];
  const bankerCards: number[] = [];

  playerCards.push(getBaccaratCard(serverSeed, clientSeed, nonceOffset++));
  playerCards.push(getBaccaratCard(serverSeed, clientSeed, nonceOffset++));
  bankerCards.push(getBaccaratCard(serverSeed, clientSeed, nonceOffset++));
  bankerCards.push(getBaccaratCard(serverSeed, clientSeed, nonceOffset++));

  let pScore = baccaratScore(playerCards);
  let bScore = baccaratScore(bankerCards);

  if (pScore < 6 && bScore < 8) {
    playerCards.push(getBaccaratCard(serverSeed, clientSeed, nonceOffset++));
    pScore = baccaratScore(playerCards);
  }
  if (bScore < 6 && pScore < 8) {
    bankerCards.push(getBaccaratCard(serverSeed, clientSeed, nonceOffset++));
    bScore = baccaratScore(bankerCards);
  }

  let result: BetArea = 'TIE';
  if (pScore > bScore) result = 'PLAYER';
  else if (bScore > pScore) result = 'BANKER';

  let winAmount = 0;
  const pBet = bets.PLAYER ?? 0;
  const bBet = bets.BANKER ?? 0;
  const tBet = bets.TIE ?? 0;

  if (result === 'PLAYER' && pBet > 0) winAmount += pBet * mP;
  if (result === 'BANKER' && bBet > 0) winAmount += bBet * mB;
  if (result === 'TIE' && tBet > 0) winAmount += tBet * mT;
  if (result === 'TIE') {
    winAmount += pBet + bBet;
  }

  const totalBet = pBet + bBet + tBet;
  const payout = winAmount - totalBet;

  return {
    playerCards,
    bankerCards,
    playerScore: pScore,
    bankerScore: bScore,
    result,
    winAmount,
    payout,
  };
}
