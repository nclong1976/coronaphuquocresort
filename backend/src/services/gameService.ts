/**
 * Luồng đặt cược (chung):
 * 1. Khấu trừ ngay khi lệnh đặt cược được xác nhận → đảm bảo tính khả dụng
 * 2. Chạy ván đấu (engine) → xác định kết quả
 * 3. Đối soát: nếu thắng → cộng tiền thưởng theo tỷ lệ trả thưởng của ô cược
 *
 * Sic Bo đặc biệt: ván theo thời gian 4:59. Trả thưởng CHỈ khi 0:00 mở bát.
 * Xem sicBoRoundService.ts
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { executeLedgerEntry, getBalance } from '../ledger/walletService.js';
import { generateServerSeed, hashServerSeed } from '../rng/provablyFair.js';
import { playSicBo } from '../engine/sicBoEngine.js';
import { playBaccarat } from '../engine/baccaratEngine.js';
import { playDragonTiger } from '../engine/dragonTigerEngine.js';
import { playRoulette } from '../engine/rouletteEngine.js';
import { playBlackjack } from '../engine/blackjackEngine.js';
import { playSlot } from '../engine/slotEngine.js';
import { playBaiCao } from '../engine/baiCaoEngine.js';
import { playThreeCardPoker, playCaribbeanStud, playNiuNiu, playTexasHoldem, playRussianPoker } from '../engine/pokerEngine.js';
import { isGameEnabled, getGameLimits } from './gameConfigService.js';
import { getTimedPayoutRatio } from './payoutConfigService.js';

const prisma = new PrismaClient();

function getOrCreateRoundSeed(game: string, roundId: string, clientSeed?: string) {
  return prisma.$transaction(async (tx) => {
    let round = await tx.roundSeed.findUnique({ where: { roundId } });
    if (!round) {
      const serverSeed = crypto.randomBytes(32).toString('hex');
      const serverSeedHash = hashServerSeed(serverSeed);
      round = await tx.roundSeed.create({
        data: {
          game,
          roundId,
          serverSeed,
          serverSeedHash,
          clientSeed: clientSeed || crypto.randomBytes(16).toString('hex'),
          nonce: 0,
        },
      });
    }
    return round;
  });
}

function parseBetAmount(val: unknown): number {
  const n = typeof val === 'number' ? val : parseFloat(String(val ?? 0));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

async function validateGameBet(gameId: string, totalBet: number) {
  if (!Number.isFinite(totalBet) || totalBet <= 0) throw new Error('Invalid bet amount');
  const enabled = await isGameEnabled(gameId);
  if (!enabled) throw new Error('Game is disabled');
  const { minBet, maxBet } = await getGameLimits(gameId);
  if (totalBet < minBet) throw new Error(`Minimum bet is ${minBet}`);
  if (totalBet > maxBet) throw new Error(`Maximum bet is ${maxBet}`);
}

export async function playSicBoGame(userId: string, bets: { BIG?: number; SMALL?: number }, clientSeed?: string) {
  const { placeSicBoBet, getSicBoRoundResult } = await import('./sicBoRoundService.js');
  const placed = await placeSicBoBet(userId, bets, clientSeed);
  if (placed.status === 'bet_placed') {
    return placed;
  }
  throw new Error('Unexpected response');
}

export async function playBaccaratGame(
  userId: string,
  bets: { PLAYER?: number; BANKER?: number; TIE?: number },
  clientSeed?: string,
  opts?: { storageGameId?: string }
) {
  const storageGameId = opts?.storageGameId ?? 'baccarat';
  const roundId = `${storageGameId}_${Date.now()}`;
  const safeBets = { PLAYER: parseBetAmount(bets?.PLAYER), BANKER: parseBetAmount(bets?.BANKER), TIE: parseBetAmount(bets?.TIE) };
  const totalBet = safeBets.PLAYER + safeBets.BANKER + safeBets.TIE;
  if (totalBet <= 0) throw new Error('Invalid bet amount');
  await validateGameBet(storageGameId, totalBet);

  const balance = await getBalance(userId);
  if (balance < totalBet) throw new Error('Insufficient balance');

  const round = await getOrCreateRoundSeed(storageGameId, roundId, clientSeed);

  const [mP, mB, mT] = await Promise.all([
    getTimedPayoutRatio(storageGameId, 'PLAYER', 2),
    getTimedPayoutRatio(storageGameId, 'BANKER', 1.95),
    getTimedPayoutRatio(storageGameId, 'TIE', 9),
  ]);

  // 1. Khấu trừ ngay khi lệnh đặt cược được xác nhận
  const betEntry = await executeLedgerEntry({
    userId,
    type: 'bet',
    amount: totalBet,
    game: storageGameId,
    metadata: { roundId, bets: safeBets },
  });
  if (!betEntry.success) throw new Error(betEntry.error ?? 'Bet failed');

  // 2. Chạy ván đấu và đối soát kết quả
  const result = playBaccarat(safeBets, round.serverSeed, round.clientSeed ?? '', round.nonce, { player: mP, banker: mB, tie: mT });

  // 3. Nếu thắng: cộng tiền thưởng theo tỷ lệ trả thưởng
  let newBalance = betEntry.newBalance;
  if (result.winAmount > 0) {
    const winEntry = await executeLedgerEntry({
      userId,
      type: 'win',
      amount: result.winAmount,
      game: storageGameId,
      metadata: { roundId, result },
    });
    newBalance = winEntry.newBalance;
  }

  await prisma.bet.create({
    data: {
      userId,
      game: storageGameId,
      betAmount: totalBet,
      betData: safeBets,
      result: result.result,
      payout: result.payout,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
    },
  });

  return {
    roundId,
    playerCards: result.playerCards,
    bankerCards: result.bankerCards,
    playerScore: result.playerScore,
    bankerScore: result.bankerScore,
    result: result.result,
    winAmount: result.winAmount,
    balance: newBalance,
    serverSeedHash: round.serverSeedHash,
  };
}

export async function playDragonTigerGame(userId: string, bets: { DRAGON?: number; TIGER?: number; TIE?: number }, clientSeed?: string) {
  const roundId = `dragontiger_${Date.now()}`;
  const safeBets = { DRAGON: parseBetAmount(bets?.DRAGON), TIGER: parseBetAmount(bets?.TIGER), TIE: parseBetAmount(bets?.TIE) };
  const totalBet = safeBets.DRAGON + safeBets.TIGER + safeBets.TIE;
  if (totalBet <= 0) throw new Error('Invalid bet amount');
  await validateGameBet('dragontiger', totalBet);

  const balance = await getBalance(userId);
  if (balance < totalBet) throw new Error('Insufficient balance');

  const round = await getOrCreateRoundSeed('dragontiger', roundId, clientSeed);

  // 1. Khấu trừ ngay khi lệnh đặt cược được xác nhận
  const betEntry = await executeLedgerEntry({
    userId,
    type: 'bet',
    amount: totalBet,
    game: 'dragontiger',
    metadata: { roundId, bets: safeBets },
  });
  if (!betEntry.success) throw new Error(betEntry.error ?? 'Bet failed');

  const [mD, mTg, mTie] = await Promise.all([
    getTimedPayoutRatio('dragontiger', 'DRAGON', 2),
    getTimedPayoutRatio('dragontiger', 'TIGER', 2),
    getTimedPayoutRatio('dragontiger', 'TIE', 9),
  ]);

  // 2. Chạy ván đấu và đối soát kết quả
  const result = playDragonTiger(safeBets, round.serverSeed, round.clientSeed ?? '', round.nonce, {
    dragon: mD,
    tiger: mTg,
    tie: mTie,
  });

  // 3. Nếu thắng: cộng tiền thưởng theo tỷ lệ trả thưởng
  let newBalance = betEntry.newBalance;
  if (result.winAmount > 0) {
    const winEntry = await executeLedgerEntry({
      userId,
      type: 'win',
      amount: result.winAmount,
      game: 'dragontiger',
      metadata: { roundId, result },
    });
    newBalance = winEntry.newBalance;
  }

  await prisma.bet.create({
    data: {
      userId,
      game: 'dragontiger',
      betAmount: totalBet,
      betData: safeBets,
      result: result.result,
      payout: result.payout,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
    },
  });

  return {
    roundId,
    dragonCard: result.dragonCard,
    tigerCard: result.tigerCard,
    result: result.result,
    winAmount: result.winAmount,
    balance: newBalance,
    serverSeedHash: round.serverSeedHash,
  };
}

export async function playRouletteGame(userId: string, bets: { RED?: number; BLACK?: number }, clientSeed?: string) {
  const roundId = `roulette_${Date.now()}`;
  const safeBets = { RED: parseBetAmount(bets?.RED), BLACK: parseBetAmount(bets?.BLACK) };
  const totalBet = safeBets.RED + safeBets.BLACK;
  if (totalBet <= 0) throw new Error('Invalid bet amount');
  await validateGameBet('roulette', totalBet);

  const balance = await getBalance(userId);
  if (balance < totalBet) throw new Error('Insufficient balance');

  const round = await getOrCreateRoundSeed('roulette', roundId, clientSeed);

  // 1. Khấu trừ ngay khi lệnh đặt cược được xác nhận
  const betEntry = await executeLedgerEntry({
    userId,
    type: 'bet',
    amount: totalBet,
    game: 'roulette',
    metadata: { roundId, bets: safeBets },
  });
  if (!betEntry.success) throw new Error(betEntry.error ?? 'Bet failed');

  // 2. Chạy ván đấu và đối soát kết quả
  const result = playRoulette(safeBets, round.serverSeed, round.clientSeed ?? '', round.nonce);

  // 3. Nếu thắng: cộng tiền thưởng theo tỷ lệ trả thưởng
  let newBalance = betEntry.newBalance;
  if (result.winAmount > 0) {
    const winEntry = await executeLedgerEntry({
      userId,
      type: 'win',
      amount: result.winAmount,
      game: 'roulette',
      metadata: { roundId, result },
    });
    newBalance = winEntry.newBalance;
  }

  await prisma.bet.create({
    data: {
      userId,
      game: 'roulette',
      betAmount: totalBet,
      betData: safeBets,
      result: String(result.number),
      payout: result.payout,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
    },
  });

  return {
    roundId,
    number: result.number,
    isRed: result.isRed,
    winAmount: result.winAmount,
    balance: newBalance,
    serverSeedHash: round.serverSeedHash,
  };
}

export async function playBlackjackGame(userId: string, betAmount: number, clientSeed?: string) {
  const roundId = `blackjack_${Date.now()}`;
  const amount = parseBetAmount(betAmount);
  if (amount <= 0) throw new Error('Invalid bet amount');
  await validateGameBet('blackjack', amount);

  const balance = await getBalance(userId);
  if (balance < amount) throw new Error('Insufficient balance');

  const round = await getOrCreateRoundSeed('blackjack', roundId, clientSeed);

  // 1. Khấu trừ ngay khi lệnh đặt cược được xác nhận
  const betEntry = await executeLedgerEntry({
    userId,
    type: 'bet',
    amount: amount,
    game: 'blackjack',
    metadata: { roundId, amount },
  });
  if (!betEntry.success) throw new Error(betEntry.error ?? 'Bet failed');

  // 2. Chạy ván đấu và đối soát kết quả
  const result = playBlackjack(amount, round.serverSeed, round.clientSeed ?? '', round.nonce, true);

  // 3. Nếu thắng: cộng tiền thưởng theo tỷ lệ trả thưởng
  let newBalance = betEntry.newBalance;
  if (result.winAmount > 0) {
    const winEntry = await executeLedgerEntry({
      userId,
      type: 'win',
      amount: result.winAmount,
      game: 'blackjack',
      metadata: { roundId, result },
    });
    newBalance = winEntry.newBalance;
  }

  await prisma.bet.create({
    data: {
      userId,
      game: 'blackjack',
      betAmount: amount,
      betData: { amount },
      result: result.result,
      payout: result.payout,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
    },
  });

  return {
    roundId,
    playerCards: result.playerCards,
    dealerCards: result.dealerCards,
    playerScore: result.playerScore,
    dealerScore: result.dealerScore,
    result: result.result,
    winAmount: result.winAmount,
    balance: newBalance,
    serverSeedHash: round.serverSeedHash,
  };
}

export async function playSlotGame(userId: string, betAmount: number, clientSeed?: string) {
  const roundId = `slot_${Date.now()}`;
  const amount = parseBetAmount(betAmount);
  if (amount <= 0) throw new Error('Invalid bet amount');
  await validateGameBet('slot', amount);

  const balance = await getBalance(userId);
  if (balance < amount) throw new Error('Insufficient balance');

  const round = await getOrCreateRoundSeed('slot', roundId, clientSeed);

  // 1. Khấu trừ ngay khi lệnh đặt cược được xác nhận
  const betEntry = await executeLedgerEntry({
    userId,
    type: 'bet',
    amount: amount,
    game: 'slot',
    metadata: { roundId, amount },
  });
  if (!betEntry.success) throw new Error(betEntry.error ?? 'Bet failed');

  // 2. Chạy ván đấu và đối soát kết quả
  const result = playSlot(amount, round.serverSeed, round.clientSeed ?? '', round.nonce);

  // 3. Nếu thắng: cộng tiền thưởng theo tỷ lệ trả thưởng
  let newBalance = betEntry.newBalance;
  if (result.winAmount > 0) {
    const winEntry = await executeLedgerEntry({
      userId,
      type: 'win',
      amount: result.winAmount,
      game: 'slot',
      metadata: { roundId, result },
    });
    newBalance = winEntry.newBalance;
  }

  await prisma.bet.create({
    data: {
      userId,
      game: 'slot',
      betAmount: amount,
      betData: { amount },
      result: result.symbols.join(','),
      payout: result.payout,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
    },
  });

  return {
    roundId,
    symbols: result.symbols,
    winAmount: result.winAmount,
    balance: newBalance,
    serverSeedHash: round.serverSeedHash,
  };
}

// Tiger Baccarat = cùng engine Baccarat, cấu hình tỉ lệ riêng (GamePayoutConfig gameId tigerbaccarat)
export function playTigerBaccaratGame(
  userId: string,
  bets: { PLAYER?: number; BANKER?: number; TIE?: number },
  clientSeed?: string
) {
  return playBaccaratGame(userId, bets, clientSeed, { storageGameId: 'tigerbaccarat' });
}

// BaccaratLongHo = Dragon Tiger
export async function playBaccaratLongHoGame(userId: string, bets: { DRAGON?: number; TIGER?: number; TIE?: number }, clientSeed?: string) {
  return playDragonTigerGame(userId, bets, clientSeed);
}

export async function playBaiCaoGame(userId: string, bets: { PLAYER?: number; BANKER?: number; TIE?: number }, clientSeed?: string) {
  const roundId = `baicao_${Date.now()}`;
  const safeBets = { PLAYER: parseBetAmount(bets?.PLAYER), BANKER: parseBetAmount(bets?.BANKER), TIE: parseBetAmount(bets?.TIE) };
  const totalBet = safeBets.PLAYER + safeBets.BANKER + safeBets.TIE;
  if (totalBet <= 0) throw new Error('Invalid bet amount');
  await validateGameBet('baicao', totalBet);

  const balance = await getBalance(userId);
  if (balance < totalBet) throw new Error('Insufficient balance');

  const round = await getOrCreateRoundSeed('baicao', roundId, clientSeed);

  // 1. Khấu trừ ngay khi lệnh đặt cược được xác nhận
  const betEntry = await executeLedgerEntry({ userId, type: 'bet', amount: totalBet, game: 'baicao', metadata: { roundId, bets: safeBets } });
  if (!betEntry.success) throw new Error(betEntry.error ?? 'Bet failed');

  const [mP, mB, mT] = await Promise.all([
    getTimedPayoutRatio('baicao', 'PLAYER', 2),
    getTimedPayoutRatio('baicao', 'BANKER', 1.95),
    getTimedPayoutRatio('baicao', 'TIE', 9),
  ]);

  // 2. Chạy ván đấu và đối soát kết quả
  const result = playBaiCao(safeBets, round.serverSeed, round.clientSeed ?? '', round.nonce, { player: mP, banker: mB, tie: mT });

  // 3. Nếu thắng: cộng tiền thưởng theo tỷ lệ trả thưởng
  let newBalance = betEntry.newBalance;
  if (result.winAmount > 0) {
    const winEntry = await executeLedgerEntry({ userId, type: 'win', amount: result.winAmount, game: 'baicao', metadata: { roundId, result } });
    newBalance = winEntry.newBalance;
  }

  await prisma.bet.create({
    data: { userId, game: 'baicao', betAmount: totalBet, betData: safeBets, result: result.result, payout: result.payout, serverSeedHash: round.serverSeedHash, clientSeed: round.clientSeed, nonce: round.nonce },
  });

  return { roundId, playerCards: result.playerCards, bankerCards: result.bankerCards, playerScore: result.playerScore, bankerScore: result.bankerScore, result: result.result, winAmount: result.winAmount, balance: newBalance, serverSeedHash: round.serverSeedHash };
}

async function playPokerStyleGame(userId: string, gameId: string, betAmount: number, playFn: (bet: number, s: string, c: string, n: number) => any, clientSeed?: string) {
  const amount = parseBetAmount(betAmount);
  if (amount <= 0) throw new Error('Invalid bet amount');
  await validateGameBet(gameId, amount);

  const balance = await getBalance(userId);
  if (balance < amount) throw new Error('Insufficient balance');

  const roundId = `${gameId}_${Date.now()}`;
  const round = await getOrCreateRoundSeed(gameId, roundId, clientSeed);

  // 1. Khấu trừ ngay khi lệnh đặt cược được xác nhận
  const betEntry = await executeLedgerEntry({ userId, type: 'bet', amount: amount, game: gameId, metadata: { roundId, amount } });
  if (!betEntry.success) throw new Error(betEntry.error ?? 'Bet failed');

  // 2. Chạy ván đấu và đối soát kết quả
  const result = playFn(amount, round.serverSeed, round.clientSeed ?? '', round.nonce);

  // 3. Nếu thắng: cộng tiền thưởng theo tỷ lệ trả thưởng
  let newBalance = betEntry.newBalance;
  if (result.winAmount > 0) {
    const winEntry = await executeLedgerEntry({ userId, type: 'win', amount: result.winAmount, game: gameId, metadata: { roundId, result } });
    newBalance = winEntry.newBalance;
  }

  await prisma.bet.create({
    data: { userId, game: gameId, betAmount: amount, betData: { amount }, result: result.result, payout: result.payout, serverSeedHash: round.serverSeedHash, clientSeed: round.clientSeed, nonce: round.nonce },
  });

  return { roundId, ...result, balance: newBalance, serverSeedHash: round.serverSeedHash };
}

export async function playThreeCardPokerGame(userId: string, amount: number, clientSeed?: string) {
  return playPokerStyleGame(userId, 'threecard', amount, playThreeCardPoker, clientSeed);
}

export async function playCaribbeanStudGame(userId: string, amount: number, clientSeed?: string) {
  return playPokerStyleGame(userId, 'caribbean', amount, playCaribbeanStud, clientSeed);
}

export async function playNiuNiuGame(userId: string, amount: number, clientSeed?: string) {
  return playPokerStyleGame(userId, 'niuniu', amount, playNiuNiu, clientSeed);
}

export async function playTexasHoldemGame(userId: string, amount: number, clientSeed?: string) {
  return playPokerStyleGame(userId, 'texasholdem', amount, playTexasHoldem, clientSeed);
}

export async function playRussianPokerGame(userId: string, amount: number, clientSeed?: string) {
  return playPokerStyleGame(userId, 'russianpoker', amount, playRussianPoker, clientSeed);
}
