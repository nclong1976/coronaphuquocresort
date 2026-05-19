/**
 * Payout Control v8 — đồng bộ với admin-dashboard/GamesPage, dùng adminClient.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { admin } from '../api/adminClient';

const FULL_DAY = { startTime: '00:00', endTime: '23:59' };

const WD_OPTS = [
  { v: 1, l: 'T2' },
  { v: 2, l: 'T3' },
  { v: 3, l: 'T4' },
  { v: 4, l: 'T5' },
  { v: 5, l: 'T6' },
  { v: 6, l: 'T7' },
  { v: 7, l: 'CN' },
] as const;

function getIsoWeekdayMon1Sun7(d: Date): number {
  const w = d.getDay();
  return w === 0 ? 7 : w;
}

function weekdaysForBulk(set: Set<number>): number[] | undefined {
  if (set.size === 0 || set.size === 7) return undefined;
  return [...set].sort((a, b) => a - b);
}

function formatWdList(wd: number[] | null | undefined): string {
  if (wd == null || wd.length === 0) return 'mọi ngày';
  const map: Record<number, string> = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' };
  return wd.map((x) => map[x] ?? x).join(', ');
}

/** Sic Bo DB: grossWin = stake * ratio. UI người chơi: 1:(ratio-1). Ô admin nhập x trong 1:x → ratio = 1+x. */
function sicBoRatioForDb(profitX: number): number {
  const x = Number.isFinite(profitX) ? profitX : 1;
  return Math.max(1, 1 + x);
}

function sicBoProfitXFromDbRatio(ratio: number): number {
  const r = Number.isFinite(ratio) ? ratio : 2;
  return Math.max(0, r - 1);
}

function parseLocaleNumber(raw: string, fallback: number): number {
  const n = parseFloat(String(raw).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

/** Giá trị cho input datetime-local theo giờ máy admin. */
function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type SubTab = 'tiger' | 'sic' | 'dragon' | 'baicao';

export type PayoutCfgRow = {
  id: string;
  gameId: string;
  optionKey: string;
  ratio: number;
  startTime: string;
  endTime: string;
  weekdays?: number[] | null;
  weekdaysSig?: string;
};

export type AdminGameRow = {
  gameId: string;
  enabled: boolean;
  minBet: number;
  maxBet: number;
  payoutBoost?: boolean;
};

function localInputToHHMM(s: string): string {
  if (!s) return '00:00';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '00:00';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function readRatio(configs: PayoutCfgRow[], gameId: string, optionKey: string): number | undefined {
  const rows = configs.filter((c) => c.gameId === gameId && c.optionKey === optionKey);
  if (!rows.length) return undefined;
  const iso = getIsoWeekdayMon1Sun7(new Date());
  const applies = (r: PayoutCfgRow) => {
    const wd = r.weekdays;
    if (!wd || wd.length === 0) return true;
    return wd.includes(iso);
  };
  const candidates = rows.filter(applies);
  const pool = candidates.length ? candidates : rows;
  const full = pool.find((r) => r.startTime === '00:00' && r.endTime === '23:59');
  if (full) return Number(full.ratio);
  return Number(pool[0].ratio);
}

function tigerPreview(banker: number, player: number, tie: number) {
  const heB = Math.max(0.5, 1.06 - (banker - 1) * 18).toFixed(2);
  const heP = Math.max(0.5, 1.24 - (player - 1) * 18).toFixed(2);
  const rtp = (100 - (parseFloat(heB) + parseFloat(heP)) / 2).toFixed(1);
  return { heB, heP, rtp };
}

function sicPreview(big: number, small: number, triple: number) {
  const heTaixiu = Math.max(0.5, 2.78 - (big + small - 2) * 35).toFixed(2);
  const heTriple = Math.max(10, 30 + (30 - triple) * 0.7).toFixed(0);
  const rtp = (100 - parseFloat(heTaixiu)).toFixed(1);
  return { heTaixiu, heTriple, rtp };
}

function dragonPreview(dragon: number, tiger: number, tie: number) {
  const heMain = Math.max(1, 3.73 - (dragon + tiger - 2) * 22).toFixed(2);
  const heTie = Math.max(10, 32 + (11 - tie) * 4).toFixed(0);
  const rtp = (100 - parseFloat(heMain)).toFixed(2);
  return { heMain, heTie, rtp };
}

function baicaoPreview(player: number, banker: number) {
  const he = Math.max(1, 3.5 - (player + banker - 2) * 28).toFixed(2);
  const rtp = (100 - parseFloat(he)).toFixed(1);
  return { he, rtp };
}

function warnRtp(rtp: string) {
  const n = parseFloat(rtp);
  if (n > 100) return '⚠️ RTP > 100% – NGUY CƠ LỖ!';
  if (n < 90) return 'RTP quá thấp – Có thể làm giảm người chơi';
  return '';
}

const tabBtn = (active: boolean) =>
  `shrink-0 px-4 py-3 text-center cursor-pointer font-bold text-xs sm:text-sm whitespace-nowrap transition-all border-r border-[#2a2a44] last:border-r-0 ${
    active ? 'bg-[#00e0ff] text-black scale-[1.02]' : 'text-[#f0f0ff] hover:bg-[#1a1a2e]'
  }`;

const inputCls =
  'w-full py-3 px-3 border-2 border-[#2a2a44] rounded-xl bg-[#0f0f1e] text-white text-lg text-center focus:border-[#00e0ff] focus:outline-none focus:ring-4 focus:ring-[#00e0ff]/25';

export function CasinoPayoutControl({
  configs,
  games,
  onReload,
}: {
  configs: PayoutCfgRow[];
  games: AdminGameRow[];
  onReload: () => void | Promise<void>;
}) {
  const [tab, setTab] = useState<SubTab>('tiger');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetGame, setSheetGame] = useState('');
  const [scheduleName, setScheduleName] = useState('Khuyến mãi đêm');
  const [startDt, setStartDt] = useState('');
  const [endDt, setEndDt] = useState('');

  const [tBanker, setTBanker] = useState(1);
  const [tPlayer, setTPlayer] = useState(1);
  const [tTie, setTTie] = useState(8);

  const [sBig, setSBig] = useState(1);
  const [sSmall, setSSmall] = useState(1);
  const [sTriple, setSTriple] = useState(30);

  const [dDragon, setDDragon] = useState(1);
  const [dTiger, setDTiger] = useState(1);
  const [dTie, setDTie] = useState(11);

  const [bcPlayer, setBcPlayer] = useState(1);
  const [bcBanker, setBcBanker] = useState(1);

  const [statusMsg, setStatusMsg] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [payoutLive, setPayoutLive] = useState<Awaited<ReturnType<typeof admin.payoutLive>> | null>(null);
  const [scheduleWeekdays, setScheduleWeekdays] = useState(() => new Set([1, 2, 3, 4, 5, 6, 7]));

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      admin
        .payoutLive()
        .then((p) => {
          if (!cancelled) setPayoutLive(p);
        })
        .catch(() => {});
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!configs.length) return;
    const rb = readRatio(configs, 'tigerbaccarat', 'BANKER');
    const rp = readRatio(configs, 'tigerbaccarat', 'PLAYER');
    const rt = readRatio(configs, 'tigerbaccarat', 'TIE');
    if (rp != null) setTPlayer(rp / 2);
    if (rb != null) setTBanker(rb / 1.95);
    if (rt != null) setTTie((rt / 9) * 8);

    const rBig = readRatio(configs, 'sicbo', 'BIG');
    const rSm = readRatio(configs, 'sicbo', 'SMALL');
    if (rBig != null) setSBig(sicBoProfitXFromDbRatio(rBig));
    if (rSm != null) setSSmall(sicBoProfitXFromDbRatio(rSm));

    const rd = readRatio(configs, 'dragontiger', 'DRAGON');
    const rdt = readRatio(configs, 'dragontiger', 'TIGER');
    const rdtie = readRatio(configs, 'dragontiger', 'TIE');
    if (rd != null) setDDragon(rd / 2);
    if (rdt != null) setDTiger(rdt / 2);
    if (rdtie != null) setDTie((rdtie / 9) * 11);

    const bcp = readRatio(configs, 'baicao', 'PLAYER');
    const bcb = readRatio(configs, 'baicao', 'BANKER');
    if (bcp != null) setBcPlayer(bcp / 2);
    if (bcb != null) setBcBanker(bcb / 1.95);
  }, [configs]);

  const sicBoostOn = games.find((g) => g.gameId === 'sicbo')?.payoutBoost ?? false;

  const tp = useMemo(() => tigerPreview(tBanker, tPlayer, tTie), [tBanker, tPlayer, tTie]);
  const sp = useMemo(() => sicPreview(sBig, sSmall, sTriple), [sBig, sSmall, sTriple]);
  const dp = useMemo(() => dragonPreview(dDragon, dTiger, dTie), [dDragon, dTiger, dTie]);
  const bp = useMemo(() => baicaoPreview(bcPlayer, bcBanker), [bcPlayer, bcBanker]);

  async function runBulk(body: Parameters<typeof admin.applyPayoutBulk>[0]) {
    setErr(null);
    setPending(true);
    try {
      await admin.applyPayoutBulk(body);
      await onReload();
      admin.payoutLive().then(setPayoutLive).catch(() => {});
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function activateTiger() {
    await runBulk({
      gameId: 'tigerbaccarat',
      replaceAll: true,
      entries: [
        { optionKey: 'PLAYER', ratio: 2 * tPlayer, ...FULL_DAY },
        { optionKey: 'BANKER', ratio: 1.95 * tBanker, ...FULL_DAY },
        { optionKey: 'TIE', ratio: (tTie / 8) * 9, ...FULL_DAY },
      ],
    });
    setStatusMsg((m) => ({ ...m, tiger: `Đã áp dụng Tiger Baccarat — ${new Date().toLocaleString('vi-VN')}` }));
  }

  async function activateSic() {
    setErr(null);
    setPending(true);
    try {
      await admin.updateGameSettings('sicbo', { payoutBoost: true });
      await admin.applyPayoutBulk({
        gameId: 'sicbo',
        replaceAll: true,
        entries: [
          { optionKey: 'BIG', ratio: sicBoRatioForDb(sBig), ...FULL_DAY },
          { optionKey: 'SMALL', ratio: sicBoRatioForDb(sSmall), ...FULL_DAY },
        ],
      });
      await onReload();
      admin.payoutLive().then(setPayoutLive).catch(() => {});
      setStatusMsg((m) => ({ ...m, sic: `Đã áp dụng Sic Bo (Tài/Xỉu) — ${new Date().toLocaleString('vi-VN')}` }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function activateDragon() {
    await runBulk({
      gameId: 'dragontiger',
      replaceAll: true,
      entries: [
        { optionKey: 'DRAGON', ratio: 2 * dDragon, ...FULL_DAY },
        { optionKey: 'TIGER', ratio: 2 * dTiger, ...FULL_DAY },
        { optionKey: 'TIE', ratio: (dTie / 11) * 9, ...FULL_DAY },
      ],
    });
    setStatusMsg((m) => ({ ...m, dragon: `Đã áp dụng Long Hổ — ${new Date().toLocaleString('vi-VN')}` }));
  }

  async function activateBaicao() {
    await runBulk({
      gameId: 'baicao',
      replaceAll: true,
      entries: [
        { optionKey: 'PLAYER', ratio: 2 * bcPlayer, ...FULL_DAY },
        { optionKey: 'BANKER', ratio: 1.95 * bcBanker, ...FULL_DAY },
        { optionKey: 'TIE', ratio: 9, ...FULL_DAY },
      ],
    });
    setStatusMsg((m) => ({ ...m, baicao: `Đã áp dụng Bài Cào — ${new Date().toLocaleString('vi-VN')}` }));
  }

  function resetTiger() {
    setTBanker(1);
    setTPlayer(1);
    setTTie(8);
  }
  function resetSic() {
    setSBig(1);
    setSSmall(1);
    setSTriple(30);
  }

  /** Về 1:1 tiêu chuẩn: xóa GamePayoutConfig Sic Bo + tắt payoutBoost → đồng bộ người chơi ngay (socket). */
  async function defaultSicBoStandard() {
    setErr(null);
    setPending(true);
    try {
      await admin.applyPayoutBulk({ gameId: 'sicbo', replaceAll: true, entries: [] });
      await admin.updateGameSettings('sicbo', { payoutBoost: false });
      resetSic();
      await onReload();
      admin.payoutLive().then(setPayoutLive).catch(() => {});
      setStatusMsg((m) => ({ ...m, sic: `Đã về tiêu chuẩn 1:1 — ${new Date().toLocaleString('vi-VN')}` }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  function openScheduleSheet(gameLabel: string) {
    const now = new Date();
    setSheetGame(gameLabel);
    setStartDt(toDatetimeLocalValue(now));
    setEndDt(toDatetimeLocalValue(new Date(now.getTime() + 2 * 60 * 60 * 1000)));
    setScheduleWeekdays(new Set([1, 2, 3, 4, 5, 6, 7]));
    setSheetOpen(true);
  }
  function resetDragon() {
    setDDragon(1);
    setDTiger(1);
    setDTie(11);
  }
  function resetBaicao() {
    setBcPlayer(1);
    setBcBanker(1);
  }

  async function saveSchedule() {
    if (startDt && endDt) {
      const a = new Date(startDt).getTime();
      const b = new Date(endDt).getTime();
      if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) {
        alert('Thời gian kết thúc phải sau thời gian bắt đầu.');
        return;
      }
    }
    const st = localInputToHHMM(startDt);
    const et = localInputToHHMM(endDt);
    const range = startDt && endDt ? { startTime: st, endTime: et } : FULL_DAY;
    const wd = weekdaysForBulk(scheduleWeekdays);
    const w = <T extends { optionKey: string; ratio: number; startTime: string; endTime: string }>(e: T) =>
      wd ? { ...e, weekdays: wd } : e;

    setErr(null);
    setPending(true);
    try {
      if (sheetGame.includes('Tiger')) {
        await admin.applyPayoutBulk({
          gameId: 'tigerbaccarat',
          replaceAll: false,
          entries: [
            w({ optionKey: 'PLAYER', ratio: 2 * tPlayer, ...range }),
            w({ optionKey: 'BANKER', ratio: 1.95 * tBanker, ...range }),
            w({ optionKey: 'TIE', ratio: (tTie / 8) * 9, ...range }),
          ],
        });
      } else if (sheetGame.includes('Sic')) {
        await admin.updateGameSettings('sicbo', { payoutBoost: true });
        await admin.applyPayoutBulk({
          gameId: 'sicbo',
          replaceAll: false,
          entries: [
            w({ optionKey: 'BIG', ratio: sicBoRatioForDb(sBig), ...range }),
            w({ optionKey: 'SMALL', ratio: sicBoRatioForDb(sSmall), ...range }),
          ],
        });
      } else if (sheetGame.includes('Dragon')) {
        await admin.applyPayoutBulk({
          gameId: 'dragontiger',
          replaceAll: false,
          entries: [
            w({ optionKey: 'DRAGON', ratio: 2 * dDragon, ...range }),
            w({ optionKey: 'TIGER', ratio: 2 * dTiger, ...range }),
            w({ optionKey: 'TIE', ratio: (dTie / 11) * 9, ...range }),
          ],
        });
      } else {
        await admin.applyPayoutBulk({
          gameId: 'baicao',
          replaceAll: false,
          entries: [
            w({ optionKey: 'PLAYER', ratio: 2 * bcPlayer, ...range }),
            w({ optionKey: 'BANKER', ratio: 1.95 * bcBanker, ...range }),
            w({ optionKey: 'TIE', ratio: 9, ...range }),
          ],
        });
      }
      await onReload();
      admin.payoutLive().then(setPayoutLive).catch(() => {});
      setSheetOpen(false);
      alert(`Đã lưu lịch: ${scheduleName}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700/80 bg-[#0a0a14] text-[#f0f0ff] pb-6 font-sans antialiased -mx-1">
      <style>{`
        @keyframes payout-shimmer { 0% { transform: translateX(-150%) skewX(-25deg); } 100% { transform: translateX(150%) skewX(-25deg); } }
        .payout-shimmer { animation: payout-shimmer 4s infinite ease-in-out; }
      `}</style>

      <header className="text-center py-4 text-lg font-bold text-[#00e0ff] tracking-wide">Casino – Payout Control v8</header>
      <p className="text-center text-[11px] text-[#a0a0cc] px-3 -mt-1 pb-3 max-w-xl mx-auto">
        Ghi vào <code className="text-[#00e0ff]">GamePayoutConfig</code>. Sic Bo cần{' '}
        <strong className="text-[#00ff99]">payoutBoost</strong> (tự bật khi Kích hoạt).
      </p>

      {err && <div className="mx-3 mb-3 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">{err}</div>}

      {payoutLive && (
        <div className="mx-3 mb-3 p-3 rounded-xl border border-[#00e0ff]/40 bg-[#00e0ff]/10 text-[11px] text-[#c8c8e6] leading-relaxed">
          <div className="font-bold text-[#00e0ff] mb-1">Đang áp dụng trên server (giống người chơi)</div>
          <div>
            Giờ {payoutLive.serverTime} · Hôm nay: {WD_OPTS.find((x) => x.v === payoutLive.isoWeekday)?.l ?? payoutLive.isoWeekday}
          </div>
          <div className="mt-1">
            Sic Bo:{' '}
            {payoutLive.sicbo.payoutBoost
              ? `Tài 1:${Math.max(0, payoutLive.sicbo.BIG - 1).toFixed(2)} · Xỉu 1:${Math.max(0, payoutLive.sicbo.SMALL - 1).toFixed(2)}`
              : '1:1 (tắt boost)'}
            {payoutLive.sicbo.activeWindow && (
              <span className="text-[#a0a0cc]">
                {' '}
                · {payoutLive.sicbo.activeWindow.startTime}–{payoutLive.sicbo.activeWindow.endTime} ({formatWdList(payoutLive.sicbo.activeWindow.weekdays)})
              </span>
            )}
          </div>
          <div className="mt-1 font-mono text-[10px] text-[#a8a8c8]">
            Tiger P/B/T: {payoutLive.tigerbaccarat.PLAYER.toFixed(2)} / {payoutLive.tigerbaccarat.BANKER.toFixed(2)} /{' '}
            {payoutLive.tigerbaccarat.TIE.toFixed(2)} · Long Hổ: {payoutLive.dragontiger.DRAGON.toFixed(2)} /{' '}
            {payoutLive.dragontiger.TIGER.toFixed(2)} / {payoutLive.dragontiger.TIE.toFixed(2)} · Bài Cào:{' '}
            {payoutLive.baicao.PLAYER.toFixed(2)} / {payoutLive.baicao.BANKER.toFixed(2)} / {payoutLive.baicao.TIE.toFixed(2)}
          </div>
        </div>
      )}

      <div className="flex overflow-x-auto mx-2 mb-4 rounded-xl bg-[#141426] shadow-lg scrollbar-none">
        {(
          [
            ['tiger', 'Tiger Baccarat'],
            ['sic', 'Sic Bo'],
            ['dragon', 'Dragon Tiger'],
            ['baicao', 'Bài Cào'],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" className={tabBtn(tab === k)} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      <div className="px-2 sm:px-3 max-w-[760px] mx-auto space-y-5">
        {tab === 'tiger' && (
          <div className="bg-[#141426] rounded-[20px] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.6)]">
            <h2 className="text-lg font-bold text-[#00e0ff] mb-4">Tiger Baccarat</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#a0a0cc] mb-1 font-medium">Banker ×</label>
                <input type="number" step="0.01" min={0.5} max={3} className={inputCls} value={tBanker} onChange={(e) => setTBanker(parseFloat(e.target.value) || 1)} />
              </div>
              <div>
                <label className="block text-xs text-[#a0a0cc] mb-1 font-medium">Player ×</label>
                <input type="number" step="0.01" min={0.5} max={3} className={inputCls} value={tPlayer} onChange={(e) => setTPlayer(parseFloat(e.target.value) || 1)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-[#a0a0cc] mb-1 font-medium">Tie ×</label>
                <input type="number" step={0.5} min={5} max={15} className={inputCls} value={tTie} onChange={(e) => setTTie(parseFloat(e.target.value) || 8)} />
              </div>
            </div>
            <div className="mt-4 p-3 rounded-2xl border border-[#00e0ff]/30 bg-[#00e0ff]/10 text-xs leading-relaxed">
              <strong className="text-[#00e0ff]">Preview:</strong> HE Banker ~{tp.heB}% · Player ~{tp.heP}% · RTP ~{tp.rtp}%
              {warnRtp(tp.rtp) && <div className="mt-2 p-2 rounded-lg bg-[#ff3366]/20 text-[#ff3366] font-bold">{warnRtp(tp.rtp)}</div>}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" className="flex-1 min-w-[100px] py-3 rounded-xl bg-[#00e0ff] text-black font-bold text-sm" onClick={() => activateTiger()} disabled={pending}>
                Kích hoạt ngay
              </button>
              <button
                type="button"
                className="flex-1 min-w-[100px] py-3 rounded-xl border-2 border-[#00e0ff] text-[#00e0ff] font-bold text-sm bg-transparent"
                onClick={() => openScheduleSheet('Tiger Baccarat')}
              >
                Lịch hẹn giờ
              </button>
              <button type="button" className="min-w-[80px] py-3 px-3 rounded-xl bg-[#ff3366] text-white font-bold text-sm" onClick={resetTiger}>
                Default
              </button>
            </div>
            {statusMsg.tiger && <div className="mt-3 p-3 rounded-xl bg-[#00ff99]/25 text-[#00ff99] font-bold text-center text-xs">{statusMsg.tiger}</div>}
          </div>
        )}

        {tab === 'sic' && (
          <div className="bg-[#141426] rounded-[20px] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.6)]">
            <h2 className="text-lg font-bold text-[#00e0ff] mb-1">Sic Bo (Tài / Xỉu)</h2>
            <p className="text-[11px] text-[#a0a0cc] mb-3">
              PayoutBoost: {sicBoostOn ? 'BẬT' : 'TẮT (1:1 mặc định)'} · Ô × = tỉ lệ <strong className="text-[#00ff99]">1:x</strong> (tiền thắng / tiền cược), ví dụ 2.1 → màn chơi hiện 1:2.1
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#a0a0cc] mb-1 font-medium">Tài (Big) 1:x</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={sBig}
                  onChange={(e) => setSBig(parseLocaleNumber(e.target.value, sBig))}
                />
              </div>
              <div>
                <label className="block text-xs text-[#a0a0cc] mb-1 font-medium">Xỉu (Small) 1:x</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={sSmall}
                  onChange={(e) => setSSmall(parseLocaleNumber(e.target.value, sSmall))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-[#a0a0cc] mb-1 font-medium">Any Triple × (minh họa)</label>
                <input type="number" step={1} min={15} max={50} className={inputCls} value={sTriple} onChange={(e) => setSTriple(parseFloat(e.target.value) || 30)} />
              </div>
            </div>
            <div className="mt-4 p-3 rounded-2xl border border-[#00e0ff]/30 bg-[#00e0ff]/10 text-xs">
              <strong className="text-[#00e0ff]">Preview:</strong> Tài/Xỉu HE ~{sp.heTaixiu}% · Triple ~{sp.heTriple}% · RTP ~{sp.rtp}%
              {warnRtp(sp.rtp) && <div className="mt-2 p-2 rounded-lg bg-[#ff3366]/20 text-[#ff3366] font-bold">{warnRtp(sp.rtp)}</div>}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" className="flex-1 py-3 rounded-xl bg-[#00e0ff] text-black font-bold text-sm" onClick={() => activateSic()} disabled={pending}>
                Kích hoạt ngay
              </button>
              <button
                type="button"
                className="flex-1 py-3 rounded-xl border-2 border-[#00e0ff] text-[#00e0ff] font-bold text-sm"
                onClick={() => openScheduleSheet('Sic Bo')}
              >
                Lịch hẹn giờ
              </button>
              <button type="button" className="py-3 px-3 rounded-xl bg-[#ff3366] text-white font-bold text-sm" onClick={() => void defaultSicBoStandard()} disabled={pending}>
                Default
              </button>
            </div>
            {statusMsg.sic && <div className="mt-3 p-3 rounded-xl bg-[#00ff99]/25 text-[#00ff99] font-bold text-center text-xs">{statusMsg.sic}</div>}
          </div>
        )}

        {tab === 'dragon' && (
          <div className="bg-[#141426] rounded-[20px] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.6)]">
            <h2 className="text-lg font-bold text-[#00e0ff] mb-4">Dragon Tiger</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#a0a0cc] mb-1 font-medium">Dragon ×</label>
                <input type="number" step="0.01" min={0.5} max={3} className={inputCls} value={dDragon} onChange={(e) => setDDragon(parseFloat(e.target.value) || 1)} />
              </div>
              <div>
                <label className="block text-xs text-[#a0a0cc] mb-1 font-medium">Tiger ×</label>
                <input type="number" step="0.01" min={0.5} max={3} className={inputCls} value={dTiger} onChange={(e) => setDTiger(parseFloat(e.target.value) || 1)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-[#a0a0cc] mb-1 font-medium">Tie ×</label>
                <input type="number" step={0.5} min={5} max={20} className={inputCls} value={dTie} onChange={(e) => setDTie(parseFloat(e.target.value) || 11)} />
              </div>
            </div>
            <div className="mt-4 p-3 rounded-2xl border border-[#00e0ff]/30 bg-[#00e0ff]/10 text-xs">
              <strong className="text-[#00e0ff]">Preview:</strong> Main HE ~{dp.heMain}% · Tie ~{dp.heTie}% · RTP ~{dp.rtp}%
              {warnRtp(dp.rtp) && <div className="mt-2 p-2 rounded-lg bg-[#ff3366]/20 text-[#ff3366] font-bold">{warnRtp(dp.rtp)}</div>}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" className="flex-1 py-3 rounded-xl bg-[#00e0ff] text-black font-bold text-sm" onClick={() => activateDragon()} disabled={pending}>
                Kích hoạt ngay
              </button>
              <button
                type="button"
                className="flex-1 py-3 rounded-xl border-2 border-[#00e0ff] text-[#00e0ff] font-bold text-sm"
                onClick={() => openScheduleSheet('Dragon Tiger')}
              >
                Lịch hẹn giờ
              </button>
              <button type="button" className="py-3 px-3 rounded-xl bg-[#ff3366] text-white font-bold text-sm" onClick={resetDragon}>
                Default
              </button>
            </div>
            {statusMsg.dragon && <div className="mt-3 p-3 rounded-xl bg-[#00ff99]/25 text-[#00ff99] font-bold text-center text-xs">{statusMsg.dragon}</div>}
          </div>
        )}

        {tab === 'baicao' && (
          <div className="bg-[#141426] rounded-[20px] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.6)]">
            <h2 className="text-lg font-bold text-[#00e0ff] mb-4">Bài Cào</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#a0a0cc] mb-1 font-medium">Player ×</label>
                <input type="number" step="0.01" min={0.5} max={3} className={inputCls} value={bcPlayer} onChange={(e) => setBcPlayer(parseFloat(e.target.value) || 1)} />
              </div>
              <div>
                <label className="block text-xs text-[#a0a0cc] mb-1 font-medium">Banker ×</label>
                <input type="number" step="0.01" min={0.5} max={3} className={inputCls} value={bcBanker} onChange={(e) => setBcBanker(parseFloat(e.target.value) || 1)} />
              </div>
            </div>
            <div className="mt-4 p-3 rounded-2xl border border-[#00e0ff]/30 bg-[#00e0ff]/10 text-xs">
              <strong className="text-[#00e0ff]">Preview:</strong> HE ~{bp.he}% · RTP ~{bp.rtp}%
              {warnRtp(bp.rtp) && <div className="mt-2 p-2 rounded-lg bg-[#ff3366]/20 text-[#ff3366] font-bold">{warnRtp(bp.rtp)}</div>}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" className="flex-1 py-3 rounded-xl bg-[#00e0ff] text-black font-bold text-sm" onClick={() => activateBaicao()} disabled={pending}>
                Kích hoạt ngay
              </button>
              <button
                type="button"
                className="flex-1 py-3 rounded-xl border-2 border-[#00e0ff] text-[#00e0ff] font-bold text-sm"
                onClick={() => openScheduleSheet('Bài Cào')}
              >
                Lịch hẹn giờ
              </button>
              <button type="button" className="py-3 px-3 rounded-xl bg-[#ff3366] text-white font-bold text-sm" onClick={resetBaicao}>
                Default
              </button>
            </div>
            {statusMsg.baicao && <div className="mt-3 p-3 rounded-xl bg-[#00ff99]/25 text-[#00ff99] font-bold text-center text-xs">{statusMsg.baicao}</div>}
          </div>
        )}
      </div>

      <div
        className={`fixed inset-0 z-[100] bg-black/50 transition-opacity ${sheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSheetOpen(false)}
      />
      <div
        className={`fixed left-0 right-0 bottom-0 z-[101] bg-[#111122] rounded-t-[28px] shadow-[0_-15px_50px_rgba(0,0,0,0.8)] max-h-[88vh] overflow-y-auto px-5 pt-6 pb-10 transition-transform duration-300 ${
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-[52px] h-1.5 bg-[#555] rounded mx-auto mb-5" />
        <button type="button" className="absolute top-5 right-5 text-3xl text-[#a0a0cc]" onClick={() => setSheetOpen(false)}>
          ×
        </button>
        <h2 className="text-lg font-bold text-[#00e0ff] mb-3">Lịch hẹn giờ – {sheetGame}</h2>
        <p className="text-[11px] text-[#a0a0cc] mb-3">
          <strong>Bắt đầu</strong> mặc định là thời điểm hiện tại khi mở form. Hệ thống lưu khung <strong>HH:mm–HH:mm</strong> (lặp
          mỗi ngày theo giờ server) và các <strong>thứ được chọn</strong>; khi khớp, người chơi nhận đúng tỉ lệ (app làm mới định kỳ).
        </p>
        <label className="block text-xs text-[#a0a0cc] mb-1">Tên lịch</label>
        <input className="w-full mb-3 py-2 px-3 rounded-xl bg-[#0f0f1e] border border-[#2a2a44] text-white text-sm" value={scheduleName} onChange={(e) => setScheduleName(e.target.value)} />
        <label className="block text-xs text-[#a0a0cc] mb-1">Bắt đầu</label>
        <input type="datetime-local" className="w-full mb-3 py-2 px-3 rounded-xl bg-[#0f0f1e] border border-[#2a2a44] text-white text-sm" value={startDt} onChange={(e) => setStartDt(e.target.value)} />
        <label className="block text-xs text-[#a0a0cc] mb-1">Kết thúc</label>
        <input type="datetime-local" className="w-full mb-3 py-2 px-3 rounded-xl bg-[#0f0f1e] border border-[#2a2a44] text-white text-sm" value={endDt} onChange={(e) => setEndDt(e.target.value)} />
        <label className="block text-xs text-[#a0a0cc] mb-2">Áp dụng thứ trong tuần</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {WD_OPTS.map(({ v, l }) => {
            const on = scheduleWeekdays.has(v);
            return (
              <button
                key={v}
                type="button"
                className={`px-3 py-2 rounded-lg text-xs font-bold border-2 transition-colors ${
                  on ? 'border-[#00e0ff] bg-[#00e0ff]/20 text-[#00e0ff]' : 'border-[#2a2a44] text-[#888]'
                }`}
                onClick={() => {
                  setScheduleWeekdays((prev) => {
                    const n = new Set(prev);
                    if (n.has(v)) n.delete(v);
                    else n.add(v);
                    return n;
                  });
                }}
              >
                {l}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-[#666] mb-4">Chọn đủ 7 thứ = mọi ngày. Bỏ bớt thứ = chỉ các ngày đó mới áp dụng khung giờ này.</p>
        <div className="flex gap-2">
          <button type="button" className="flex-1 py-3 rounded-xl bg-[#00e0ff] text-black font-bold text-sm" onClick={saveSchedule} disabled={pending}>
            Lưu & Lên lịch
          </button>
          <button type="button" className="py-3 px-5 rounded-xl bg-[#ff3366] text-white font-bold text-sm" onClick={() => setSheetOpen(false)}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
