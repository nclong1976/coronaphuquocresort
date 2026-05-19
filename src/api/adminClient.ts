import { resolveApiBase } from './resolveApiBase';

const API_BASE = resolveApiBase();

function getToken(): string | null {
  return sessionStorage.getItem('casino_token');
}

export async function adminApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new Error('Unauthorized');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data as T;
}

export const admin = {
  getUser: (userId: string) =>
    adminApi<{ user: any; transactions: any[]; loginHistory: any[] }>(`/api/admin/users/${userId}`),
  users: (params?: { search?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    return adminApi<{ users: any[]; total: number }>(`/api/admin/users?${q}`);
  },
  transactions: (params?: { userId?: string; type?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.userId) q.set('userId', params.userId);
    if (params?.type) q.set('type', params.type);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    return adminApi<{ feed: any[]; total: number }>(`/api/admin/transactions?${q}`);
  },
  superEraseFeedItem: (body: { kind: 'ledger' | 'audit'; id: string; superPassword: string }) =>
    adminApi<{ success: boolean }>('/api/admin/super/erase-feed-item', { method: 'POST', body: JSON.stringify(body) }),
  superPatchLedger: (body: { id: string; superPassword: string; amount?: number; type?: string }) =>
    adminApi<{ success: boolean; newBalance?: number }>('/api/admin/super/patch-ledger', { method: 'POST', body: JSON.stringify(body) }),
  deposits: (status?: string) => adminApi<{ deposits: any[] }>(`/api/admin/deposits?status=${status || 'pending'}`),
  withdraws: (status?: string) => adminApi<{ withdraws: any[] }>(`/api/admin/withdraws?status=${status || 'pending'}`),
  approveDeposit: (id: string, adminNote?: string) =>
    adminApi<{ success: boolean }>('/api/admin/deposit/approve', { method: 'POST', body: JSON.stringify({ id, adminNote }) }),
  rejectDeposit: (id: string, adminNote?: string) =>
    adminApi<{ success: boolean }>('/api/admin/deposit/reject', { method: 'POST', body: JSON.stringify({ id, adminNote }) }),
  approveWithdraw: (id: string, adminNote?: string) =>
    adminApi<{ success: boolean }>('/api/admin/withdraw/approve', { method: 'POST', body: JSON.stringify({ id, adminNote }) }),
  rejectWithdraw: (id: string, adminNote?: string) =>
    adminApi<{ success: boolean }>('/api/admin/withdraw/reject', { method: 'POST', body: JSON.stringify({ id, adminNote }) }),
  banUser: (userId: string, banned: boolean) =>
    adminApi<{ success: boolean }>('/api/admin/user/ban', { method: 'POST', body: JSON.stringify({ userId, banned }) }),
  adjustBalance: (
    userId: string,
    amount: number,
    type: 'add' | 'subtract',
    opts?: { note?: string; adjustReason?: string }
  ) =>
    adminApi<{ success: boolean; newBalance: number }>('/api/admin/user/adjust-balance', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        amount,
        type,
        note: opts?.note,
        adjustReason: opts?.adjustReason,
      }),
    }),
  getUserBets: (userId: string, limit = 80) =>
    adminApi<{ bets: any[] }>(`/api/admin/users/${userId}/bets?limit=${limit}`),
  changePassword: (userId: string, newPassword: string) =>
    adminApi<{ success: boolean }>('/api/admin/user/change-password', {
      method: 'POST',
      body: JSON.stringify({ userId, newPassword }),
    }),
  deleteUser: (userId: string) =>
    adminApi<{ success: boolean }>('/api/admin/user/delete', { method: 'POST', body: JSON.stringify({ userId }) }),
  setGameEnabled: (gameId: string, enabled: boolean) =>
    adminApi<{ success: boolean }>('/api/admin/game/enable', { method: 'POST', body: JSON.stringify({ gameId, enabled }) }),
  games: () =>
    adminApi<{
      games: Array<{
        gameId: string;
        enabled: boolean;
        minBet: number;
        maxBet: number;
        payoutBoost?: boolean;
        count?: number;
        totalBet?: number;
        totalPayout?: number;
      }>;
    }>('/api/admin/games'),
  updateGameSettings: (
    gameId: string,
    data: { enabled?: boolean; minBet?: number; maxBet?: number; payoutBoost?: boolean }
  ) =>
    adminApi<{ success: boolean }>('/api/admin/games/update-settings', {
      method: 'POST',
      body: JSON.stringify({ gameId, ...data }),
    }),
  applyPayoutBulk: (body: {
    gameId: string;
    replaceAll?: boolean;
    entries: Array<{ optionKey: string; ratio: number; startTime?: string; endTime?: string; weekdays?: number[] }>;
  }) =>
    adminApi<{ success: boolean }>('/api/admin/games/payout-config/bulk', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  payoutConfigs: () =>
    adminApi<{
      configs: Array<{
        id: string;
        gameId: string;
        optionKey: string;
        ratio: number;
        startTime: string;
        endTime: string;
        weekdays?: number[] | null;
        weekdaysSig?: string;
      }>;
    }>('/api/admin/games/payout-configs'),
  payoutLive: () =>
    adminApi<{
      serverTime: string;
      isoWeekday: number;
      sicbo: {
        BIG: number;
        SMALL: number;
        payoutBoost: boolean;
        activeWindow: { startTime: string; endTime: string; weekdays: number[] | null } | null;
        serverTime: string;
        isoWeekday: number;
      };
      tigerbaccarat: { PLAYER: number; BANKER: number; TIE: number };
      dragontiger: { DRAGON: number; TIGER: number; TIE: number };
      baicao: { PLAYER: number; BANKER: number; TIE: number };
    }>('/api/admin/games/payout-live'),
  savePayoutConfig: (gameId: string, optionKey: string, ratio: number, startTime: string, endTime: string, weekdays?: number[]) =>
    adminApi<{ success: boolean }>('/api/admin/games/payout-config', {
      method: 'POST',
      body: JSON.stringify({ gameId, optionKey, ratio, startTime, endTime, weekdays }),
    }),
  sendBroadcast: (
    content: string,
    opts?: { attachmentUrl?: string; attachmentType?: string }
  ) =>
    adminApi<{ success: boolean }>('/api/admin/chat/broadcast', {
      method: 'POST',
      body: JSON.stringify({
        content,
        attachmentUrl: opts?.attachmentUrl,
        attachmentType: opts?.attachmentType,
      }),
    }),
  sendDirectMessage: (
    targetUserId: string,
    content: string,
    opts?: { attachmentUrl?: string; attachmentType?: string }
  ) =>
    adminApi<{ success: boolean }>('/api/admin/chat/direct', {
      method: 'POST',
      body: JSON.stringify({
        targetUserId,
        content,
        attachmentUrl: opts?.attachmentUrl,
        attachmentType: opts?.attachmentType,
      }),
    }),
  stats: () => adminApi<{ users: number; transactions: number; bets: number; totalDeposits: number; totalWithdraws: number; todayBets?: number; todayPayouts?: number; todayProfit?: number; betByGame?: any[] }>('/api/admin/stats'),
  saveSiteContent: (entries: Record<string, string>) =>
    adminApi<{ success: boolean }>('/api/admin/site-content', { method: 'POST', body: JSON.stringify({ entries }) }),
  staffManagers: () =>
    adminApi<{
      managers: Array<{
        id: string;
        username: string;
        email: string;
        fullName: string;
        role: string;
        isBanned: boolean;
        createdAt: string;
      }>;
    }>('/api/admin/super/staff-managers'),
  promoteManager: (username: string) =>
    adminApi<{ success: boolean }>('/api/admin/super/promote-manager', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),
  demoteManager: (userId: string) =>
    adminApi<{ success: boolean }>('/api/admin/super/demote-manager', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  promoteAssistant: (username: string) =>
    adminApi<{ success: boolean }>('/api/admin/super/promote-assistant', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),
};
