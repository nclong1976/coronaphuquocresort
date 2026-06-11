/**
 * Sic Bo Round-based Service
 *
 * Quy tắc:
 * - 4:59 → 0:01: Bát úp, đặt cược (chỉ khấu trừ, chưa trả thưởng)
 * - 0:00: Mở bát, hiệu ứng, âm thanh → Trả thưởng CHỈ khi kết quả trùng ô cược
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { executeLedgerEntry, executeLedgerEntryInTx, getBalance, TxClient } from '../ledger/walletService.js';
import { hashServerSeed } from '../rng/provablyFair.js';
import { playSicBo } from '../engine/sicBoEngine.js';
import { isGameEnabled, getGameLimits } from './gameConfigService.js';
import { getSicBoPayoutSnapshot } from './payoutConfigService.js';
import { getSocketIo } from './socketHub.js';

const prisma = new PrismaClient();

const CYCLE_MS = 299_000; // 5 minutes per round
const BETTING_END_MS = 289_000; // 4 minutes 49 seconds betting, 10 seconds reveal/shake

function getCurrentRoundId(): string {
  return `sicbo_${Math.floor(Date.now() / CYCLE_MS)}`;
}

function getRoundNum(roundId: string): number {
  const m = roundId.match(/sicbo_(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function getElapsedInRound(): number {
  return Date.now() % CYCLE_MS;
}

function isBettingOpen(): boolean {
  return getElapsedInRound() < BETTING_END_MS;
}

function parseBetAmount(val: unknown): number {
  const n = typeof val === 'number' ? val : parseFloat(String(val ?? 0));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Tính toán trả thưởng khi có tỷ lệ ưu đãi (Arbitrage-friendly). */
function calculatePayout(betAmount: number, odds: number): number {
  return betAmount * odds;
}

async function validateGameBet(totalBet: number) {
  if (!Number.isFinite(totalBet) || totalBet <= 0) throw new Error('Invalid bet amount');
  const enabled = await isGameEnabled('sicbo');
  if (!enabled) throw new Error('Game is disabled');
  const { minBet, maxBet } = await getGameLimits('sicbo');
  if (totalBet < minBet) throw new Error(`Minimum bet is ${minBet}`);
  if (totalBet > maxBet) throw new Error(`Maximum bet is ${maxBet}`);
}

async function getOrCreateRoundSeed(roundId: string, clientSeed?: string) {
  return prisma.$transaction(async (tx) => {
    let round = await tx.roundSeed.findUnique({ where: { roundId } });
    if (!round) {
      const serverSeed = crypto.randomBytes(32).toString('hex');
      const serverSeedHash = hashServerSeed(serverSeed);
      round = await tx.roundSeed.create({
        data: {
          game: 'sicbo',
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

/** Đặt cược - chỉ khấu trừ, chưa trả thưởng. Trả thưởng khi ván kết thúc (0:00). */
export async function placeSicBoBet(userId: string, bets: { BIG?: number; SMALL?: number }, clientSeed?: string) {
  if (!isBettingOpen()) {
    throw new Error('Đã hết thời gian đặt cược. Vui lòng chờ ván mới.');
  }

  const roundId = getCurrentRoundId();
  const safeBets = { BIG: parseBetAmount(bets?.BIG), SMALL: parseBetAmount(bets?.SMALL) };
  const totalBet = safeBets.BIG + safeBets.SMALL;

  await validateGameBet(totalBet);

  const balance = await getBalance(userId);
  if (balance < totalBet) throw new Error('Insufficient balance');

  const round = await getOrCreateRoundSeed(roundId, clientSeed);

  const roundNum = getRoundNum(roundId);
  const sicSnapPlace = await getSicBoPayoutSnapshot(new Date(roundNum * CYCLE_MS + 10000));
  const ratioBIG = sicSnapPlace.BIG;
  const ratioSMALL = sicSnapPlace.SMALL;

  const betEntry = await executeLedgerEntry({
    userId,
    type: 'bet',
    amount: totalBet,
    game: 'sicbo',
    metadata: { roundId, bets: safeBets },
  });
  if (!betEntry.success) throw new Error(betEntry.error ?? 'Bet failed');

  const betDataWithRatios = {
    ...safeBets,
    ratioBIG,
    ratioSMALL,
  };

  await prisma.bet.create({
    data: {
      userId,
      game: 'sicbo',
      roundId,
      betAmount: totalBet,
      betData: betDataWithRatios as object,
      result: null,
      payout: 0,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
    },
  });
  // Không tăng nonce - cả ván dùng chung 1 kết quả xúc xắc

  return {
    status: 'bet_placed',
    roundId,
    balance: betEntry.newBalance,
    timeLeft: Math.ceil((BETTING_END_MS - getElapsedInRound()) / 1000),
  };
}

/** Lấy kết quả ván - khi 0:00, resolve và trả thưởng nếu đúng ô cược. */
export async function getSicBoRoundResult(userId: string, roundId: string) {
  const roundNum = getRoundNum(roundId);
  const currentRoundNum = Math.floor(Date.now() / CYCLE_MS);

  if (currentRoundNum < roundNum) {
    return { status: 'pending', message: 'Ván chưa bắt đầu' };
  }

  const elapsed = getElapsedInRound();
  if (currentRoundNum === roundNum && elapsed < BETTING_END_MS) {
    return { status: 'betting', timeLeft: Math.ceil((BETTING_END_MS - elapsed) / 1000) };
  }

  // Cho phép settle ngay khi hết thời gian cược (elapsed >= BETTING_END_MS) - tránh mất tiền khi chuyển ván
  const round = await getOrCreateRoundSeed(roundId);
  const allPending = await prisma.bet.findMany({
    where: { game: 'sicbo', roundId, result: null },
  });

  const result = playSicBo({ BIG: 0, SMALL: 0 }, round.serverSeed, round.clientSeed ?? '', round.nonce);

  const sicSnap = await getSicBoPayoutSnapshot(new Date(roundNum * CYCLE_MS + 10000));
  const fallbackRatioBig = sicSnap.BIG;
  const fallbackRatioSmall = sicSnap.SMALL;

  const winsByUser = new Map<string, number>();

  if (allPending.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const bet of allPending) {
        const b = bet.betData as { BIG?: number; SMALL?: number; ratioBIG?: number; ratioSMALL?: number };
        const taiBet = parseBetAmount(b?.BIG);
        const xiuBet = parseBetAmount(b?.SMALL);
        const oddsBIG = b?.ratioBIG ?? fallbackRatioBig;
        const oddsSMALL = b?.ratioSMALL ?? fallbackRatioSmall;
        const totalBet = taiBet + xiuBet;

        const hasBoth = taiBet > 0 && xiuBet > 0;

        let winAmount = 0;
        let lossAmount = 0;

        if (result.result === 'BIG') {
          if (taiBet > 0) winAmount = calculatePayout(taiBet, oddsBIG);
          if (xiuBet > 0) lossAmount = xiuBet;
        } else {
          if (xiuBet > 0) winAmount = calculatePayout(xiuBet, oddsSMALL);
          if (taiBet > 0) lossAmount = taiBet;
        }

        const grossWin = winAmount;
        const netPayout = grossWin - totalBet;

        winsByUser.set(bet.userId, (winsByUser.get(bet.userId) ?? 0) + grossWin);

        await tx.bet.update({
          where: { id: bet.id },
          data: { result: result.result, payout: netPayout },
        });

        if (grossWin > 0) {
          const wallet = await tx.wallet.findUnique({ where: { userId: bet.userId } });
          const balanceBefore = wallet ? Number(wallet.balance) : 0;
          const entry = await executeLedgerEntryInTx(tx as TxClient, {
            userId: bet.userId,
            type: 'win',
            amount: grossWin,
            game: 'sicbo',
            metadata: {
              roundId,
              result: result.result,
              dice: result.dice,
              hasBothTaiXiu: hasBoth,
              winAmount: grossWin,
              lossAmount,
              balance_before: balanceBefore,
              balance_after: balanceBefore + grossWin,
            },
          });
          if (!entry.success) throw new Error(entry.error ?? 'Settlement failed');
        }
      }
    });

    // Phát tín hiệu số dư mới cho toàn bộ người chơi tham gia ván đấu này
    const io = getSocketIo();
    if (io) {
      for (const [uid, gw] of winsByUser.entries()) {
        if (gw > 0) {
          getBalance(uid).then((bal) => {
            io.to(`user:${uid}`).emit('balance_updated', {
              balance: bal,
              type: 'win',
              amount: gw,
              game: 'sicbo',
            });
          }).catch(() => {});
        }
      }
    }
  }

  // Luôn tìm các cược của chính user này trong ván đó (để biết winAmount thực tế của user)
  const userBets = await prisma.bet.findMany({
    where: { userId, game: 'sicbo', roundId },
  });

  let winAmount = 0;
  for (const bet of userBets) {
    if (bet.result !== null) {
      const betVal = Number(bet.betAmount);
      const payVal = Number(bet.payout);
      const gross = payVal + betVal;
      if (gross > 0) {
        winAmount += gross;
      }
    }
  }

  const balance = await getBalance(userId);

  return {
    status: 'resolved',
    roundId,
    dice: result.dice,
    sum: result.sum,
    result: result.result,
    winAmount,
    balance,
    serverSeedHash: round.serverSeedHash,
  };
}

export function getSicBoRoundState() {
  const roundId = getCurrentRoundId();
  const elapsed = getElapsedInRound();
  const timeLeft = Math.ceil((BETTING_END_MS - elapsed) / 1000);
  const phase = elapsed < BETTING_END_MS ? 'betting' : elapsed < CYCLE_MS ? 'revealing' : 'resetting';
  return { roundId, phase, timeLeft: Math.max(0, timeLeft), elapsed };
}
