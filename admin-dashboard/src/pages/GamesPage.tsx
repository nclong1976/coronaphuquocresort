import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';

/** Khung giờ cả ngày — đồng bộ với backend GamePayoutConfig + getTimedPayoutRatio */
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

/** Sic Bo DB: grossWin = stake * ratio. UI 1:(ratio-1). Ô admin = x trong 1:x → ratio = 1+x. */
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

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Tab = 'tiger' | 'sic' | 'dragon' | 'baicao';

function localInputToHHMM(s: string): string {
  if (!s) return '00:00';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '00:00';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function readRatio(
  configs: Array<{
    gameId: string;
    optionKey: string;
    ratio: number;
    startTime: string;
    endTime: string;
    weekdays?: number[] | null;
  }>,
  gameId: string,
  optionKey: string
): number | undefined {
  const rows = configs.filter((c) => c.gameId === gameId && c.optionKey === optionKey);
  if (!rows.length) return undefined;
  const iso = getIsoWeekdayMon1Sun7(new Date());
  const applies = (r: (typeof rows)[0]) => {
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

// —— Preview (port từ admin.html) ——
function tigerPreview(banker: number, player: number, _tie: number) {
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
  `shrink-0 px-5 py-4 text-center cursor-pointer font-bold text-sm whitespace-nowrap transition-all border-r border-[#2a2a44] last:border-r-0 ${
    active ? 'bg-[#00e0ff] text-black scale-[1.02]' : 'text-[#f0f0ff] hover:bg-[#1a1a2e]'
  }`;

const inputCls =
  'w-full py-4 px-3 border-2 border-[#2a2a44] rounded-xl bg-[#0f0f1e] text-white text-xl text-center focus:border-[#00e0ff] focus:outline-none focus:ring-4 focus:ring-[#00e0ff]/25';

export function GamesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('tiger');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetGame, setSheetGame] = useState('');
  const [scheduleName, setScheduleName] = useState('Khuyến mãi đêm');
  const [startDt, setStartDt] = useState('');
  const [endDt, setEndDt] = useState('');

  const { data: cfgData } = useQuery({ queryKey: ['admin-payout-configs'], queryFn: () => adminApi.payoutConfigs() });
  const { data: gamesData } = useQuery({ queryKey: ['admin-games'], queryFn: () => adminApi.games() });
  const { data: livePayout } = useQuery({
    queryKey: ['admin-payout-live'],
    queryFn: () => adminApi.payoutLive(),
    refetchInterval: 15_000,
  });
  const configs = cfgData?.configs ?? [];

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
  const [scheduleWeekdays, setScheduleWeekdays] = useState(() => new Set([1, 2, 3, 4, 5, 6, 7]));

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

  const bulkMut = useMutation({
    mutationFn: adminApi.applyPayoutBulk,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-payout-configs'] });
      qc.invalidateQueries({ queryKey: ['admin-games'] });
      qc.invalidateQueries({ queryKey: ['admin-payout-live'] });
    },
  });

  const updateGameMut = useMutation({
    mutationFn: ({ gameId, data }: { gameId: string; data: { payoutBoost?: boolean } }) => adminApi.updateGame(gameId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-games'] });
      qc.invalidateQueries({ queryKey: ['admin-payout-live'] });
    },
  });

  const sicBoostOn = gamesData?.games?.find((g) => g.gameId === 'sicbo')?.payoutBoost ?? false;

  const tp = useMemo(() => tigerPreview(tBanker, tPlayer, tTie), [tBanker, tPlayer, tTie]);
  const sp = useMemo(() => sicPreview(sBig, sSmall, sTriple), [sBig, sSmall, sTriple]);
  const dp = useMemo(() => dragonPreview(dDragon, dTiger, dTie), [dDragon, dTiger, dTie]);
  const bp = useMemo(() => baicaoPreview(bcPlayer, bcBanker), [bcPlayer, bcBanker]);

  async function activateTiger() {
    await bulkMut.mutateAsync({
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
    await updateGameMut.mutateAsync({ gameId: 'sicbo', data: { payoutBoost: true } });
    await bulkMut.mutateAsync({
      gameId: 'sicbo',
      replaceAll: true,
      entries: [
        { optionKey: 'BIG', ratio: sicBoRatioForDb(sBig), ...FULL_DAY },
        { optionKey: 'SMALL', ratio: sicBoRatioForDb(sSmall), ...FULL_DAY },
      ],
    });
    setStatusMsg((m) => ({ ...m, sic: `Đã áp dụng Sic Bo (Tài/Xỉu) — ${new Date().toLocaleString('vi-VN')}` }));
  }

  async function activateDragon() {
    await bulkMut.mutateAsync({
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
    await bulkMut.mutateAsync({
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
  function resetDragon() {
    setDDragon(1);
    setDTiger(1);
    setDTie(11);
  }
  function resetBaicao() {
    setBcPlayer(1);
    setBcBanker(1);
  }

  const openScheduleSheet = (gameLabel: string) => {
    const now = new Date();
    setSheetGame(gameLabel);
    setStartDt(toDatetimeLocalValue(now));
    setEndDt(toDatetimeLocalValue(new Date(now.getTime() + 2 * 60 * 60 * 1000)));
    setScheduleWeekdays(new Set([1, 2, 3, 4, 5, 6, 7]));
    setSheetOpen(true);
  };

  async function defaultSicBoStandard() {
    try {
      await adminApi.applyPayoutBulk({ gameId: 'sicbo', replaceAll: true, entries: [] });
      await adminApi.updateGame('sicbo', { payoutBoost: false });
      resetSic();
      await qc.invalidateQueries({ queryKey: ['admin-payout-configs'] });
      await qc.invalidateQueries({ queryKey: ['admin-games'] });
      setStatusMsg((m) => ({ ...m, sic: `Đã về tiêu chuẩn 1:1 — ${new Date().toLocaleString('vi-VN')}` }));
    } catch (e) {
      alert((e as Error).message);
    }
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
    const withWd = <T extends { optionKey: string; ratio: number; startTime: string; endTime: string }>(e: T) =>
      wd ? { ...e, weekdays: wd } : e;

    try {
      if (sheetGame.includes('Tiger')) {
        await bulkMut.mutateAsync({
          gameId: 'tigerbaccarat',
          replaceAll: false,
          entries: [
            withWd({ optionKey: 'PLAYER', ratio: 2 * tPlayer, ...range }),
            withWd({ optionKey: 'BANKER', ratio: 1.95 * tBanker, ...range }),
            withWd({ optionKey: 'TIE', ratio: (tTie / 8) * 9, ...range }),
          ],
        });
      } else if (sheetGame.includes('Sic')) {
        await updateGameMut.mutateAsync({ gameId: 'sicbo', data: { payoutBoost: true } });
        await bulkMut.mutateAsync({
          gameId: 'sicbo',
          replaceAll: false,
          entries: [
            withWd({ optionKey: 'BIG', ratio: sicBoRatioForDb(sBig), ...range }),
            withWd({ optionKey: 'SMALL', ratio: sicBoRatioForDb(sSmall), ...range }),
          ],
        });
      } else if (sheetGame.includes('Dragon')) {
        await bulkMut.mutateAsync({
          gameId: 'dragontiger',
          replaceAll: false,
          entries: [
            withWd({ optionKey: 'DRAGON', ratio: 2 * dDragon, ...range }),
            withWd({ optionKey: 'TIGER', ratio: 2 * dTiger, ...range }),
            withWd({ optionKey: 'TIE', ratio: (dTie / 11) * 9, ...range }),
          ],
        });
      } else {
        await bulkMut.mutateAsync({
          gameId: 'baicao',
          replaceAll: false,
          entries: [
            withWd({ optionKey: 'PLAYER', ratio: 2 * bcPlayer, ...range }),
            withWd({ optionKey: 'BANKER', ratio: 1.95 * bcBanker, ...range }),
            withWd({ optionKey: 'TIE', ratio: 9, ...range }),
          ],
        });
      }
      setSheetOpen(false);
      alert(`Đã lưu lịch: ${scheduleName}`);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  const err = bulkMut.error?.message || updateGameMut.error?.message;

  return (
    <div className="min-h-full bg-[#0a0a14] text-[#f0f0ff] pb-28 font-sans antialiased">
      <style>{`
        @keyframes payout-shimmer { 0% { transform: translateX(-150%) skewX(-25deg); } 100% { transform: translateX(150%) skewX(-25deg); } }
        .payout-shimmer { animation: payout-shimmer 4s infinite ease-in-out; }
      `}</style>

      <header className="text-center py-6 text-xl font-bold text-[#00e0ff] tracking-wide">Corona Admin – Payout Control v8</header>
      <p className="text-center text-xs text-[#a0a0cc] px-4 -mt-2 pb-4 max-w-xl mx-auto">
        Tỉ lệ ghi vào <code className="text-[#00e0ff]">GamePayoutConfig</code> — app người chơi (Casino: Tiger Baccarat, Long Hổ, Bài Cào, Sic Bo API){' '}
        đọc trực tiếp khi tính thưởng. Sic Bo cần <strong className="text-[#00ff99]">Bật payoutBoost</strong> (tự bật khi Kích hoạt).
      </p>

      {err && <div className="mx-4 mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">{err}</div>}

      {livePayout && (
        <div className="mx-4 mb-4 p-4 rounded-2xl border border-[#00e0ff]/40 bg-[#00e0ff]/10 text-xs text-[#c8c8e6] leading-relaxed">
          <div className="font-bold text-[#00e0ff] mb-1">Đang áp dụng trên server (giống người chơi)</div>
          <div>
            Giờ {livePayout.serverTime} · Hôm nay: {WD_OPTS.find((x) => x.v === livePayout.isoWeekday)?.l ?? livePayout.isoWeekday}
          </div>
          <div className="mt-1">
            Sic Bo:{' '}
            {livePayout.sicbo.payoutBoost
              ? `Tài 1:${Math.max(0, livePayout.sicbo.BIG - 1).toFixed(2)} · Xỉu 1:${Math.max(0, livePayout.sicbo.SMALL - 1).toFixed(2)}`
              : '1:1 (tắt boost)'}
            {livePayout.sicbo.activeWindow && (
              <span className="text-[#a0a0cc]">
                {' '}
                · {livePayout.sicbo.activeWindow.startTime}–{livePayout.sicbo.activeWindow.endTime} (
                {formatWdList(livePayout.sicbo.activeWindow.weekdays)})
              </span>
            )}
          </div>
          <div className="mt-1 font-mono text-[10px] text-[#a8a8c8]">
            Tiger P/B/T: {livePayout.tigerbaccarat.PLAYER.toFixed(2)} / {livePayout.tigerbaccarat.BANKER.toFixed(2)} /{' '}
            {livePayout.tigerbaccarat.TIE.toFixed(2)} · Long Hổ: {livePayout.dragontiger.DRAGON.toFixed(2)} /{' '}
            {livePayout.dragontiger.TIGER.toFixed(2)} / {livePayout.dragontiger.TIE.toFixed(2)} · Bài Cào:{' '}
            {livePayout.baicao.PLAYER.toFixed(2)} / {livePayout.baicao.BANKER.toFixed(2)} / {livePayout.baicao.TIE.toFixed(2)}
          </div>
        </div>
      )}

      <div className="flex overflow-x-auto mx-3 mb-6 rounded-2xl bg-[#141426] shadow-[0_8px_25px_rgba(0,0,0,0.7)] scrollbar-none">
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

      <div className="px-3 max-w-[760px] mx-auto space-y-6">
        {tab === 'tiger' && (
          <div className="bg-[#141426] rounded-[20px] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.6)]">
            <h2 className="text-xl font-bold text-[#00e0ff] mb-5">Tiger Baccarat</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#a0a0cc] mb-1.5 font-medium">Banker ×</label>
                <input type="number" step="0.01" min={0.5} max={3} className={inputCls} value={tBanker} onChange={(e) => setTBanker(parseFloat(e.target.value) || 1)} />
              </div>
              <div>
                <label className="block text-sm text-[#a0a0cc] mb-1.5 font-medium">Player ×</label>
                <input type="number" step="0.01" min={0.5} max={3} className={inputCls} value={tPlayer} onChange={(e) => setTPlayer(parseFloat(e.target.value) || 1)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-[#a0a0cc] mb-1.5 font-medium">Tie ×</label>
                <input type="number" step={0.5} min={5} max={15} className={inputCls} value={tTie} onChange={(e) => setTTie(parseFloat(e.target.value) || 8)} />
              </div>
            </div>
            <div className="mt-6 p-4 rounded-2xl border border-[#00e0ff]/30 bg-[#00e0ff]/10 text-sm leading-relaxed">
              <strong className="text-[#00e0ff]">Preview realtime:</strong>
              <br />
              House Edge Banker: ~{tp.heB}%<br />
              Player: ~{tp.heP}%<br />
              RTP tổng: ~{tp.rtp}%
              {warnRtp(tp.rtp) && <div className="mt-2 p-3 rounded-lg bg-[#ff3366]/20 text-[#ff3366] font-bold">{warnRtp(tp.rtp)}</div>}
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              <button type="button" className="flex-1 min-w-[120px] py-4 rounded-xl bg-[#00e0ff] text-black font-bold active:scale-[0.98]" onClick={() => activateTiger()} disabled={bulkMut.isPending}>
                Kích hoạt ngay
              </button>
              <button
                type="button"
                className="flex-1 min-w-[120px] py-4 rounded-xl border-2 border-[#00e0ff] text-[#00e0ff] font-bold bg-transparent"
                onClick={() => openScheduleSheet('Tiger Baccarat')}
              >
                Lịch hẹn giờ
              </button>
              <button type="button" className="flex-1 min-w-[100px] py-4 rounded-xl bg-[#ff3366] text-white font-bold" onClick={resetTiger}>
                Default
              </button>
            </div>
            {statusMsg.tiger && <div className="mt-4 p-4 rounded-xl bg-[#00ff99]/25 text-[#00ff99] font-bold text-center text-sm">{statusMsg.tiger}</div>}
          </div>
        )}

        {tab === 'sic' && (
          <div className="bg-[#141426] rounded-[20px] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.6)]">
            <h2 className="text-xl font-bold text-[#00e0ff] mb-2">Sic Bo (Tài / Xỉu)</h2>
            <p className="text-xs text-[#a0a0cc] mb-4">
              PayoutBoost: {sicBoostOn ? 'BẬT (dùng tỉ lệ dưới đây)' : 'TẮT (app đang 1:1 mặc định)'} · Ô dưới là{' '}
              <strong className="text-[#00ff99]">1:x</strong> (tiền thắng / cược), ví dụ 2.1 → app hiện 1:2.1
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#a0a0cc] mb-1.5 font-medium">Tài (Big) 1:x</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={sBig}
                  onChange={(e) => setSBig(parseLocaleNumber(e.target.value, sBig))}
                />
              </div>
              <div>
                <label className="block text-sm text-[#a0a0cc] mb-1.5 font-medium">Xỉu (Small) 1:x</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={sSmall}
                  onChange={(e) => setSSmall(parseLocaleNumber(e.target.value, sSmall))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-[#a0a0cc] mb-1.5 font-medium">Any Triple × (minh họa — backend chưa áp cửa triple)</label>
                <input type="number" step={1} min={15} max={50} className={inputCls} value={sTriple} onChange={(e) => setSTriple(parseFloat(e.target.value) || 30)} />
              </div>
            </div>
            <div className="mt-6 p-4 rounded-2xl border border-[#00e0ff]/30 bg-[#00e0ff]/10 text-sm">
              <strong className="text-[#00e0ff]">Preview realtime:</strong>
              <br />
              House Edge Tài/Xỉu: ~{sp.heTaixiu}%<br />
              Any Triple: ~{sp.heTriple}%<br />
              RTP tổng: ~{sp.rtp}%
              {warnRtp(sp.rtp) && <div className="mt-2 p-3 rounded-lg bg-[#ff3366]/20 text-[#ff3366] font-bold">{warnRtp(sp.rtp)}</div>}
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              <button type="button" className="flex-1 py-4 rounded-xl bg-[#00e0ff] text-black font-bold" onClick={() => activateSic()} disabled={bulkMut.isPending || updateGameMut.isPending}>
                Kích hoạt ngay
              </button>
              <button
                type="button"
                className="flex-1 py-4 rounded-xl border-2 border-[#00e0ff] text-[#00e0ff] font-bold"
                onClick={() => openScheduleSheet('Sic Bo')}
              >
                Lịch hẹn giờ
              </button>
              <button
                type="button"
                className="py-4 px-4 rounded-xl bg-[#ff3366] text-white font-bold"
                onClick={() => void defaultSicBoStandard()}
                disabled={bulkMut.isPending || updateGameMut.isPending}
              >
                Default
              </button>
            </div>
            {statusMsg.sic && <div className="mt-4 p-4 rounded-xl bg-[#00ff99]/25 text-[#00ff99] font-bold text-center text-sm">{statusMsg.sic}</div>}
          </div>
        )}

        {tab === 'dragon' && (
          <div className="bg-[#141426] rounded-[20px] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.6)]">
            <h2 className="text-xl font-bold text-[#00e0ff] mb-5">Dragon Tiger (Baccarat Long Hổ)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#a0a0cc] mb-1.5 font-medium">Dragon ×</label>
                <input type="number" step="0.01" min={0.5} max={3} className={inputCls} value={dDragon} onChange={(e) => setDDragon(parseFloat(e.target.value) || 1)} />
              </div>
              <div>
                <label className="block text-sm text-[#a0a0cc] mb-1.5 font-medium">Tiger ×</label>
                <input type="number" step="0.01" min={0.5} max={3} className={inputCls} value={dTiger} onChange={(e) => setDTiger(parseFloat(e.target.value) || 1)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-[#a0a0cc] mb-1.5 font-medium">Tie ×</label>
                <input type="number" step={0.5} min={5} max={20} className={inputCls} value={dTie} onChange={(e) => setDTie(parseFloat(e.target.value) || 11)} />
              </div>
            </div>
            <div className="mt-6 p-4 rounded-2xl border border-[#00e0ff]/30 bg-[#00e0ff]/10 text-sm">
              <strong className="text-[#00e0ff]">Preview realtime:</strong>
              <br />
              House Edge Dragon/Tiger: ~{dp.heMain}%<br />
              Tie: ~{dp.heTie}%<br />
              RTP tổng: ~{dp.rtp}%
              {warnRtp(dp.rtp) && <div className="mt-2 p-3 rounded-lg bg-[#ff3366]/20 text-[#ff3366] font-bold">{warnRtp(dp.rtp)}</div>}
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              <button type="button" className="flex-1 py-4 rounded-xl bg-[#00e0ff] text-black font-bold" onClick={() => activateDragon()} disabled={bulkMut.isPending}>
                Kích hoạt ngay
              </button>
              <button
                type="button"
                className="flex-1 py-4 rounded-xl border-2 border-[#00e0ff] text-[#00e0ff] font-bold"
                onClick={() => openScheduleSheet('Dragon Tiger')}
              >
                Lịch hẹn giờ
              </button>
              <button type="button" className="py-4 px-4 rounded-xl bg-[#ff3366] text-white font-bold" onClick={resetDragon}>
                Default
              </button>
            </div>
            {statusMsg.dragon && <div className="mt-4 p-4 rounded-xl bg-[#00ff99]/25 text-[#00ff99] font-bold text-center text-sm">{statusMsg.dragon}</div>}
          </div>
        )}

        {tab === 'baicao' && (
          <div className="bg-[#141426] rounded-[20px] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.6)]">
            <h2 className="text-xl font-bold text-[#00e0ff] mb-5">Bài Cào</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#a0a0cc] mb-1.5 font-medium">Player ×</label>
                <input type="number" step="0.01" min={0.5} max={3} className={inputCls} value={bcPlayer} onChange={(e) => setBcPlayer(parseFloat(e.target.value) || 1)} />
              </div>
              <div>
                <label className="block text-sm text-[#a0a0cc] mb-1.5 font-medium">Banker ×</label>
                <input type="number" step="0.01" min={0.5} max={3} className={inputCls} value={bcBanker} onChange={(e) => setBcBanker(parseFloat(e.target.value) || 1)} />
              </div>
            </div>
            <div className="mt-6 p-4 rounded-2xl border border-[#00e0ff]/30 bg-[#00e0ff]/10 text-sm">
              <strong className="text-[#00e0ff]">Preview realtime:</strong>
              <br />
              House Edge Player/Banker: ~{bp.he}%<br />
              RTP tổng: ~{bp.rtp}%
              {warnRtp(bp.rtp) && <div className="mt-2 p-3 rounded-lg bg-[#ff3366]/20 text-[#ff3366] font-bold">{warnRtp(bp.rtp)}</div>}
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              <button type="button" className="flex-1 py-4 rounded-xl bg-[#00e0ff] text-black font-bold" onClick={() => activateBaicao()} disabled={bulkMut.isPending}>
                Kích hoạt ngay
              </button>
              <button
                type="button"
                className="flex-1 py-4 rounded-xl border-2 border-[#00e0ff] text-[#00e0ff] font-bold"
                onClick={() => openScheduleSheet('Bài Cào')}
              >
                Lịch hẹn giờ
              </button>
              <button type="button" className="py-4 px-4 rounded-xl bg-[#ff3366] text-white font-bold" onClick={resetBaicao}>
                Default
              </button>
            </div>
            {statusMsg.baicao && <div className="mt-4 p-4 rounded-xl bg-[#00ff99]/25 text-[#00ff99] font-bold text-center text-sm">{statusMsg.baicao}</div>}
          </div>
        )}
      </div>

      {/* Bottom sheet scheduler */}
      <div
        className={`fixed inset-0 z-[100] bg-black/50 transition-opacity ${sheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSheetOpen(false)}
      />
      <div
        className={`fixed left-0 right-0 bottom-0 z-[101] bg-[#111122] rounded-t-[28px] shadow-[0_-15px_50px_rgba(0,0,0,0.8)] max-h-[88vh] overflow-y-auto px-5 pt-6 pb-10 transition-transform duration-300 ${
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-[52px] h-1.5 bg-[#555] rounded mx-auto mb-6" />
        <button type="button" className="absolute top-5 right-5 text-3xl text-[#a0a0cc]" onClick={() => setSheetOpen(false)}>
          ×
        </button>
        <h2 className="text-lg font-bold text-[#00e0ff] mb-4">Lịch hẹn giờ – {sheetGame}</h2>
        <p className="text-xs text-[#a0a0cc] mb-4">
          <strong>Bắt đầu</strong> mặc định là thời điểm hiện tại khi mở form. Hệ thống lưu khung <strong>HH:mm–HH:mm</strong> (lặp mỗi ngày
          theo giờ server) và các <strong>thứ được chọn</strong>; người chơi nhận đúng tỉ lệ khi khớp khung + thứ.
        </p>
        <label className="block text-sm text-[#a0a0cc] mb-1">Tên lịch</label>
        <input className="w-full mb-4 py-3 px-3 rounded-xl bg-[#0f0f1e] border border-[#2a2a44] text-white" value={scheduleName} onChange={(e) => setScheduleName(e.target.value)} />
        <label className="block text-sm text-[#a0a0cc] mb-1">Bắt đầu</label>
        <input type="datetime-local" className="w-full mb-4 py-3 px-3 rounded-xl bg-[#0f0f1e] border border-[#2a2a44] text-white" value={startDt} onChange={(e) => setStartDt(e.target.value)} />
        <label className="block text-sm text-[#a0a0cc] mb-1">Kết thúc</label>
        <input type="datetime-local" className="w-full mb-3 py-3 px-3 rounded-xl bg-[#0f0f1e] border border-[#2a2a44] text-white" value={endDt} onChange={(e) => setEndDt(e.target.value)} />
        <label className="block text-sm text-[#a0a0cc] mb-2">Áp dụng thứ trong tuần</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {WD_OPTS.map(({ v, l }) => {
            const on = scheduleWeekdays.has(v);
            return (
              <button
                key={v}
                type="button"
                className={`px-3 py-2 rounded-lg text-xs font-bold border-2 ${
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
        <p className="text-[10px] text-[#666] mb-6">Đủ 7 thứ = mọi ngày. Bỏ bớt = chỉ các ngày đó áp khung giờ này.</p>
        <div className="flex gap-3">
          <button type="button" className="flex-1 py-4 rounded-xl bg-[#00e0ff] text-black font-bold" onClick={saveSchedule} disabled={bulkMut.isPending}>
            Lưu & Lên lịch
          </button>
          <button type="button" className="py-4 px-6 rounded-xl bg-[#ff3366] text-white font-bold" onClick={() => setSheetOpen(false)}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
