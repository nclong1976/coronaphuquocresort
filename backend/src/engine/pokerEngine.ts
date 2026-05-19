/**
 * Simplified poker engines for Three Card Poker, Caribbean Stud, Niu Niu, Texas Holdem, Russian Poker.
 * Each game: single bet -> server generates result -> payout.
 */
import { getFairNumber } from '../rng/provablyFair.js';

function shuffleDeck(serverSeed: string, clientSeed: string, nonce: number): number[] {
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 0; i < 51; i++) {
    const j = i + getFairNumber(serverSeed, clientSeed, nonce + i, 52 - i);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function getCards(deck: number[], start: number, count: number): number[] {
  return deck.slice(start, start + count);
}

function cardValue(c: number): number {
  const v = (c % 13) + 1;
  return v > 10 ? 10 : v;
}

function cardRank(c: number): number {
  return (c % 13) + 1;
}

/** Three Card Poker: Compare 3-card hands. Player vs Dealer. */
export function playThreeCardPoker(
  betAmount: number,
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { playerCards: number[]; dealerCards: number[]; result: string; winAmount: number; payout: number } {
  const deck = shuffleDeck(serverSeed, clientSeed, nonce);
  const playerCards = getCards(deck, 0, 3);
  const dealerCards = getCards(deck, 3, 3);

  const pScore = threeCardScore(playerCards);
  const dScore = threeCardScore(dealerCards);

  let result = 'lose';
  let winAmount = 0;
  if (pScore > dScore) {
    result = 'win';
    winAmount = betAmount * 2;
  } else if (pScore === dScore) {
    result = 'push';
    winAmount = betAmount;
  }

  return {
    playerCards,
    dealerCards,
    result,
    winAmount,
    payout: winAmount - betAmount,
  };
}

function threeCardScore(cards: number[]): number {
  const ranks = cards.map((c) => cardRank(c)).sort((a, b) => b - a);
  const isStraight = ranks[0] - ranks[2] === 2 || (ranks[0] === 14 && ranks[1] === 3);
  const isFlush = true;
  const sum = ranks.reduce((a, b) => a + b, 0);
  return sum * 1000 + (isStraight ? 100 : 0);
}

/** Caribbean Stud: Ante bet, compare 5-card hands. Simplified - single bet. */
export function playCaribbeanStud(
  betAmount: number,
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { playerCards: number[]; dealerCards: number[]; result: string; winAmount: number; payout: number } {
  const deck = shuffleDeck(serverSeed, clientSeed, nonce);
  const playerCards = getCards(deck, 0, 5);
  const dealerCards = getCards(deck, 5, 5);

  const pScore = fiveCardScore(playerCards);
  const dScore = fiveCardScore(dealerCards);

  let result = 'lose';
  let winAmount = 0;
  if (pScore > dScore) {
    result = 'win';
    winAmount = betAmount * 2;
  } else if (pScore === dScore) {
    result = 'push';
    winAmount = betAmount;
  }

  return {
    playerCards,
    dealerCards,
    result,
    winAmount,
    payout: winAmount - betAmount,
  };
}

function fiveCardScore(cards: number[]): number {
  const values = cards.map((c) => cardValue(c));
  return values.reduce((a, b) => a + b, 0);
}

/** Niu Niu: 5 cards, split 3+2, compare Niu value (sum % 10). Simplified single bet. */
export function playNiuNiu(
  betAmount: number,
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { playerCards: number[]; bankerCards: number[]; playerNiu: number; bankerNiu: number; result: string; winAmount: number; payout: number } {
  const deck = shuffleDeck(serverSeed, clientSeed, nonce);
  const playerCards = getCards(deck, 0, 5);
  const bankerCards = getCards(deck, 5, 5);

  const playerNiu = niuNiuValue(playerCards);
  const bankerNiu = niuNiuValue(bankerCards);

  let result = 'lose';
  let winAmount = 0;
  if (playerNiu > bankerNiu) {
    result = 'win';
    winAmount = betAmount * 2;
  } else if (playerNiu === bankerNiu) {
    result = 'push';
    winAmount = betAmount;
  }

  return {
    playerCards,
    bankerCards,
    playerNiu,
    bankerNiu,
    result,
    winAmount,
    payout: winAmount - betAmount,
  };
}

function niuNiuValue(cards: number[]): number {
  const values = cards.map((c) => cardValue(c));
  let best = 0;
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      for (let k = j + 1; k < 5; k++) {
        const three = [values[i], values[j], values[k]];
        const two = values.filter((_, idx) => idx !== i && idx !== j && idx !== k);
        const threeSum = three.reduce((a, b) => a + b, 0) % 10;
        const twoSum = two.reduce((a, b) => a + b, 0) % 10;
        const niu = (threeSum + twoSum) % 10;
        if (niu > best) best = niu;
      }
    }
  }
  return best;
}

/** Texas Holdem / Russian Poker: Simplified - single bet, random result. */
export function playTexasHoldem(
  betAmount: number,
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { playerCards: number[]; communityCards: number[]; result: string; winAmount: number; payout: number } {
  const deck = shuffleDeck(serverSeed, clientSeed, nonce);
  const playerCards = getCards(deck, 0, 2);
  const communityCards = getCards(deck, 2, 5);

  const pScore = playerCards.reduce((a, c) => a + cardValue(c), 0) % 10;
  const cScore = communityCards.reduce((a, c) => a + cardValue(c), 0) % 10;

  let result = 'lose';
  let winAmount = 0;
  if (pScore > cScore) {
    result = 'win';
    winAmount = betAmount * 2;
  } else if (pScore === cScore) {
    result = 'push';
    winAmount = betAmount;
  }

  return {
    playerCards,
    communityCards,
    result,
    winAmount,
    payout: winAmount - betAmount,
  };
}

export function playRussianPoker(
  betAmount: number,
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { playerCards: number[]; dealerCards: number[]; result: string; winAmount: number; payout: number } {
  return playThreeCardPoker(betAmount, serverSeed, clientSeed, nonce);
}
