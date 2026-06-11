/**
 * @prisma/client SHIM — Supabase REST API backend
 * Toàn bộ logic chứa trong 1 file JS thuần, không cần compile TypeScript
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error('[PrismaShim] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

const sb = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

function nowIso() { return new Date().toISOString(); }
function uid() { return crypto.randomUUID(); }

function applyWhereFilters(q, where) {
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

function parseDates(obj) {
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

async function check(promise) {
  const r = await promise;
  if (r.error) throw new Error(r.error.message ?? JSON.stringify(r.error));
  return parseDates(r.data);
}

function applyUserFilters(q, where) {
  if (!where) return q;

  if (where.AND && Array.isArray(where.AND)) {
    for (const sub of where.AND) {
      q = applyUserFilters(q, sub);
    }
  }

  if (where.OR && Array.isArray(where.OR)) {
    const orParts = [];
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
  async findUnique({ where, select }) {
    let q = sb.from('User').select(select ? Object.keys(select).join(',') : '*');
    if (where.id) q = q.eq('id', where.id);
    if (where.email) q = q.eq('email', where.email);
    if (where.username) q = q.eq('username', where.username);
    const { data, error } = await q.maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async findFirst({ where, select } = {}) {
    let q = sb.from('User').select(select ? Object.keys(select).join(',') : '*');
    if (where?.OR) {
      const [a, b] = where.OR;
      const [k1, v1] = Object.entries(a)[0];
      const [k2, v2] = Object.entries(b)[0];
      q = q.or(`${k1}.eq.${v1},${k2}.eq.${v2}`);
    }
    if (where?.email?.equals) q = q.ilike('email', where.email.equals);
    if (where?.username?.equals) q = q.ilike('username', where.username.equals);
    if (where?.isBanned !== undefined) q = q.eq('isBanned', where.isBanned);
    const { data, error } = await q.limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async findMany({ where, select, take, skip, orderBy } = {}) {
    let q = sb.from('User').select(select ? Object.keys(select).join(',') : '*');
    q = applyUserFilters(q, where);
    if (take) q = q.limit(take);
    if (skip) q = q.range(skip, skip + (take ?? 50) - 1);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async create({ data }) {
    const row = { ...data, id: data.id ?? uid(), createdAt: data.createdAt ?? nowIso() };
    return await check(sb.from('User').insert(row).select().single());
  },
  async update({ where, data }) {
    let q = sb.from('User').update(data);
    if (where.id) q = q.eq('id', where.id);
    return await check(q.select().single());
  },
  async count({ where } = {}) {
    let q = sb.from('User').select('*', { count: 'exact', head: true });
    q = applyUserFilters(q, where);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};

// ---- Wallet ----------------------------------------------------------------
const wallet = {
  async findUnique({ where }) {
    let q = sb.from('Wallet').select('*');
    if (where.userId) q = q.eq('userId', where.userId);
    if (where.id) q = q.eq('id', where.id);
    const { data, error } = await q.maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async findMany({ where } = {}) {
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
  async create({ data }) {
    const row = { ...data, id: data.id ?? uid(), updatedAt: nowIso(), balance: Number(data.balance ?? 0) };
    return await check(sb.from('Wallet').insert(row).select().single());
  },
  async update({ where, data }) {
    const payload = { ...data, updatedAt: nowIso() };
    if (payload.balance?.toNumber) payload.balance = payload.balance.toNumber();
    payload.balance = Number(payload.balance);
    let q = sb.from('Wallet').update(payload);
    if (where.userId) q = q.eq('userId', where.userId);
    if (where.id) q = q.eq('id', where.id);
    return await check(q.select().single());
  },
};

// ---- Transaction -----------------------------------------------------------
const transaction = {
  async create({ data }) {
    const row = {
      ...data, id: data.id ?? uid(), createdAt: nowIso(),
      amount: Number(data.amount), previousBalance: Number(data.previousBalance), currentBalance: Number(data.currentBalance),
    };
    return await check(sb.from('Transaction').insert(row).select().single());
  },
  async findMany({ where, select, take, skip, orderBy, include } = {}) {
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
    q = q.order('createdAt', { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => {
      const mapped = { ...row };
      if (row.User) {
        mapped.user = row.User;
        delete mapped.User;
      }
      return mapped;
    });
  },
  async count({ where } = {}) {
    let q = sb.from('Transaction').select('*', { count: 'exact', head: true });
    if (where?.userId) q = q.eq('userId', where.userId);
    if (where?.type) q = q.eq('type', where.type);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
  async aggregate({ where, _sum, _count } = {}) {
    let q = sb.from('Transaction').select('*');
    q = applyWhereFilters(q, where);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const result = {};
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
  async groupBy({ by, where, _sum } = {}) {
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
    const groups = {};
    for (const row of (data ?? [])) {
      const groupKey = by.map(k => row[k]).join('_');
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
};

// ---- Bet -------------------------------------------------------------------
const bet = {
  async create({ data }) {
    const row = { ...data, id: data.id ?? uid(), createdAt: nowIso(), betAmount: Number(data.betAmount), payout: Number(data.payout) };
    return await check(sb.from('Bet').insert(row).select().single());
  },
  async findMany({ where, take, skip, orderBy } = {}) {
    let q = sb.from('Bet').select('*');
    q = applyWhereFilters(q, where);
    if (where && where.result === null) {
      q = q.is('result', null);
    }
    if (take) q = q.limit(take);
    if (skip) q = q.range(skip, skip + (take ?? 50) - 1);
    q = q.order('createdAt', { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async count({ where } = {}) {
    let q = sb.from('Bet').select('*', { count: 'exact', head: true });
    q = applyWhereFilters(q, where);
    if (where && where.result === null) {
      q = q.is('result', null);
    }
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
  async aggregate({ where, _sum, _count } = {}) {
    let q = sb.from('Bet').select('*');
    q = applyWhereFilters(q, where);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const result = {};
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
  async groupBy({ by, _count, _sum } = {}) {
    let q = sb.from('Bet').select('*');
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const groups = {};
    for (const row of (data ?? [])) {
      const groupKey = by.map(k => row[k]).join('_');
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
  async update({ where, data }) {
    const payload = { ...data };
    if (payload.payout !== undefined) payload.payout = Number(payload.payout);
    return await check(sb.from('Bet').update(payload).eq('id', where.id).select().single());
  },
  async updateMany({ where, data }) {
    let q = sb.from('Bet').update(data);
    if (where?.userId) q = q.eq('userId', where.userId);
    if (where?.game) q = q.eq('game', where.game);
    if (where?.roundId) q = q.eq('roundId', where.roundId);
    if (where?.result === null) q = q.is('result', null);
    const { data: res, error } = await q.select();
    if (error) throw new Error(error.message);
    return { count: res?.length ?? 0 };
  },
};


// ---- RoundSeed -------------------------------------------------------------
const roundSeed = {
  async findUnique({ where }) {
    const { data, error } = await sb.from('RoundSeed').select('*').eq('roundId', where.roundId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async create({ data }) {
    const row = { ...data, id: data.id ?? uid(), createdAt: nowIso(), nonce: data.nonce ?? 0 };
    return await check(sb.from('RoundSeed').insert(row).select().single());
  },
  async update({ where, data }) {
    return await check(sb.from('RoundSeed').update(data).eq('roundId', where.roundId).select().single());
  },
  async findMany({ where, take } = {}) {
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
  async create({ data }) {
    const row = { ...data, id: data.id ?? uid(), createdAt: nowIso(), amount: Number(data.amount) };
    return await check(sb.from('DepositRequest').insert(row).select().single());
  },
  async findMany({ where, take, skip } = {}) {
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
  async findUnique({ where }) {
    const { data, error } = await sb.from('DepositRequest').select('*').eq('id', where.id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async update({ where, data }) {
    return await check(sb.from('DepositRequest').update(data).eq('id', where.id).select().single());
  },
  async count({ where } = {}) {
    let q = sb.from('DepositRequest').select('*', { count: 'exact', head: true });
    if (where?.status) q = q.eq('status', where.status);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};

// ---- WithdrawRequest -------------------------------------------------------
const withdrawRequest = {
  async create({ data }) {
    const row = { ...data, id: data.id ?? uid(), createdAt: nowIso(), amount: Number(data.amount) };
    return await check(sb.from('WithdrawRequest').insert(row).select().single());
  },
  async findMany({ where, take, skip } = {}) {
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
  async findUnique({ where }) {
    const { data, error } = await sb.from('WithdrawRequest').select('*').eq('id', where.id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async update({ where, data }) {
    return await check(sb.from('WithdrawRequest').update(data).eq('id', where.id).select().single());
  },
  async count({ where } = {}) {
    let q = sb.from('WithdrawRequest').select('*', { count: 'exact', head: true });
    if (where?.status) q = q.eq('status', where.status);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};

// ---- GameConfig ------------------------------------------------------------
const gameConfig = {
  async findUnique({ where }) {
    const { data, error } = await sb.from('GameConfig').select('*').eq('gameId', where.gameId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async findMany() {
    const { data, error } = await sb.from('GameConfig').select('*');
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async upsert({ where, create, update }) {
    const existing = await gameConfig.findUnique({ where });
    if (existing) {
      if (!update || Object.keys(update).length === 0) return existing;
      return await check(sb.from('GameConfig').update({ ...update, updatedAt: nowIso() }).eq('gameId', where.gameId).select().single());
    }
    const row = { ...create, id: uid(), updatedAt: nowIso(), minBet: Number(create.minBet ?? 10), maxBet: Number(create.maxBet ?? 10000) };
    return await check(sb.from('GameConfig').insert(row).select().single());
  },
  async update({ where, data }) {
    return await check(sb.from('GameConfig').update({ ...data, updatedAt: nowIso() }).eq('gameId', where.gameId).select().single());
  },
};

// ---- GamePayoutConfig ------------------------------------------------------
const gamePayoutConfig = {
  async findUnique({ where }) {
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
  async findFirst({ where } = {}) {
    let q = sb.from('GamePayoutConfig').select('*');
    if (where?.id) q = q.eq('id', where.id);
    if (where?.gameId) q = q.eq('gameId', where.gameId);
    const { data, error } = await q.limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async findMany({ where } = {}) {
    let q = sb.from('GamePayoutConfig').select('*');
    if (where?.gameId) q = q.eq('gameId', where.gameId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async create({ data }) {
    const row = { ...data, id: data.id ?? uid(), createdAt: nowIso(), ratio: Number(data.ratio) };
    return await check(sb.from('GamePayoutConfig').insert(row).select().single());
  },
  async deleteMany({ where }) {
    let q = sb.from('GamePayoutConfig').delete();
    if (where?.gameId) q = q.eq('gameId', where.gameId);
    if (where?.id) q = q.eq('id', where.id);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { count: 1 };
  },
  async update({ where, data }) {
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
  async create({ data }) {
    const row = { ...data, id: data.id ?? uid(), createdAt: nowIso(), updatedAt: nowIso() };
    return await check(sb.from('SupportTicket').insert(row).select().single());
  },
  async findMany({ where, take, skip, include } = {}) {
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
    return (data ?? []).map((row) => {
      const mapped = { ...row };
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
  },
  async findUnique({ where, include }) {
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
    const mapped = { ...data };
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
  async update({ where, data }) {
    return await check(sb.from('SupportTicket').update({ ...data, updatedAt: nowIso() }).eq('id', where.id).select().single());
  },
  async count({ where } = {}) {
    let q = sb.from('SupportTicket').select('*', { count: 'exact', head: true });
    if (where?.status) q = q.eq('status', where.status);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};

// ---- SupportMessage --------------------------------------------------------
const supportMessage = {
  async create({ data }) {
    const row = { ...data, id: data.id ?? uid(), createdAt: nowIso() };
    return await check(sb.from('SupportMessage').insert(row).select().single());
  },
  async findUnique({ where, include }) {
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
  async delete({ where }) {
    return await check(sb.from('SupportMessage').delete().eq('id', where.id).select().single());
  },
  async findMany({ where, take, skip } = {}) {
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
  async updateMany({ where, data }) {
    let q = sb.from('SupportMessage').update(data);
    if (where?.ticketId) q = q.eq('ticketId', where.ticketId);
    if (where?.targetUserId) q = q.eq('targetUserId', where.targetUserId);
    if (where?.readAt === null) q = q.is('readAt', null);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { count: 1 };
  },
  async count({ where } = {}) {
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
  async findUnique({ where }) {
    const { data, error } = await sb.from('SiteContent').select('*').eq('key', where.key).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async findMany() {
    const { data, error } = await sb.from('SiteContent').select('*');
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async upsert({ where, create, update }) {
    const existing = await siteContent.findUnique({ where });
    if (existing) {
      return await check(sb.from('SiteContent').update({ ...update, updatedAt: nowIso() }).eq('key', where.key).select().single());
    }
    return await check(sb.from('SiteContent').insert({ ...create, updatedAt: nowIso() }).select().single());
  },
};

// ---- UserLoginHistory ------------------------------------------------------
const userLoginHistory = {
  async create({ data }) {
    const row = { ...data, id: data.id ?? uid(), createdAt: nowIso() };
    return await check(sb.from('UserLoginHistory').insert(row).select().single());
  },
  async findMany({ where, take } = {}) {
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
  async create({ data }) {
    const row = { ...data, id: data.id ?? uid(), createdAt: nowIso() };
    return await check(sb.from('AdminAuditLog').insert(row).select().single());
  },
  async findMany({ where, take, include } = {}) {
    let q = sb.from('AdminAuditLog').select(include?.admin ? '*, User!adminId(username, email)' : '*');
    if (where?.adminId) q = q.eq('adminId', where.adminId);
    if (take) q = q.limit(take);
    q = q.order('createdAt', { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => {
      const mapped = { ...row };
      if (row.User) {
        mapped.admin = row.User;
        delete mapped.User;
      }
      return mapped;
    });
  },
};

// ---- Transaction runner (sequential emulation) ----------------------------
function buildProxy() {
  const models = { user, wallet, transaction, bet, roundSeed, depositRequest, withdrawRequest, gameConfig, gamePayoutConfig, supportTicket, supportMessage, siteContent, userLoginHistory, adminAuditLog };
  return new Proxy({}, { get(_t, k) { return models[k]; } });
}

// ---- Decimal class ---------------------------------------------------------
export class Decimal {
  constructor(v) { this._v = Number(v); }
  toNumber() { return this._v; }
  toString() { return String(this._v); }
  valueOf() { return this._v; }
}

// ---- Prisma namespace ------------------------------------------------------
export const Prisma = { Decimal };

// ---- PrismaClient ----------------------------------------------------------
export class PrismaClient {
  constructor() {
    this.user = user;
    this.wallet = wallet;
    this.transaction = transaction;
    this.bet = bet;
    this.roundSeed = roundSeed;
    this.depositRequest = depositRequest;
    this.withdrawRequest = withdrawRequest;
    this.gameConfig = gameConfig;
    this.gamePayoutConfig = gamePayoutConfig;
    this.supportTicket = supportTicket;
    this.supportMessage = supportMessage;
    this.siteContent = siteContent;
    this.userLoginHistory = userLoginHistory;
    this.adminAuditLog = adminAuditLog;
  }
  async $connect() {}
  async $disconnect() {}
  async $transaction(fn) {
    return fn(buildProxy());
  }
  async $queryRaw() {
    // Return empty — only used for init checks
    return [];
  }
  $extends() { return this; }
}

export default PrismaClient;
