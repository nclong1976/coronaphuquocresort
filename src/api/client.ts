import { resolveApiBase } from './resolveApiBase';

const API_BASE = resolveApiBase();

function getToken(): string | null {
  return sessionStorage.getItem('casino_token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data as T;
}

export const authApi = {
  register: (email: string, username: string, fullName: string, password: string) =>
    api<{ user: { id: string; email: string; username: string; fullName: string }; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, fullName, password }),
    }),
  login: (emailOrUsername: string, password: string) =>
    api<{ user: { id: string; email: string; username: string; fullName: string; role?: string }; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emailOrUsername, password }),
    }),
  me: () => api<{ user: { id: string; email: string; username: string; fullName: string; balance: number; bankName?: string; bankAccountNumber?: string } }>('/api/auth/me'),
  updateBank: (bankName: string, bankAccountNumber: string, withdrawPassword: string) =>
    api<{ success: boolean }>('/api/auth/user/bank', {
      method: 'PUT',
      body: JSON.stringify({ bankName, bankAccountNumber, withdrawPassword }),
    }),
};

export const walletApi = {
  getBalance: () => api<{ balance: number }>('/api/wallet'),
  sync: () => api<{ balance: number }>('/api/wallet/sync', { method: 'POST', body: '{}' }),
  depositRequest: (amount: number, method?: string, reference?: string) =>
    api<{ id: string; amount: number; status: string; message: string }>('/api/wallet/deposit-request', {
      method: 'POST',
      body: JSON.stringify({ amount, method, reference }),
    }),
  withdrawRequest: (amount: number, bankInfo?: object) =>
    api<{ id: string; amount: number; status: string; message: string }>('/api/wallet/withdraw-request', {
      method: 'POST',
      body: JSON.stringify({ amount, bankInfo }),
    }),
  getDepositRequests: () => api<{ requests: Array<{ id: string; amount: number; status: string; createdAt: string }> }>('/api/wallet/deposit-requests'),
  getWithdrawRequests: () => api<{ requests: Array<{ id: string; amount: number; status: string; createdAt: string }> }>('/api/wallet/withdraw-requests'),
};

export type SicBoMeta = {
  payoutBoost: boolean;
  activeWindow: { startTime: string; endTime: string; weekdays?: number[] | null } | null;
  serverTime: string;
  isoWeekday?: number;
};

export type GameCatalogPayload = {
  updatedAt: number;
  games: Array<{
    gameId: string;
    enabled: boolean;
    minBet: number;
    maxBet: number;
    payoutBoost: boolean;
  }>;
  sicboPayout: { BIG: number; SMALL: number };
  sicboMeta?: SicBoMeta;
};

export type SicBoPayoutResponse = {
  BIG: number;
  SMALL: number;
  payoutBoost?: boolean;
  activeWindow?: { startTime: string; endTime: string; weekdays?: number[] | null } | null;
  serverTime?: string;
  isoWeekday?: number;
};

export const gameApi = {
  /** Cấu hình game + Sic Bo payout (cùng shape với socket `game_config_updated`). */
  gameCatalog: () => api<GameCatalogPayload>('/api/games/catalog'),
  sicboPayout: () => api<SicBoPayoutResponse>('/api/games/sicbo/payout'),
  sicboState: () =>
    api<{ roundId: string; phase: string; timeLeft: number; elapsed: number; serverTime: number }>('/api/games/sicbo/state'),
  sicboMyPending: () =>
    api<{ hasPending: boolean; roundId: string; bets?: { BIG: number; SMALL: number } }>('/api/games/sicbo/my-pending'),
  sicbo: (bets: { BIG?: number; SMALL?: number }, clientSeed?: string) =>
    api<{ status: string; roundId?: string; balance?: number; timeLeft?: number }>('/api/games/sicbo', {
      method: 'POST',
      body: JSON.stringify({ bets, clientSeed }),
    }),
  sicboResult: (roundId: string) =>
    api<{ status: string; dice?: number[]; sum?: number; result?: string; winAmount?: number; balance?: number }>(
      `/api/games/sicbo/result?roundId=${encodeURIComponent(roundId)}`
    ),
  baccarat: (bets: { PLAYER?: number; BANKER?: number; TIE?: number }, clientSeed?: string) =>
    api<{ playerCards: number[]; bankerCards: number[]; playerScore: number; bankerScore: number; result: string; winAmount: number; balance: number }>('/api/games/baccarat', {
      method: 'POST',
      body: JSON.stringify({ bets, clientSeed }),
    }),
  dragontiger: (bets: { DRAGON?: number; TIGER?: number; TIE?: number }, clientSeed?: string) =>
    api<{ dragonCard: number; tigerCard: number; result: string; winAmount: number; balance: number }>('/api/games/dragontiger', {
      method: 'POST',
      body: JSON.stringify({ bets, clientSeed }),
    }),
  roulette: (bets: { RED?: number; BLACK?: number }, clientSeed?: string) =>
    api<{ number: number; isRed: boolean; winAmount: number; balance: number }>('/api/games/roulette', {
      method: 'POST',
      body: JSON.stringify({ bets, clientSeed }),
    }),
  blackjack: (amount: number, clientSeed?: string) =>
    api<{ playerCards: number[]; dealerCards: number[]; playerScore: number; dealerScore: number; result: string; winAmount: number; balance: number }>('/api/games/blackjack', {
      method: 'POST',
      body: JSON.stringify({ amount, clientSeed }),
    }),
  slot: (amount: number, clientSeed?: string) =>
    api<{ symbols: number[]; winAmount: number; balance: number }>('/api/games/slot', {
      method: 'POST',
      body: JSON.stringify({ amount, clientSeed }),
    }),
  tigerbaccarat: (bets: { PLAYER?: number; BANKER?: number; TIE?: number }, clientSeed?: string) =>
    api<{ playerCards: number[]; bankerCards: number[]; playerScore: number; bankerScore: number; result: string; winAmount: number; balance: number }>('/api/games/tigerbaccarat', {
      method: 'POST',
      body: JSON.stringify({ bets, clientSeed }),
    }),
  baccaratlongho: (bets: { DRAGON?: number; TIGER?: number; TIE?: number }, clientSeed?: string) =>
    api<{ dragonCard: number; tigerCard: number; result: string; winAmount: number; balance: number }>('/api/games/baccaratlongho', {
      method: 'POST',
      body: JSON.stringify({ bets, clientSeed }),
    }),
  baicao: (bets: { PLAYER?: number; BANKER?: number; TIE?: number }, clientSeed?: string) =>
    api<{ playerCards: number[]; bankerCards: number[]; playerScore: number; bankerScore: number; result: string; winAmount: number; balance: number }>('/api/games/baicao', {
      method: 'POST',
      body: JSON.stringify({ bets, clientSeed }),
    }),
  threecard: (amount: number, clientSeed?: string) =>
    api<{ playerCards: number[]; dealerCards: number[]; result: string; winAmount: number; balance: number }>('/api/games/threecard', {
      method: 'POST',
      body: JSON.stringify({ amount, clientSeed }),
    }),
  caribbean: (amount: number, clientSeed?: string) =>
    api<{ playerCards: number[]; dealerCards: number[]; result: string; winAmount: number; balance: number }>('/api/games/caribbean', {
      method: 'POST',
      body: JSON.stringify({ amount, clientSeed }),
    }),
  niuniu: (amount: number, clientSeed?: string) =>
    api<{ playerCards: number[]; bankerCards: number[]; playerNiu: number; bankerNiu: number; result: string; winAmount: number; balance: number }>('/api/games/niuniu', {
      method: 'POST',
      body: JSON.stringify({ amount, clientSeed }),
    }),
  texasholdem: (amount: number, clientSeed?: string) =>
    api<{ playerCards: number[]; communityCards: number[]; result: string; winAmount: number; balance: number }>('/api/games/texasholdem', {
      method: 'POST',
      body: JSON.stringify({ amount, clientSeed }),
    }),
  russianpoker: (amount: number, clientSeed?: string) =>
    api<{ playerCards: number[]; dealerCards: number[]; result: string; winAmount: number; balance: number }>('/api/games/russianpoker', {
      method: 'POST',
      body: JSON.stringify({ amount, clientSeed }),
    }),
};

export const supportApi = {
  getTickets: () => api<{ tickets: Array<{ id: string; subject?: string; status: string; messages: any[] }> }>('/api/support/tickets'),
  createTicket: (subject?: string) =>
    api<{ ticket: { id: string } }>('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject: subject || 'Support' }),
    }),
  /** dataUrl: data:image/jpeg;base64,... — server lưu file và trả URL tuyệt đối */
  uploadSupportImage: (dataUrl: string) =>
    api<{ url: string; attachmentType: string }>('/api/support/upload-image', {
      method: 'POST',
      body: JSON.stringify({ dataUrl }),
    }),
  /** Admin: ảnh / video / pdf / doc / zip — data URL */
  uploadSupportMedia: (dataUrl: string) =>
    api<{ url: string; attachmentType: string }>('/api/support/upload-media', {
      method: 'POST',
      body: JSON.stringify({ dataUrl }),
    }),
  sendMessage: (
    ticketId: string,
    content: string,
    opts?: { attachmentUrl?: string; attachmentType?: string }
  ) =>
    api<{ message: any }>('/api/support/message', {
      method: 'POST',
      body: JSON.stringify({
        ticketId,
        content,
        ...(opts?.attachmentUrl
          ? { attachmentUrl: opts.attachmentUrl, attachmentType: opts.attachmentType || 'image' }
          : {}),
      }),
    }),
};

export const transactionApi = {
  list: (limit?: number, offset?: number) =>
    api<{ transactions: Array<Record<string, unknown>> }>(`/api/transactions?limit=${limit ?? 50}&offset=${offset ?? 0}`),
};

export const betsApi = {
  list: (game?: string, limit?: number) =>
    api<{ bets: Array<{ id: string; game: string; roundId?: string | null; betAmount: number; betData: Record<string, number>; result: string | null; payout: number; createdAt: string }> }>(
      `/api/wallet/bets?game=${game ?? ''}&limit=${limit ?? 15}`
    ),
};
