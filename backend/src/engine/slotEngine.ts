import { getSlotSymbol } from '../rng/provablyFair.js';

const SYMBOL_VALUES = [100, 50, 25, 10]; // Crown, Diamond, Star, Coins

export interface SlotBet {
  amount: number;
}

export interface SlotResult {
  symbols: number[];
  winAmount: number;
  payout: number;
}

export function playSlot(
  betAmount: number,
  serverSeed: string,
  clientSeed: string,
  nonce: number
): SlotResult {
  const symbols: number[] = [];
  for (let i = 0; i < 9; i++) {
    symbols.push(getSlotSymbol(serverSeed, clientSeed, nonce + i, 4));
  }

  let winAmount = 0;
  for (let row = 0; row < 3; row++) {
    const a = symbols[row * 3];
    const b = symbols[row * 3 + 1];
    const c = symbols[row * 3 + 2];
    if (a === b && b === c) {
      winAmount += SYMBOL_VALUES[a] * betAmount;
    }
  }

  const payout = winAmount - betAmount;

  return { symbols, winAmount, payout };
}
