import { getBaccaratCard } from '../rng/provablyFair.js';

export interface DragonTigerBet {
  DRAGON?: number;
  TIGER?: number;
  TIE?: number;
}

export interface DragonTigerResult {
  dragonCard: number;
  tigerCard: number;
  result: 'DRAGON' | 'TIGER' | 'TIE';
  winAmount: number;
  payout: number;
}

export interface DragonTigerMults {
  dragon?: number;
  tiger?: number;
  tie?: number;
}

export function playDragonTiger(
  bets: DragonTigerBet,
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  mults?: DragonTigerMults
): DragonTigerResult {
  const mD = mults?.dragon ?? 2;
  const mTg = mults?.tiger ?? 2;
  const mTie = mults?.tie ?? 9;
  const dragonCard = getBaccaratCard(serverSeed, clientSeed, nonce) || 13;
  const tigerCard = getBaccaratCard(serverSeed, clientSeed, nonce + 1) || 13;

  let result: 'DRAGON' | 'TIGER' | 'TIE' = 'TIE';
  if (dragonCard > tigerCard) result = 'DRAGON';
  else if (tigerCard > dragonCard) result = 'TIGER';

  let winAmount = 0;
  const dBet = bets.DRAGON ?? 0;
  const tBet = bets.TIGER ?? 0;
  const tieBet = bets.TIE ?? 0;

  if (result === 'DRAGON' && dBet > 0) winAmount += dBet * mD;
  if (result === 'TIGER' && tBet > 0) winAmount += tBet * mTg;
  if (result === 'TIE' && tieBet > 0) winAmount += tieBet * mTie;

  const totalBet = dBet + tBet + tieBet;
  const payout = winAmount - totalBet;

  return { dragonCard, tigerCard, result, winAmount, payout };
}
