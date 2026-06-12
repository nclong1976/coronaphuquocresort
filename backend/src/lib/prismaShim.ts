// @ts-nocheck
/**
 * Supabase-backed Prisma-compatible shim
 * Thay thế @prisma/client dùng Supabase REST API qua HTTPS (không cần PostgreSQL trực tiếp)
 * 
 * Import thường: import { PrismaClient } from '@prisma/client'
 * → được resolve tới file này qua tsconfig paths / package.json exports
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[PrismaShim] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const sb: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Helper types & utils
// ---------------------------------------------------------------------------
function toDecimal(v: any) { return v === undefined || v === null ? undefined : Number(v); }
function nowIso() { return new Date().toISOString(); }

function applyWhereFilters(q: any, where: any): any {
  if (!where) return q;
  for (const [key, val] of Object.entries(where)) {
    if (val === undefined || val === null) continue;
    if (typeof val === 'object' && val !== null) {
      for (const [op, opVal] of Object.entries(val)) {
        if (op === 'gte') q = q.gte(key, opVal instanceof Date ? opVal.toISOString() : opVal);
        else if (op === 'gt') q = q.gt(key, opVal instanceof Date ? opVal.toISOString() : opVal);
        else if (op === 'lte') q = q.lte(key, opVal instanceof Date ? opVal.toISOString() : opVal);
        else if (op === 'lt') q = q.lt(key, opVal instanceof Date ? opVal.toISOString() : opVal);
        else if (op === 'in' && Array.isArray(opVal)) q = q.in(key, opVal);
      }
    } else {
      q = q.eq(key, val);
    }
  }
  return q;
}

function parseDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(parseDates);
  }
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (typeof val === 'string' && (key.endsWith('At') || key.endsWith('Date') || key === 'createdAt' || key === 'updatedAt')) {
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
            obj[key] = new Date(val);
          }
        } else if (typeof val === 'object') {
          obj[key] = parseDates(val);
        }
      }
    }
  }
  return obj;
}

/** Throw if Supabase returned an error */
async function check(p: Promise<any>) {
  const r = await p;
  if (r.error) throw new Error(r.error.message ?? JSON.stringify(r.error));
  return parseDates(r.data);
}

// ---------------------------------------------------------------------------
// Fake Prisma.Decimal (just wraps a number)
// ---------------------------------------------------------------------------
class Decimal {
  private _v: number;
  constructor(v: any) { this._v = Number(v); }
  toNumber() { return this._v; }
  toString() { return String(this._v); }
  valueOf() { return this._v; }
}

// ---------------------------------------------------------------------------
// Model delegates
// ---------------------------------------------------------------------------

function applyUserFilters(q: any, where: any): any {
  if (!where) return q;

  if (where.AND && Array.isArray(where.AND)) {
    for (const sub of where.AND) {
      q = applyUserFilters(q, sub);
    }
  }

  if (where.OR && Array.isArray(where.OR)) {
    const orParts: string[] = [];
    for (const sub of where.OR) {
      const key = Object.keys(sub)[0];
      const val = sub[key];
      if (val && typeof val === 'object' && val.contains !== undefined) {
        orParts.push(`${key}.ilike.%${val.contains}%`);
      } else if (typeof val === 'string') {
        orParts.push(`${key}.eq.${val}`);
      }
    }
    if (orParts.length > 0) {
      q = q.or(orParts.join(','));
    }
  }

  if (where.isBanned !== undefined) {
    q = q.eq('isBanned', where.isBanned);
  }

  if (where.role) {
    if (typeof where.role === 'object' && where.role !== null) {
      if (where.role.in) {
        q = q.in('role', where.role.in);
      } else if (where.role.not) {
        q = q.neq('role', where.role.not);
      }
    } else {
      q = q.eq('role', where.role);
    }
  }

  if (where.pendingVipBonusLevel?.not === null) {
    q = q.not('pendingVipBonusLevel', 'is', null);
  }

  if (where.vipBonusDueAt?.lte) {
    q = q.lte('vipBonusDueAt', new Date(where.vipBonusDueAt.lte).toISOString());
  }

  return q;
}

// ---- User ------------------------------------------------------------------
const user = {
  async findUnique({ where, select }: any) {
    let q = sb.from('User').select(select ? Object.keys(select).join(',') : '*');
    if (where.id) q = q.eq('id', where.id);
    if (where.email) q = q.eq('email', where.email);
    if (where.username) q = q.eq('username', where.username);
    const { data, error } = await q.maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async findFirst({ where, select }: any) {
    let q = sb.from('User').select(select ? Object.keys(select).join(',') : '*');
    if (where?.OR) {
      const [a, b] = where.OR;
      const k1 = Object.keys(a)[0], v1 = Object.values(a)[0] as any;
      const k2 = Object.keys(b)[0], v2 = Object.values(b)[0] as any;
      q = q.or(`${k1}.eq.${v1},${k2}.eq.${v2}`);
    }
    if (where?.email?.equals) q = q.ilike('email', where.email.equals);
    if (where?.username?.equals) q = q.ilike('username', where.username.equals);
    if (where?.isBanned !== undefined) q = q.eq('isBanned', where.isBanned);
    const { data, error } = await q.limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async findMany({ where, select, take, skip, orderBy }: any = {}) {
    let q = sb.from('User').select(select ? Object.keys(select).join(',') : '*');
    q = applyUserFilters(q, where);
    if (take) q = q.limit(take);
    if (skip) q = q.range(skip, skip + (take ?? 50) - 1);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async create({ data }: any) {
    const row = { ...data, id: data.id ?? crypto.randomUUID(), createdAt: nowIso() };
    return await check(sb.from('User').insert(row).select().single());
  },
  async update({ where, data }: any) {
    let q = sb.from('User').update(data);
    if (where.id) q = q.eq('id', where.id);
    return await check(q.select().single());
  },
  async count({ where }: any = {}) {
    let q = sb.from('User').select('*', { count: 'exact', head: true });
    q = applyUserFilters(q, where);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};


// ---- Wallet ----------------------------------------------------------------
const wallet = {
  async findUnique({ where }: any) {
    let q = sb.from('Wallet').select('*');
    if (where.userId) q = q.eq('userId', where.userId);
    if (where.id) q = q.eq('id', where.id);
    const { data, error } = await q.maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async findMany({ where }: any = {}) {
    let q = sb.from('Wallet').select('*');
    if (where?.userId) {
      if (where.userId.in && Array.isArray(where.userId.in)) {
        q = q.in('userId', where.userId.in);
      } else if (typeof where.userId === 'string') {
        q = q.eq('userId', where.userId);
      }
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async create({ data }: any) {
    const row = { ...data, id: data.id ?? crypto.randomUUID(), updatedAt: nowIso(), balance: Number(data.balance ?? 0) };
    return await check(sb.from('Wallet').insert(row).select().single());
  },
  async update({ where, data }: any) {
    const payload = { ...data, updatedAt: nowIso() };
    if (payload.balance instanceof Decimal) payload.balance = payload.balance.toNumber();
    if (typeof payload.balance === 'object' && payload.balance?.toNumber) payload.balance = payload.balance.toNumber();
    let q = sb.from('Wallet').update(payload);
    if (where.userId) q = q.eq('userId', where.userId);
    return await check(q.select().single());
  },
};

// ---- Transaction -----------------------------------------------------------
const transaction = {
  async create({ data }: any) {
    const row = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
      createdAt: nowIso(),
      amount: Number(data.amount),
      previousBalance: Number(data.previousBalance),
      currentBalance: Number(data.currentBalance),
    };
    return await check(sb.from('Transaction').insert(row).select().single());
  },
  async findMany({ where, select, take, skip, orderBy, include }: any = {}) {
    let sel = select ? Object.keys(select).join(',') : '*';
    if (include?.user) {
      sel = '*, User(email, username)';
    }
    let q = sb.from('Transaction').select(sel);
    if (where?.userId) q = q.eq('userId', where.userId);
    if (where?.type) q = q.eq('type', where.type);
    if (where?.game) q = q.eq('game', where.game);
    if (take) q = q.limit(take);
    if (skip) q = q.range(skip, skip + (take ?? 50) - 1);
    if (orderBy?.createdAt) q = q.order('createdAt', { ascending: orderBy.createdAt === 'asc' });
    else q = q.order('createdAt', { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) => {
      const mapped = { ...row };
      if (row.User) {
        mapped.user = row.User;
        delete mapped.User;
      }
      return mapped;
    });
  },
  async count({ where }: any = {}) {
    let q = sb.from('Transaction').select('*', { count: 'exact', head: true });
    if (where?.userId) q = q.eq('userId', where.userId);
    if (where?.type) q = q.eq('type', where.type);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
  async groupBy({ by, where, _sum }: any = {}) {
    let q = sb.from('Transaction').select('*');
    if (where?.userId) {
      if (where.userId.in && Array.isArray(where.userId.in)) {
        q = q.in('userId', where.userId.in);
      } else if (typeof where.userId === 'string') {
        q = q.eq('userId', where.userId);
      }
    }
    if (where?.type) {
      q = q.eq('type', where.type);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const groups: Record<string, any> = {};
    for (const row of (data ?? [])) {
      const groupKey = by.map((k: string) => row[k]).join('_');
      if (!groups[groupKey]) {
        groups[groupKey] = {
          userId: row.userId,
          _sum: { amount: 0 }
        };
      }
      groups[groupKey]._sum.amount += Number(row.amount ?? 0);
    }
    return Object.values(groups);
  },
  async aggregate({ where, _sum, _count }: any = {}) {
    let q = sb.from('Transaction').select('*');
    q = applyWhereFilters(q, where);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const result: any = {};
    if (_sum) {
      result._sum = {};
      for (const key of Object.keys(_sum)) {
        let sumVal = 0;
        for (const row of (data ?? [])) {
          sumVal += Number(row[key] ?? 0);
        }
        result._sum[key] = sumVal;
      }
    }
    if (_count) {
      result._count = {};
      if (typeof _count === 'boolean' || _count === true) {
        result._count = data?.length ?? 0;
      } else {
        for (const key of Object.keys(_count)) {
          result._count[key] = data?.length ?? 0;
        }
      }
    }
    return result;
  },
};

// ---- Bet -------------------------------------------------------------------
const bet = {
  async create({ data }: any) {
    const row = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
      createdAt: nowIso(),
      betAmount: Number(data.betAmount),
      payout: Number(data.payout),
    };
    return await check(sb.from('Bet').insert(row).select().single());
  },
  async findMany({ where, take, skip, orderBy }: any = {}) {
    let q = sb.from('Bet').select('*');
    if (where?.userId) q = q.eq('userId', where.userId);
    if (where?.game) q = q.eq('game', where.game);
    if (take) q = q.limit(take);
    if (skip) q = q.range(skip, skip + (take ?? 50) - 1);
    q = q.order('createdAt', { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async count({ where }: any = {}) {
    let q = sb.from('Bet').select('*', { count: 'exact', head: true });
    if (where?.userId) q = q.eq('userId', where.userId);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
  async aggregate({ where, _sum, _count }: any = {}) {
    let q = sb.from('Bet').select('*');
    q = applyWhereFilters(q, where);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const result: any = {};
    if (_sum) {
      result._sum = {};
      for (const key of Object.keys(_sum)) {
        let sumVal = 0;
        for (const row of (data ?? [])) {
          sumVal += Number(row[key] ?? 0);
        }
        result._sum[key] = sumVal;
      }
    }
    if (_count) {
      result._count = {};
      if (typeof _count === 'boolean' || _count === true) {
        result._count = data?.length ?? 0;
      } else {
        for (const key of Object.keys(_count)) {
          result._count[key] = data?.length ?? 0;
        }
      }
    }
    return result;
  },
  async groupBy({ by, _count, _sum }: any = {}) {
    let q = sb.from('Bet').select('*');
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const groups: Record<string, any> = {};
    for (const row of (data ?? [])) {
      const groupKey = by.map((k: string) => row[k]).join('_');
      if (!groups[groupKey]) {
        groups[groupKey] = {
          game: row.game,
          _count: { id: 0 },
          _sum: { betAmount: 0, payout: 0 }
        };
      }
      groups[groupKey]._count.id += 1;
      groups[groupKey]._sum.betAmount += Number(row.betAmount ?? 0);
      groups[groupKey]._sum.payout += Number(row.payout ?? 0);
    }
    return Object.values(groups);
  },
};

// ---- RoundSeed -------------------------------------------------------------
const roundSeed = {
  async findUnique({ where }: any) {
    const { data, error } = await sb.from('RoundSeed').select('*').eq('roundId', where.roundId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async create({ data }: any) {
    const row = { ...data, id: data.id ?? crypto.randomUUID(), createdAt: nowIso(), nonce: data.nonce ?? 0 };
    return await check(sb.from('RoundSeed').insert(row).select().single());
  },
  async update({ where, data }: any) {
    return await check(sb.from('RoundSeed').update(data).eq('roundId', where.roundId).select().single());
  },
  async findMany({ where, take, skip, orderBy }: any = {}) {
    let q = sb.from('RoundSeed').select('*');
    if (where?.game) q = q.eq('game', where.game);
    if (take) q = q.limit(take);
    q = q.order('createdAt', { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

// ---- DepositRequest --------------------------------------------------------
const depositRequest = {
  async create({ data }: any) {
    const row = { ...data, id: data.id ?? crypto.randomUUID(), createdAt: nowIso(), amount: Number(data.amount) };
    return await check(sb.from('DepositRequest').insert(row).select().single());
  },
  async findMany({ where, take, skip, orderBy }: any = {}) {
    let q = sb.from('DepositRequest').select('*, User(username, fullName, email)');
    if (where?.userId) q = q.eq('userId', where.userId);
    if (where?.status) q = q.eq('status', where.status);
    if (take) q = q.limit(take);
    if (skip) q = q.range(skip, skip + (take ?? 50) - 1);
    q = q.order('createdAt', { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async findUnique({ where }: any) {
    const { data, error } = await sb.from('DepositRequest').select('*').eq('id', where.id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async update({ where, data }: any) {
    return await check(sb.from('DepositRequest').update(data).eq('id', where.id).select().single());
  },
  async count({ where }: any = {}) {
    let q = sb.from('DepositRequest').select('*', { count: 'exact', head: true });
    if (where?.status) q = q.eq('status', where.status);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};

// ---- WithdrawRequest -------------------------------------------------------
const withdrawRequest = {
  async create({ data }: any) {
    const row = { ...data, id: data.id ?? crypto.randomUUID(), createdAt: nowIso(), amount: Number(data.amount) };
    return await check(sb.from('WithdrawRequest').insert(row).select().single());
  },
  async findMany({ where, take, skip, orderBy }: any = {}) {
    let q = sb.from('WithdrawRequest').select('*, User(username, fullName, email)');
    if (where?.userId) q = q.eq('userId', where.userId);
    if (where?.status) q = q.eq('status', where.status);
    if (take) q = q.limit(take);
    if (skip) q = q.range(skip, skip + (take ?? 50) - 1);
    q = q.order('createdAt', { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async findUnique({ where }: any) {
    const { data, error } = await sb.from('WithdrawRequest').select('*').eq('id', where.id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async update({ where, data }: any) {
    return await check(sb.from('WithdrawRequest').update(data).eq('id', where.id).select().single());
  },
  async count({ where }: any = {}) {
    let q = sb.from('WithdrawRequest').select('*', { count: 'exact', head: true });
    if (where?.status) q = q.eq('status', where.status);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};

// ---- GameConfig ------------------------------------------------------------
const gameConfig = {
  async findUnique({ where }: any) {
    const { data, error } = await sb.from('GameConfig').select('*').eq('gameId', where.gameId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async findMany({ where }: any = {}) {
    let q = sb.from('GameConfig').select('*');
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async upsert({ where, create, update }: any) {
    const existing = await gameConfig.findUnique({ where });
    if (existing) {
      if (Object.keys(update).length === 0) return existing;
      return await check(sb.from('GameConfig').update({ ...update, updatedAt: nowIso() }).eq('gameId', where.gameId).select().single());
    } else {
      const row = { ...create, id: crypto.randomUUID(), updatedAt: nowIso() };
      return await check(sb.from('GameConfig').insert(row).select().single());
    }
  },
  async update({ where, data }: any) {
    return await check(sb.from('GameConfig').update({ ...data, updatedAt: nowIso() }).eq('gameId', where.gameId).select().single());
  },
};

// ---- GamePayoutConfig ------------------------------------------------------
const gamePayoutConfig = {
  async findUnique({ where }: any) {
    let q = sb.from('GamePayoutConfig').select('*');
    if (where.id) {
      q = q.eq('id', where.id);
    } else if (where.gameId_optionKey_startTime_weekdaysSig) {
      const { gameId, optionKey, startTime, weekdaysSig } = where.gameId_optionKey_startTime_weekdaysSig;
      q = q.eq('gameId', gameId)
           .eq('optionKey', optionKey)
           .eq('startTime', startTime)
           .eq('weekdaysSig', weekdaysSig);
    }
    const { data, error } = await q.maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async findFirst({ where }: any = {}) {
    let q = sb.from('GamePayoutConfig').select('*');
    if (where?.id) q = q.eq('id', where.id);
    if (where?.gameId) q = q.eq('gameId', where.gameId);
    const { data, error } = await q.limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async findMany({ where }: any = {}) {
    let q = sb.from('GamePayoutConfig').select('*');
    if (where?.gameId) q = q.eq('gameId', where.gameId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async create({ data }: any) {
    const row = { ...data, id: data.id ?? crypto.randomUUID(), createdAt: nowIso() };
    return await check(sb.from('GamePayoutConfig').insert(row).select().single());
  },
  async deleteMany({ where }: any) {
    let q = sb.from('GamePayoutConfig').delete();
    if (where?.gameId) q = q.eq('gameId', where.gameId);
    if (where?.id) q = q.eq('id', where.id);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { count: 1 };
  },
  async update({ where, data }: any) {
    let q = sb.from('GamePayoutConfig').update(data);
    if (where.id) {
      q = q.eq('id', where.id);
    } else if (where.gameId_optionKey_startTime_weekdaysSig) {
      const { gameId, optionKey, startTime, weekdaysSig } = where.gameId_optionKey_startTime_weekdaysSig;
      q = q.eq('gameId', gameId)
           .eq('optionKey', optionKey)
           .eq('startTime', startTime)
           .eq('weekdaysSig', weekdaysSig);
    }
    return await check(q.select().single());
  },
};

// ---- SupportTicket ---------------------------------------------------------
const supportTicket = {
  async create({ data }: any) {
    let payload = { ...data };
    if (payload.isHidden !== undefined) {
      if (payload.isHidden) {
        payload.subject = '[HIDDEN] ' + (payload.subject || 'Support');
      }
      delete payload.isHidden;
    }
    const row = { ...payload, id: payload.id ?? crypto.randomUUID(), createdAt: nowIso(), updatedAt: nowIso() };
    const res = await check(sb.from('SupportTicket').insert(row).select().single());
    
    const isHidden = res.subject && res.subject.startsWith('[HIDDEN]');
    const subject = isHidden ? res.subject.replace(/^\[HIDDEN\]\s*/, '') : res.subject;
    return { ...res, isHidden, subject };
  },
  async findMany({ where, take, skip, include }: any = {}) {
    let sel = '*';
    if (include) {
      const parts = ['*'];
      if (include.user) parts.push('User(id, username, email)');
      if (include.messages) parts.push('SupportMessage(*)');
      sel = parts.join(',');
    }
    let q = sb.from('SupportTicket').select(sel);
    if (where?.userId) q = q.eq('userId', where.userId);
    if (where?.status) q = q.eq('status', where.status);
    if (take) q = q.limit(take);
    if (skip) q = q.range(skip, skip + (take ?? 50) - 1);
    q = q.order('updatedAt', { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    
    let tickets = (data ?? []).map((row: any) => {
      const isHidden = row.subject && row.subject.startsWith('[HIDDEN]');
      const subject = isHidden ? row.subject.replace(/^\[HIDDEN\]\s*/, '') : row.subject;
      const mapped = { ...row, isHidden, subject };
      if (row.User) {
        mapped.user = row.User;
        delete mapped.User;
      }
      if (row.SupportMessage) {
        mapped.messages = row.SupportMessage;
        delete mapped.SupportMessage;
      }
      return mapped;
    });

    if (where?.isHidden !== undefined) {
      tickets = tickets.filter((t: any) => t.isHidden === where.isHidden);
    }
    return tickets;
  },
  async findUnique({ where, include }: any) {
    let sel = '*';
    if (include) {
      const parts = ['*'];
      if (include.user) parts.push('User(id, username, email)');
      if (include.messages) parts.push('SupportMessage(*)');
      sel = parts.join(',');
    }
    const { data, error } = await sb.from('SupportTicket').select(sel).eq('id', where.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    
    const isHidden = data.subject && data.subject.startsWith('[HIDDEN]');
    const subject = isHidden ? data.subject.replace(/^\[HIDDEN\]\s*/, '') : data.subject;
    const mapped = { ...data, isHidden, subject };
    if (data.User) {
      mapped.user = data.User;
      delete mapped.User;
    }
    if (data.SupportMessage) {
      mapped.messages = data.SupportMessage;
      delete mapped.SupportMessage;
    }
    return mapped;
  },
  async update({ where, data }: any) {
    const existing = await supportTicket.findUnique({ where });
    if (!existing) throw new Error('Ticket not found');
    
    let payload = { ...data };
    let subject = existing.subject;
    
    if (data.isHidden !== undefined) {
      const currentlyHidden = existing.isHidden;
      const targetHidden = !!data.isHidden;
      if (targetHidden && !currentlyHidden) {
        payload.subject = '[HIDDEN] ' + (subject || 'Support');
      } else if (!targetHidden && currentlyHidden) {
        payload.subject = subject || 'Support';
      }
      delete payload.isHidden;
    }
    
    const res = await check(sb.from('SupportTicket').update({ ...payload, updatedAt: nowIso() }).eq('id', where.id).select().single());
    
    const isHidden = res.subject && res.subject.startsWith('[HIDDEN]');
    const cleanSubject = isHidden ? res.subject.replace(/^\[HIDDEN\]\s*/, '') : res.subject;
    return { ...res, isHidden, subject: cleanSubject };
  },
  async count({ where }: any = {}) {
    if (where?.isHidden !== undefined) {
      const tickets = await supportTicket.findMany({ where });
      return tickets.length;
    }
    let q = sb.from('SupportTicket').select('*', { count: 'exact', head: true });
    if (where?.status) q = q.eq('status', where.status);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};

// ---- SupportMessage --------------------------------------------------------
const supportMessage = {
  async create({ data }: any) {
    const row = { ...data, id: data.id ?? crypto.randomUUID(), createdAt: nowIso() };
    return await check(sb.from('SupportMessage').insert(row).select().single());
  },
  async findUnique({ where, include }: any) {
    let sel = '*';
    if (include) {
      const parts = ['*'];
      if (include.ticket) parts.push('SupportTicket(*)');
      sel = parts.join(',');
    }
    const { data, error } = await sb.from('SupportMessage').select(sel).eq('id', where.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const mapped = { ...data };
    if (data.SupportTicket) {
      mapped.ticket = data.SupportTicket;
      delete mapped.SupportTicket;
    }
    return mapped;
  },
  async delete({ where }: any) {
    return await check(sb.from('SupportMessage').delete().eq('id', where.id).select().single());
  },
  async findMany({ where, take, skip, orderBy }: any = {}) {
    let q = sb.from('SupportMessage').select('*');
    if (where?.ticketId) q = q.eq('ticketId', where.ticketId);
    if (where?.targetUserId) q = q.eq('targetUserId', where.targetUserId);
    if (where?.readAt === null) q = q.is('readAt', null);
    if (take) q = q.limit(take);
    if (skip) q = q.range(skip, skip + (take ?? 50) - 1);
    q = q.order('createdAt', { ascending: true });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async updateMany({ where, data }: any) {
    let q = sb.from('SupportMessage').update(data);
    if (where?.ticketId) q = q.eq('ticketId', where.ticketId);
    if (where?.targetUserId) q = q.eq('targetUserId', where.targetUserId);
    if (where?.readAt === null) q = q.is('readAt', null);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { count: 1 };
  },
  async count({ where }: any = {}) {
    let q = sb.from('SupportMessage').select('*', { count: 'exact', head: true });
    if (where?.readAt === null) q = q.is('readAt', null);
    if (where?.targetUserId) q = q.eq('targetUserId', where.targetUserId);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};

// ---- SiteContent -----------------------------------------------------------
const siteContent = {
  async findUnique({ where }: any) {
    const { data, error } = await sb.from('SiteContent').select('*').eq('key', where.key).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async findMany() {
    const { data, error } = await sb.from('SiteContent').select('*');
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async upsert({ where, create, update }: any) {
    const existing = await siteContent.findUnique({ where });
    if (existing) {
      return await check(sb.from('SiteContent').update({ ...update, updatedAt: nowIso() }).eq('key', where.key).select().single());
    } else {
      const row = { ...create, updatedAt: nowIso() };
      return await check(sb.from('SiteContent').insert(row).select().single());
    }
  },
};

// ---- UserLoginHistory ------------------------------------------------------
const userLoginHistory = {
  async create({ data }: any) {
    const row = { ...data, id: data.id ?? crypto.randomUUID(), createdAt: nowIso() };
    return await check(sb.from('UserLoginHistory').insert(row).select().single());
  },
  async findMany({ where, take, skip }: any = {}) {
    let q = sb.from('UserLoginHistory').select('*');
    if (where?.userId) q = q.eq('userId', where.userId);
    if (take) q = q.limit(take);
    q = q.order('createdAt', { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

// ---- AdminAuditLog ---------------------------------------------------------
const adminAuditLog = {
  async create({ data }: any) {
    const row = { ...data, id: data.id ?? crypto.randomUUID(), createdAt: nowIso() };
    return await check(sb.from('AdminAuditLog').insert(row).select().single());
  },
  async findMany({ where, take, skip, orderBy, include }: any = {}) {
    // Luôn fetch User(role) để lọc bảo mật
    let q = sb.from('AdminAuditLog').select('*, User!adminId(username, email, role)');
    if (where?.adminId) q = q.eq('adminId', where.adminId);
    if (take) q = q.limit(take * 3); // Lấy nhiều hơn để lọc in-memory
    q = q.order('createdAt', { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    
    let list = (data ?? []).map((row: any) => {
      const mapped = { ...row };
      if (row.User) {
        mapped.admin = row.User;
        delete mapped.User;
      }
      return mapped;
    });

    // Lọc bỏ logs của super_admin đối với admin thường
    if (where?.admin?.role?.not) {
      const excludeRole = where.admin.role.not;
      list = list.filter((a) => a.admin?.role !== excludeRole);
    }

    if (take) list = list.slice(0, take);
    return list;
  },
};

// ---------------------------------------------------------------------------
// Transaction emulation (runs sequentially — not atomic like real tx)
// ---------------------------------------------------------------------------
async function runTransaction(fn: (tx: any) => Promise<any>): Promise<any> {
  const txProxy = new Proxy({} as any, {
    get(_t, model: string) {
      const map: Record<string, any> = {
        wallet, transaction, user, bet, roundSeed,
        depositRequest, withdrawRequest, gameConfig, gamePayoutConfig,
        supportTicket, supportMessage, siteContent, userLoginHistory, adminAuditLog,
      };
      return map[model] ?? map[model.charAt(0).toLowerCase() + model.slice(1)];
    },
  });
  return fn(txProxy);
}

// ---------------------------------------------------------------------------
// PrismaClient class (compatibility shim)
// ---------------------------------------------------------------------------
export class PrismaClient {
  user = user;
  wallet = wallet;
  transaction = transaction;
  bet = bet;
  roundSeed = roundSeed;
  depositRequest = depositRequest;
  withdrawRequest = withdrawRequest;
  gameConfig = gameConfig;
  gamePayoutConfig = gamePayoutConfig;
  supportTicket = supportTicket;
  supportMessage = supportMessage;
  siteContent = siteContent;
  userLoginHistory = userLoginHistory;
  adminAuditLog = adminAuditLog;

  async $connect() {}
  async $disconnect() {}
  async $transaction(fn: any) { return runTransaction(fn); }
  async $queryRaw(query: any, ...args: any[]) {
    throw new Error('[PrismaShim] $queryRaw not supported — use supabase.rpc()');
  }
  $extends(_: any) { return this; }
}

// ---------------------------------------------------------------------------
// Prisma namespace (Decimal, etc.)
// ---------------------------------------------------------------------------
export const Prisma = {
  Decimal,
  InputJsonValue: undefined as any,
};

export default PrismaClient;
