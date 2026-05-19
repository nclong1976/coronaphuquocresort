import { getBaccaratCard } from '../rng/provablyFair.js';

export type BetArea = 'PLAYER' | 'BANKER' | 'TIE';

export interface BaiCaoBet {
  PLAYER?: number;
  BANKER?: number;
  TIE?: number;
}

function baiCaoScore(cards: number[]): number {
  return cards.reduce((s, c) => s + c, 0) % 10;
}

export interface BaiCaoResult {
  playerCards: number[];
  bankerCards: number[];
  playerScore: number;
  bankerScore: number;
  result: BetArea;
  winAmount: number;
  payout: number;
}

export interface BaiCaoMults {
  player?: number;
  banker?: number;
  tie?: number;
}

export function playBaiCao(
  bets: BaiCaoBet,
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  mults?: BaiCaoMults
): BaiCaoResult {
  const mP = mults?.player ?? 2;
  const mB = mults?.banker ?? 1.95;
  const mT = mults?.tie ?? 9;
  let n = nonce;
  const playerCards: number[] = [
    getBaccaratCard(serverSeed, clientSeed, n++),
    getBaccaratCard(serverSeed, clientSeed, n++),
    getBaccaratCard(serverSeed, clientSeed, n++),
  ];
  const bankerCards: number[] = [
    getBaccaratCard(serverSeed, clientSeed, n++),
    getBaccaratCard(serverSeed, clientSeed, n++),
    getBaccaratCard(serverSeed, clientSeed, n++),
  ];

  const pScore = baiCaoScore(playerCards);
  const bScore = baiCaoScore(bankerCards);

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
  if (result === 'TIE') winAmount += pBet + bBet;

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
