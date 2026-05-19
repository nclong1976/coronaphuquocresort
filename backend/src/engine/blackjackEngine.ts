import { getBlackjackCard } from '../rng/provablyFair.js';

export interface BlackjackBet {
  amount: number;
}

function blackjackScore(cards: number[]): number {
  let sum = cards.reduce((a, c) => a + c, 0);
  const aces = cards.filter((c) => c === 1).length;
  for (let i = 0; i < aces && sum + 10 <= 21; i++) sum += 10;
  return sum;
}

export interface BlackjackResult {
  playerCards: number[];
  dealerCards: number[];
  playerScore: number;
  dealerScore: number;
  result: 'win' | 'lose' | 'push';
  winAmount: number;
  payout: number;
}

export function playBlackjack(
  betAmount: number,
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  playerStands: boolean
): BlackjackResult {
  let n = nonce;
  const playerCards: number[] = [
    getBlackjackCard(serverSeed, clientSeed, n++),
    getBlackjackCard(serverSeed, clientSeed, n++),
  ];
  const dealerCards: number[] = [
    getBlackjackCard(serverSeed, clientSeed, n++),
    getBlackjackCard(serverSeed, clientSeed, n++),
  ];

  if (!playerStands) {
    while (blackjackScore(playerCards) < 17) {
      playerCards.push(getBlackjackCard(serverSeed, clientSeed, n++));
    }
  }

  while (blackjackScore(dealerCards) < 17) {
    dealerCards.push(getBlackjackCard(serverSeed, clientSeed, n++));
  }

  const pScore = blackjackScore(playerCards);
  const dScore = blackjackScore(dealerCards);

  let result: 'win' | 'lose' | 'push' = 'lose';
  if (pScore > 21) result = 'lose';
  else if (dScore > 21) result = 'win';
  else if (pScore > dScore) result = 'win';
  else if (pScore < dScore) result = 'lose';
  else result = 'push';

  let winAmount = 0;
  if (result === 'win') winAmount = betAmount * 2;
  else if (result === 'push') winAmount = betAmount;

  const payout = winAmount - betAmount;

  return {
    playerCards,
    dealerCards,
    playerScore: pScore,
    dealerScore: dScore,
    result,
    winAmount,
    payout,
  };
}
