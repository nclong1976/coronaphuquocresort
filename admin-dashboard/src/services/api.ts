const raw = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
const API_BASE = (raw.trim() !== '' ? raw.replace(/\/$/, '') : 'http://localhost:4000');

function getToken(): string | null {
  return localStorage.getItem('admin_token');
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

  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export async function login(email: string, password: string) {
  const res = await api<{ user: { id: string; email: string; role?: string }; token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if ((res.user as any).role !== 'admin') throw new Error('Admin access required');
  localStorage.setItem('admin_token', res.token);
  return res;
}

export function logout() {
  localStorage.removeItem('admin_token');
}

export const adminApi = {
  stats: () => api<import('../types').DashboardStats>('/api/admin/stats'),
  users: (params?: { search?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    return api<{ users: import('../types').User[]; total: number }>(`/api/admin/users?${q}`);
  },
  user: (id: string) =>
    api<{
      user: import('../types').User;
      transactions: import('../types').Transaction[];
      loginHistory: { ip?: string; userAgent?: string; createdAt: string }[];
    }>(`/api/admin/users/${id}`),
  banUser: (userId: string, banned: boolean) =>
    api<{ success: boolean }>('/api/admin/user/ban', { method: 'POST', body: JSON.stringify({ userId, banned }) }),
  unbanUser: (userId: string) =>
    api<{ success: boolean }>('/api/admin/users/unban', { method: 'POST', body: JSON.stringify({ userId }) }),

  transactions: (params?: { userId?: string; type?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.userId) q.set('userId', params.userId);
    if (params?.type) q.set('type', params.type);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    return api<{ feed: unknown[]; total: number }>(`/api/admin/transactions?${q}`);
  },

  deposits: (status?: string) =>
    api<{ deposits: import('../types').Deposit[] }>(`/api/admin/deposits?status=${status || 'pending'}`),
  approveDeposit: (id: string, adminNote?: string) =>
    api<{ success: boolean }>('/api/admin/deposit/approve', { method: 'POST', body: JSON.stringify({ id, adminNote }) }),
  rejectDeposit: (id: string, adminNote?: string) =>
    api<{ success: boolean }>('/api/admin/deposit/reject', { method: 'POST', body: JSON.stringify({ id, adminNote }) }),

  withdrawals: (status?: string) =>
    api<{ withdrawals: import('../types').Withdrawal[] }>(`/api/admin/withdrawals?status=${status || 'pending'}`),
  approveWithdraw: (id: string, adminNote?: string) =>
    api<{ success: boolean }>('/api/admin/withdraw/approve', { method: 'POST', body: JSON.stringify({ id, adminNote }) }),
  rejectWithdraw: (id: string, adminNote?: string) =>
    api<{ success: boolean }>('/api/admin/withdraw/reject', { method: 'POST', body: JSON.stringify({ id, adminNote }) }),

  games: () => api<{ games: import('../types').GameConfig[] }>('/api/admin/games'),
  updateGame: (gameId: string, data: { enabled?: boolean; minBet?: number; maxBet?: number; payoutBoost?: boolean }) =>
    api<{ success: boolean }>('/api/admin/games/update-settings', {
      method: 'POST',
      body: JSON.stringify({ gameId, ...data }),
    }),

  payoutConfigs: () =>
    api<{
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
    api<{
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
  savePayoutConfig: (body: { gameId: string; optionKey: string; ratio: number; startTime?: string; endTime?: string }) =>
    api<{ success: boolean }>('/api/admin/games/payout-config', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  applyPayoutBulk: (body: {
    gameId: string;
    replaceAll?: boolean;
    entries: Array<{ optionKey: string; ratio: number; startTime?: string; endTime?: string; weekdays?: number[] }>;
  }) =>
    api<{ success: boolean }>('/api/admin/games/payout-config/bulk', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  tickets: () => api<{ tickets: import('../types').SupportTicket[] }>('/api/support/tickets'),
  sendMessage: (ticketId: string, content: string) =>
    api<{ message: import('../types').SupportMessage }>('/api/support/message', {
      method: 'POST',
      body: JSON.stringify({ ticketId, content }),
    }),
};
