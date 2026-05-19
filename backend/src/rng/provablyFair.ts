import crypto from 'crypto';

/**
 * Provably Fair RNG using SHA-256
 * Result = sha256(server_seed + client_seed + nonce)
 * server_seed hash is published before round, revealed after for verification
 */
export interface SeedData {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashServerSeed(serverSeed: string): string {
  return crypto.createHash('sha256').update(serverSeed).digest('hex');
}

export function generateSeeds(clientSeed?: string): SeedData {
  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);
  const seed = clientSeed || crypto.randomBytes(16).toString('hex');
  return {
    serverSeed,
    serverSeedHash,
    clientSeed: seed,
    nonce: 0,
  };
}

/**
 * Get deterministic number from [0, max) using provably fair hash
 */
export function getFairNumber(serverSeed: string, clientSeed: string, nonce: number, max: number): number {
  const hash = crypto
    .createHash('sha256')
    .update(`${serverSeed}:${clientSeed}:${nonce}`)
    .digest('hex');
  const value = parseInt(hash.substring(0, 8), 16);
  return value % max;
}

/**
 * Get multiple dice values 1-6 for Sic Bo
 */
export function getSicBoDice(serverSeed: string, clientSeed: string, nonce: number): [number, number, number] {
  const d1 = getFairNumber(serverSeed, clientSeed, nonce, 6) + 1;
  const d2 = getFairNumber(serverSeed, clientSeed, nonce + 1, 6) + 1;
  const d3 = getFairNumber(serverSeed, clientSeed, nonce + 2, 6) + 1;
  return [d1, d2, d3];
}

/**
 * Get Baccarat card value (1-13, J/Q/K=10)
 */
export function getBaccaratCard(serverSeed: string, clientSeed: string, nonce: number): number {
  const v = getFairNumber(serverSeed, clientSeed, nonce, 13) + 1;
  return v > 10 ? 0 : v; // J,Q,K = 0 in baccarat
}

/**
 * Get Roulette number 0-36
 */
export function getRouletteNumber(serverSeed: string, clientSeed: string, nonce: number): number {
  return getFairNumber(serverSeed, clientSeed, nonce, 37);
}

/**
 * Get Blackjack card 1-13 (A=1, 2-10, J/Q/K=10)
 */
export function getBlackjackCard(serverSeed: string, clientSeed: string, nonce: number): number {
  const v = getFairNumber(serverSeed, clientSeed, nonce, 13) + 1;
  return v > 10 ? 10 : v;
}

/**
 * Get Slot symbol index 0 to symbolsLength-1
 */
export function getSlotSymbol(serverSeed: string, clientSeed: string, nonce: number, symbolsLength: number): number {
  return getFairNumber(serverSeed, clientSeed, nonce, symbolsLength);
}
