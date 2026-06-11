export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  isBanned: boolean;
  balance?: number;
  createdAt: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  user?: { email: string; username: string };
  type: string;
  amount: number;
  game?: string;
  createdAt: string;
}

export interface Deposit {
  id: string;
  userId: string;
  user?: { email: string; username: string; fullName: string };
  amount: number;
  method?: string;
  reference?: string;
  status: string;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  user?: { email: string; username: string; fullName: string };
  amount: number;
  bankInfo?: object;
  status: string;
  createdAt: string;
}

export interface GameConfig {
  gameId: string;
  enabled: boolean;
  minBet: number;
  maxBet: number;
  payoutBoost?: boolean;
  count?: number;
  totalBet?: number;
  totalPayout?: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  user?: { id: string; username: string; email: string };
  subject?: string;
  status: string;
  messages: SupportMessage[];
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderRole: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
}

export interface DashboardStats {
  users: number;
  transactions: number;
  bets: number;
  totalDeposits: number;
  totalWithdraws: number;
  todayBets: number;
  todayPayouts: number;
  todayProfit: number;
  todayDeposits: number;
  todayWithdraws: number;
  betByGame?: { game: string; count: number; totalBet: number }[];
}
