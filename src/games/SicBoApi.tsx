/**
 * Sic Bo - Server-side version. Giao diện giống sicbo.html, logic gọi API.
 * Timer 4:59, Shake/Open animation, Modal xác nhận, Input tiền tùy ý, Lịch sử cược, Âm thanh, Socket.io.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, Wallet, WifiOff, History as HistoryIcon, Radio, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { gameApi, betsApi } from '../api/client';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useAppSocket } from '../context/SocketContext';
import type { GameCatalogPayload, SicBoPayoutResponse, SicBoMeta } from '../api/client';
import { SicBoGameChat } from '../components/SicBoGameChat';
import { SicBoToast } from '../components/SicBoToast';
import { LuxuryWalletBar } from '../components/LuxuryWalletBar';
import confetti from 'canvas-confetti';


const CHIPS = [
  { val: '10', amount: 10, tier: 0 },
  { val: '50', amount: 50, tier: 1 },
  { val: '100', amount: 100, tier: 2 },
  { val: '500', amount: 500, tier: 3 },
  { val: '1K', amount: 1000, tier: 4 },
  { val: '50%', amount: 0, tier: 5, isPercent50: true },
];

type FlyChipParticle = {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  rot0: number;
  tier: number;
  delay: number;
};

/** Chip casino — viền kim loại, lõi màu, vòng dashed giống chip thật */
function CasinoChipVisual({
  size = 44,
  tier,
  label,
  className = '',
}: {
  size?: number;
  tier: number;
  label?: string;
  className?: string;
}) {
  const rings = [
    { edge: 'from-zinc-800 via-zinc-300 to-zinc-700', face: 'from-slate-200 to-slate-500', ink: 'text-slate-900' },
    { edge: 'from-blue-950 via-sky-300 to-blue-900', face: 'from-blue-500 to-blue-950', ink: 'text-white' },
    { edge: 'from-amber-900 via-[#fceea3] to-amber-800', face: 'from-[#d4af37] to-[#4a3208]', ink: 'text-black' },
    { edge: 'from-violet-950 via-fuchsia-200 to-violet-900', face: 'from-purple-600 to-purple-950', ink: 'text-white' },
    { edge: 'from-red-950 via-rose-300 to-red-900', face: 'from-red-500 to-red-950', ink: 'text-white' },
    { edge: 'from-emerald-950 via-green-300 to-emerald-900', face: 'from-emerald-500 to-emerald-950', ink: 'text-white' },
  ];
  const r = rings[((tier % rings.length) + rings.length) % rings.length];
  const s = size;
  return (
    <div
      className={`relative rounded-full shrink-0 ${className}`}
      style={{
        width: s,
        height: s,
        boxShadow: '0 4px 14px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.4)',
      }}
    >
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${r.edge} p-[3px]`}
        style={{ boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.45)' }}
      >
        <div
          className={`w-full h-full rounded-full bg-gradient-to-br ${r.face} flex items-center justify-center relative overflow-hidden`}
        >
          <div
            className="absolute inset-[5px] rounded-full border-2 border-white/30 border-dashed opacity-95"
            style={{ boxShadow: 'inset 0 0 8px rgba(0,0,0,0.4)' }}
          />
          {label ? (
            <span className={`relative z-[1] font-black text-[9px] sm:text-[10px] tracking-tight ${r.ink} drop-shadow-[0_1px_0_rgba(255,255,255,0.25)]`}>
              {label}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Backend trả tổng hệ số (gồm vốn); ô cược hiển thị 1:(ratio-1) */
function formatSicBoProfitOdds(totalRatio: number): string {
  const x = totalRatio - 1;
  if (!Number.isFinite(x) || x < 0) return '0';
  const s = x.toLocaleString(undefined, { maximumFractionDigits: 3, minimumFractionDigits: 0 });
  return s;
}

const CYCLE_MS = 299_000;
const BETTING_END_MS = 289_000;
const MIN_BET = 10;

type Phase = 'betting' | 'shaking' | 'opening' | 'result_display';

// Âm thanh
const SOUND_SHAKE = 'https://tiengdong.com/wp-content/uploads/Tieng-lac-xuc-xac-www_tiengdong_com.mp3';
const SOUND_TICK = 'https://assets.mixkit.co/active_storage/sfx/2568-key-press-mouse-click-2574.mp3';
const SOUND_WIN = 'https://assets.mixkit.co/active_storage/sfx/2019-success-chime-2574.mp3';

function playSound(url: string, volume = 1) {
  try {
    const a = new Audio(url);
    a.volume = volume;
    a.play().catch(() => {});
  } catch {}
}

function useTickSound(timeLeft: number, phase: Phase) {
  const playedRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (phase !== 'betting' || timeLeft > 10 || timeLeft <= 0) return;
    if (playedRef.current.has(timeLeft)) return;
    playedRef.current.add(timeLeft);
    playSound(SOUND_TICK, 0.3);
  }, [timeLeft, phase]);
  useEffect(() => {
    if (timeLeft > 10) playedRef.current.clear();
  }, [timeLeft]);
}

/** Chip ở ô cược sau khi xác nhận — xếp lộn xộn (seed cố định theo amount + ô, không nhảy khi re-render) */
function ChipStack({ amount, zoneKey }: { amount: number; zoneKey: 'BIG' | 'SMALL' }) {
  const n = Math.min(Math.max(1, Math.ceil(amount / 80)), 7);
  const label = `$${amount >= 1000 ? amount / 1000 + 'K' : amount}`;
  const chips = useMemo(() => {
    let h = 2166136261 ^ amount;
    for (let i = 0; i < zoneKey.length; i++) h = Math.imul(h ^ zoneKey.charCodeAt(i), 16777619);
    const rnd = () => {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      return ((h >>> 0) & 0xfffffff) / 0xfffffff;
    };
    return Array.from({ length: n }, (_, i) => ({
      x: (rnd() - 0.5) * 56,
      y: (rnd() - 0.5) * 40 + i * 3,
      rot: (rnd() - 0.5) * 48,
      tier: (i + amount) % 5,
      z: i,
    }));
  }, [amount, n, zoneKey]);

  return (
    <div className="absolute inset-x-1 bottom-1 top-10 pointer-events-none overflow-visible">
      <div className="relative w-full h-full">
        {chips.map((c, i) => (
          <motion.div
            key={`${zoneKey}-${amount}-${i}`}
            className="absolute left-1/2 top-[55%]"
            style={{
              marginLeft: c.x - 19,
              marginTop: c.y - 19,
              zIndex: 10 + c.z,
            }}
            initial={{ scale: 0.35, opacity: 0, rotate: c.rot - 25 }}
            animate={{ scale: 1, opacity: 1, rotate: c.rot }}
            transition={{ delay: i * 0.045, type: 'spring', stiffness: 420, damping: 22 }}
          >
            <CasinoChipVisual size={38} tier={c.tier} label={i === 0 ? label : undefined} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const DiceFace = ({ value, className, shaking }: { value: number; className?: string; shaking?: boolean }) => (
  <div
    className={`gold-gradient rounded-lg dice-shadow flex items-center justify-center ${className || 'size-10 sm:size-12'} ${shaking ? 'animate-dice-shake' : ''}`}
  >
    <div className="grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5 w-full h-full">
      {[...Array(9)].map((_, i) => {
        const show =
          (value === 1 && i === 4) ||
          (value === 2 && (i === 0 || i === 8)) ||
          (value === 3 && (i === 0 || i === 4 || i === 8)) ||
          (value === 4 && (i === 0 || i === 2 || i === 6 || i === 8)) ||
          (value === 5 && (i === 0 || i === 2 || i === 4 || i === 6 || i === 8)) ||
          (value === 6 && (i === 0 || i === 2 || i === 3 || i === 5 || i === 6 || i === 8));
        return (
          <div
            key={i}
            className={`rounded-full ${show ? (value === 1 || value === 4 ? 'bg-red-600' : 'bg-slate-900') : 'bg-transparent'} size-1.5 mx-auto my-auto`}
          />
        );
      })}
    </div>
  </div>
);

interface BetHistoryItem {
  id: string;
  betAmount: number;
  betData: Record<string, number>;
  result: string | null;
  payout: number;
  createdAt: string;
}

export function SicBoApi({ onBack }: { onBack: () => void }) {
  const { balance, isOnline, isSyncing, syncBalance, setBalanceFromGame } = useWallet();
  const { user } = useAuth();
  const { socket } = useAppSocket();
  const [showChat, setShowChat] = useState(false);
  const [viewerCount, setViewerCount] = useState(() => 1450 + Math.floor(Math.random() * 850));

  // Cập nhật số người xem định kỳ - tạo cảm giác truyền hình trực tiếp
  useEffect(() => {
    const t = setInterval(() => {
      setViewerCount((v) => Math.max(1000, v + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 12)));
    }, 15000);
    return () => clearInterval(t);
  }, []);

  const [bets, setBets] = useState({ BIG: 0, SMALL: 0 });
  const [placedBets, setPlacedBets] = useState({ BIG: 0, SMALL: 0 }); // Hiển thị chip sau khi xác nhận
  const [payoutRatio, setPayoutRatio] = useState({ BIG: 2, SMALL: 2 }); // Mặc định 1:1 (ratio 2)
  const [sicMeta, setSicMeta] = useState<SicBoMeta | null>(null);

  const applySicPayoutPayload = useCallback((r: SicBoPayoutResponse) => {
    setPayoutRatio({ BIG: r.BIG, SMALL: r.SMALL });
    if (r.serverTime != null) {
      setSicMeta({
        payoutBoost: !!r.payoutBoost,
        activeWindow: r.activeWindow ?? null,
        serverTime: r.serverTime,
        ...(r.isoWeekday != null ? { isoWeekday: r.isoWeekday } : {}),
      });
    }
  }, []);

  // Tỉ lệ: làm mới ~20s để khớp lịch HH:mm khi sang khung giờ; socket khi admin đổi; tab lại trang cũng refetch
  useEffect(() => {
    gameApi.sicboPayout().then(applySicPayoutPayload).catch(() => {});
    const t = setInterval(() => {
      gameApi.sicboPayout().then(applySicPayoutPayload).catch(() => {});
    }, 20_000);
    return () => clearInterval(t);
  }, [applySicPayoutPayload]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        gameApi.sicboPayout().then(applySicPayoutPayload).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [applySicPayoutPayload]);

  useEffect(() => {
    if (!socket) return;
    const onCfg = (payload: GameCatalogPayload) => {
      if (payload?.sicboPayout?.BIG != null && payload?.sicboPayout?.SMALL != null) {
        setPayoutRatio({ BIG: payload.sicboPayout.BIG, SMALL: payload.sicboPayout.SMALL });
      }
      if (payload.sicboMeta) {
        setSicMeta(payload.sicboMeta);
      }
    };
    socket.on('game_config_updated', onCfg);
    return () => {
      socket.off('game_config_updated', onCfg);
    };
  }, [socket]);
  const [selectedChip, setSelectedChip] = useState(CHIPS[2]);
  const [customBetAmount, setCustomBetAmount] = useState('');
  const [flyChips, setFlyChips] = useState<FlyChipParticle[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const bigZoneRef = useRef<HTMLButtonElement>(null);
  const smallZoneRef = useRef<HTMLButtonElement>(null);
  const chipDockRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [pendingRoundId, setPendingRoundId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ dice: number[]; result: string; winAmount: number; sum: number } | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  /** Sau khi mở bát giữ xúc xắc lộ ~3 giây → úp bát lại (giao diện) trong lúc chờ ván sau */
  const [hideResultDice, setHideResultDice] = useState(false);
  const [isSyncingBalance, setIsSyncingBalance] = useState(false);
  const handleRefreshBalance = useCallback(async () => {
    if (isSyncingBalance) return;
    setIsSyncingBalance(true);
    try {
      await syncBalance();
    } catch {}
    setTimeout(() => setIsSyncingBalance(false), 600);
  }, [isSyncingBalance, syncBalance]);

  // Persistence & Reconnection
  const [toast, setToast] = useState<{ betTime: string; won: boolean; winAmount: number } | null>(null);
  const serverSyncRef = useRef<{ serverTime: number; elapsed: number; phase: string } | null>(null);
  const prevOnlineRef = useRef(isOnline);
  const lastResolvedRoundRef = useRef<string | null>(null);

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [betsLocked, setBetsLocked] = useState(false); // Khóa chip sau khi ấn Xác nhận
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [betHistoryList, setBetHistoryList] = useState<BetHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [phase, setPhase] = useState<Phase>('betting');
  const [timeLeft, setTimeLeft] = useState<number>(Math.ceil(BETTING_END_MS / 1000));
  const rafRef = useRef<number>();
  const shakePlayedRef = useRef(false);

  const totalBet = bets.BIG + bets.SMALL;
  const hasPlacedBet = placedBets.BIG > 0 || placedBets.SMALL > 0;
  const canBet = isOnline && !loading && phase === 'betting' && timeLeft > 0 && !hasPlacedBet && !betsLocked;

  useTickSound(timeLeft, phase);

  // Server-side Timer: đồng bộ phase/timeLeft từ server, không phụ thuộc socket
  useEffect(() => {
    if (!isOnline) return;
    const syncFromServer = async () => {
      try {
        const state = await gameApi.sicboState();
        serverSyncRef.current = { serverTime: state.serverTime, elapsed: state.elapsed, phase: state.phase };
        setCurrentRoundId(state.roundId);
        if (state.phase === 'betting') {
          setPhase('betting');
          setTimeLeft(Math.max(0, state.timeLeft));
        } else {
          setPhase(state.elapsed < BETTING_END_MS + 1000 ? 'shaking' : 'opening');
          setTimeLeft(0);
        }
      } catch {
        serverSyncRef.current = null;
      }
    };
    syncFromServer();
    const t = setInterval(syncFromServer, 5000);
    return () => clearInterval(t);
  }, [isOnline]);

  const prevElapsedRef = useRef<number>(0);

  // Timer tick: Server-side timer, tính từ serverTime
  const tick = useCallback(() => {
    const sync = serverSyncRef.current;
    const now = Date.now();
    let elapsed: number;
    let computedRoundId: string;
    if (sync) {
      elapsed = ((sync.elapsed + (now - sync.serverTime)) % CYCLE_MS + CYCLE_MS) % CYCLE_MS;
      const startRoundNum = Math.floor((sync.serverTime - sync.elapsed) / CYCLE_MS);
      const roundsElapsed = Math.floor((sync.elapsed + (now - sync.serverTime)) / CYCLE_MS);
      computedRoundId = `sicbo_${startRoundNum + roundsElapsed}`;
    } else {
      elapsed = now % CYCLE_MS;
      computedRoundId = `sicbo_${Math.floor(now / CYCLE_MS)}`;
    }

    if (computedRoundId !== currentRoundIdRef.current) {
      setCurrentRoundId(computedRoundId);
    }

    const prevElapsed = prevElapsedRef.current;
    prevElapsedRef.current = elapsed;
    if (prevElapsed > CYCLE_MS * 0.8 && elapsed < CYCLE_MS * 0.2) {
      setLastResult(null);
      setPlacedBets({ BIG: 0, SMALL: 0 });
      setBetsLocked(false);
      setPendingRoundId(null);
    }
    if (elapsed < BETTING_END_MS) {
      setPhase('betting');
      setTimeLeft(Math.max(0, Math.ceil((BETTING_END_MS - elapsed) / 1000)));
    } else if (elapsed < BETTING_END_MS + 1000) {
      setPhase('shaking');
      setTimeLeft(0);
    } else {
      setPhase('opening');
      setTimeLeft(0);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // On mount & reconnect: restore pending bet từ server (Persistence)
  useEffect(() => {
    if (!user) return;
    if (isOnline) {
      (async () => {
        try {
          const pending = await gameApi.sicboMyPending();
          if (pending.hasPending && pending.bets) {
            setPlacedBets(pending.bets);
            setPendingRoundId(pending.roundId);
            setBetsLocked(true);
          }
        } catch {
          try {
            const raw = localStorage.getItem('sicbo_pending');
            if (raw) {
              const data = JSON.parse(raw);
              if (data?.bets && Date.now() - (data.at ?? 0) < 600000) {
                setPlacedBets(data.bets);
                setPendingRoundId(data.roundId);
                setBetsLocked(true);
              }
            }
          } catch {}
        }
      })();
    } else {
      try {
        const raw = localStorage.getItem('sicbo_pending');
        if (raw) {
          const { roundId, bets: savedBets } = JSON.parse(raw);
          if (savedBets) {
            setPlacedBets(savedBets);
            setPendingRoundId(roundId);
            setBetsLocked(true);
          }
        }
      } catch {}
    }
  }, [isOnline, user?.id]);

  // On reconnect: kiểm tra ván vừa kết thúc, hiển thị Toast
  useEffect(() => {
    if (!isOnline || !user) return;
    const wasOffline = !prevOnlineRef.current;
    prevOnlineRef.current = isOnline;
    if (!wasOffline) return;

    (async () => {
      try {
        const { bets: list } = await betsApi.list('sicbo', 5);
        const resolved = list.find((b) => b.result != null);
        if (!resolved || resolved.roundId === lastResolvedRoundRef.current) return;
        lastResolvedRoundRef.current = resolved.roundId ?? null;
        const betTime = new Date(resolved.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const won = (resolved.payout ?? 0) > 0;
        setToast({ betTime, won, winAmount: resolved.payout ?? 0 });
      } catch {}
    })();
  }, [isOnline, user?.id]);

  // Socket: chỉ dùng cho chat, KHÔNG ảnh hưởng logic cược (Decoupling)

  // Quy tắc: Chọn ô cược -> số tiền (chip hoặc custom) -> chơi
  const [selectedZones, setSelectedZones] = useState<{ BIG: boolean; SMALL: boolean }>({ BIG: false, SMALL: false });
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const currentRoundIdRef = useRef<string | null>(null);
  const prevRoundIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentRoundIdRef.current = currentRoundId;
    if (currentRoundId && prevRoundIdRef.current && currentRoundId !== prevRoundIdRef.current) {
      setLastResult(null);
      setPlacedBets({ BIG: 0, SMALL: 0 });
      setBetsLocked(false);
      setPendingRoundId(null);
    }
    if (currentRoundId) {
      prevRoundIdRef.current = currentRoundId;
    }
  }, [currentRoundId]);

  const handleZoneSelect = (zone: 'BIG' | 'SMALL') => {
    if (!canBet) return;
    setSelectedZones((prev) => {
      const next = { ...prev, [zone]: !prev[zone] };
      if (!next[zone]) {
        setBets((b) => ({ ...b, [zone]: 0 }));
      }
      return next;
    });
  };

  const handleChipClick = (chip: (typeof CHIPS)[0]) => {
    if (!canBet || (!selectedZones.BIG && !selectedZones.SMALL)) return;
    setSelectedChip(chip);

    if (chip.isPercent50) {
      const half = Math.floor(balance / 2);
      if (half <= 0) return;
      setBets((prev) => {
        const next = { ...prev };
        if (selectedZones.BIG) next.BIG = half;
        if (selectedZones.SMALL) next.SMALL = half;
        return next;
      });
      return;
    }

    const amount = chip.amount;
    let count = 0;
    if (selectedZones.BIG) count++;
    if (selectedZones.SMALL) count++;
    const needed = amount * count;
    if (balance < totalBet + needed) return;
    
    setBets((prev) => {
      const next = { ...prev };
      if (selectedZones.BIG) next.BIG = (next.BIG || 0) + amount;
      if (selectedZones.SMALL) next.SMALL = (next.SMALL || 0) + amount;
      return next;
    });
  };

  const handleCustomBetAdd = () => {
    if (!canBet || (!selectedZones.BIG && !selectedZones.SMALL)) return;
    const amt = parseInt(customBetAmount, 10);
    if (!Number.isFinite(amt) || amt < MIN_BET) return;
    let count = 0;
    if (selectedZones.BIG) count++;
    if (selectedZones.SMALL) count++;
    const needed = amt * count;
    if (balance < totalBet + needed) return;
    
    setBets((prev) => {
      const next = { ...prev };
      if (selectedZones.BIG) next.BIG = (next.BIG || 0) + amt;
      if (selectedZones.SMALL) next.SMALL = (next.SMALL || 0) + amt;
      return next;
    });
    setCustomBetAmount('');
  };

  const handlePlayClick = () => {
    if (totalBet <= 0 || loading || !isOnline || !canBet) return;
    setShowConfirmModal(true);
  };

  const launchBetChipFX = useCallback((snap: { BIG: number; SMALL: number }) => {
    const board = boardRef.current;
    if (!board) return;
    const br = board.getBoundingClientRect();
    const bigEl = bigZoneRef.current;
    const smallEl = smallZoneRef.current;
    const dockR = chipDockRef.current?.getBoundingClientRect();

    const spawn = (amount: number, zoneEl: HTMLButtonElement | null, zoneKey: string): FlyChipParticle[] => {
      if (amount <= 0 || !zoneEl) return [];
      const tr = zoneEl.getBoundingClientRect();
      const count = Math.min(18, Math.max(7, Math.ceil(amount / 70)));
      const out: FlyChipParticle[] = [];
      for (let i = 0; i < count; i++) {
        const baseX = dockR ? dockR.left + dockR.width * (0.12 + Math.random() * 0.76) : br.left + br.width * 0.5;
        const baseY = dockR ? dockR.top + dockR.height * 0.25 : br.bottom - 40;
        const x0 = baseX - br.left + (Math.random() - 0.5) * 56;
        const y0 = baseY - br.top + (Math.random() - 0.5) * 28;
        const x1 =
          tr.left -
          br.left +
          tr.width * (0.22 + Math.random() * 0.56) +
          (Math.random() - 0.5) * 36;
        const y1 =
          tr.top - br.top + tr.height * (0.42 + Math.random() * 0.38) + (Math.random() - 0.5) * 22;
        out.push({
          id: `${zoneKey}-${Date.now()}-${i}`,
          x0,
          y0,
          x1,
          y1,
          rot0: (Math.random() - 0.5) * 110,
          tier: (i + Math.floor(amount / 50)) % 5,
          delay: i * 0.026 + (zoneKey === 'SMALL' ? 0.08 : 0),
        });
      }
      return out;
    };

    const next = [...spawn(snap.BIG, bigEl, 'BIG'), ...spawn(snap.SMALL, smallEl, 'SMALL')];
    setFlyChips(next);
    window.setTimeout(() => setFlyChips([]), 980);
  }, []);

  /** Chip “người khác” đặt cược — 1–2 chip mỗi ~15 giây trong phiên đặt cược */
  const launchAmbientChips = useCallback(() => {
    const board = boardRef.current;
    const bigEl = bigZoneRef.current;
    const smallEl = smallZoneRef.current;
    if (!board || !bigEl || !smallEl) return;
    const br = board.getBoundingClientRect();
    const dockR = chipDockRef.current?.getBoundingClientRect();
    const n = Math.random() < 0.5 ? 1 : 2;
    const particles: FlyChipParticle[] = [];
    for (let k = 0; k < n; k++) {
      const zone: 'BIG' | 'SMALL' = Math.random() < 0.5 ? 'BIG' : 'SMALL';
      const zoneEl = zone === 'BIG' ? bigEl : smallEl;
      const tr = zoneEl.getBoundingClientRect();
      const baseX = dockR
        ? dockR.left + dockR.width * (0.08 + Math.random() * 0.84)
        : br.left + br.width * (0.15 + Math.random() * 0.7);
      const baseY = dockR ? dockR.top + Math.random() * Math.max(8, dockR.height * 0.55) : br.top + br.height * 0.72;
      const x0 = baseX - br.left + (Math.random() - 0.5) * 40;
      const y0 = baseY - br.top + (Math.random() - 0.5) * 24;
      const x1 =
        tr.left - br.left + tr.width * (0.26 + Math.random() * 0.48) + (Math.random() - 0.5) * 28;
      const y1 = tr.top - br.top + tr.height * (0.45 + Math.random() * 0.32) + (Math.random() - 0.5) * 20;
      particles.push({
        id: `amb-${Date.now()}-${k}-${Math.random().toString(36).slice(2, 7)}`,
        x0,
        y0,
        x1,
        y1,
        rot0: (Math.random() - 0.5) * 100,
        tier: Math.floor(Math.random() * 5),
        delay: k * 0.14,
      });
    }
    setFlyChips(particles);
    window.setTimeout(() => setFlyChips([]), 920);
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;
    let tid: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 13_000 + Math.random() * 4_000;
      tid = setTimeout(() => {
        if (cancelled) return;
        if (phase === 'betting' && timeLeft > 5 && !loading) {
          launchAmbientChips();
        }
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(tid);
    };
  }, [isOnline, phase, timeLeft, loading, launchAmbientChips]);

  useEffect(() => {
    if (!lastResult) {
      setHideResultDice(false);
      return;
    }
    setHideResultDice(false);
    const t = window.setTimeout(() => setHideResultDice(true), 3000);
    return () => clearTimeout(t);
  }, [lastResult?.sum, lastResult?.result]);

  const executeConfirm = async () => {
    if (totalBet <= 0 || loading || !isOnline) return;
    // Kiểm tra số dư: nếu không đủ thì báo "Số dư không đủ"
    if (balance < totalBet) {
      setInsufficientBalance(true);
      setError('Số dư không đủ');
      return;
    }
    setError('');
    setInsufficientBalance(false);
    setBetsLocked(true); // Khóa chip ngay khi ấn Xác nhận
    setLoading(true);
    setShowConfirmModal(false);
    const snap = { BIG: bets.BIG, SMALL: bets.SMALL };
    try {
      const res = await gameApi.sicbo(bets);
      if (res.status === 'bet_placed' && res.roundId) {
        requestAnimationFrame(() => launchBetChipFX(snap));
        setPlacedBets({ ...bets });
        setPendingRoundId(res.roundId);
        setBalanceFromGame(res.balance ?? balance);
        syncBalance();
        setBets({ BIG: 0, SMALL: 0 });
        setSelectedZones({ BIG: false, SMALL: false });
        try {
          localStorage.setItem('sicbo_pending', JSON.stringify({ roundId: res.roundId, bets, at: Date.now() }));
        } catch {}
      }
    } catch (err) {
      setError((err as Error).message);
      setBetsLocked(false); // Mở khóa nếu API lỗi để người chơi thử lại
    } finally {
      setLoading(false);
    }
  };

  const fetchBetHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { bets: list } = await betsApi.list('sicbo', 15);
      setBetHistoryList(
        list.map((b) => ({
          id: b.id,
          betAmount: b.betAmount,
          betData: b.betData ?? {},
          result: b.result,
          payout: b.payout,
          createdAt: b.createdAt,
        }))
      );
    } catch {
      setBetHistoryList([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const openHistoryModal = () => {
    setShowHistoryModal(true);
    fetchBetHistory();
  };

  const isBigActive = bets.BIG > 0 || placedBets.BIG > 0;
  const isSmallActive = bets.SMALL > 0 || placedBets.SMALL > 0;
  const lastRes = lastResult?.result;

  // Shake sound at 0:00 (khi chuyển sang shaking)
  useEffect(() => {
    if (phase === 'shaking' && !shakePlayedRef.current) {
      shakePlayedRef.current = true;
      playSound(SOUND_SHAKE, 0.5);
    }
    if (phase === 'betting') shakePlayedRef.current = false;
  }, [phase]);

  // Khi 0:00 mở bát: gọi API lấy kết quả và trả thưởng theo tỉ lệ ô cược
  useEffect(() => {
    if (phase !== 'opening' || !currentRoundId || !isOnline) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await gameApi.sicboResult(currentRoundId);
        if (cancelled) return;
        if (res.status === 'resolved' && res.dice && res.result) {
          const sum = (res.dice[0] ?? 0) + (res.dice[1] ?? 0) + (res.dice[2] ?? 0);
          setLastResult({
            dice: res.dice,
            result: res.result,
            winAmount: res.winAmount ?? 0,
            sum,
          });
          setHistory((prev) => [res.result!, ...prev].slice(0, 50));
          
          if (pendingRoundId === currentRoundId) {
            setPendingRoundId(null);
            setPlacedBets({ BIG: 0, SMALL: 0 });
            setBetsLocked(false);
            try {
              localStorage.removeItem('sicbo_pending');
            } catch {}
            if ((res.winAmount ?? 0) > 0) {
              playSound(SOUND_WIN, 0.6);
              confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
            }
          }
          
          setBalanceFromGame(res.balance ?? balance);
          syncBalance();
          lastResolvedRoundRef.current = currentRoundId;
        }
      } catch {
        // Do not reset pendingRoundId immediately so it can retry, or it will be cleared at round transition
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, currentRoundId, pendingRoundId, isOnline, balance, setBalanceFromGame, syncBalance]);

  // Đồng bộ ví cho tất cả người chơi khi kết thúc ván (gồm cả người không cược)
  useEffect(() => {
    if (phase !== 'opening' || !isOnline) return;
    if (pendingRoundId !== currentRoundId) {
      const timer = setTimeout(() => {
        syncBalance();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, currentRoundId, pendingRoundId, isOnline, syncBalance]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  const displayDice = lastResult?.dice ?? [1, 1, 1];
  const isShaking = phase === 'shaking';
  const selectedCount = (selectedZones.BIG ? 1 : 0) + (selectedZones.SMALL ? 1 : 0);

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-md mx-auto flex-col overflow-hidden bg-[#0c0806] transition-all duration-500" style={{ fontFamily: "'Public Sans', sans-serif" }}>
      <SicBoToast
        visible={!!toast}
        onDismiss={() => setToast(null)}
        betTime={toast?.betTime ?? ''}
        won={toast?.won ?? false}
        winAmount={toast?.winAmount ?? 0}
      />
      {/* Top App Bar */}
      <div className="flex items-center px-3 py-1.5 justify-between bg-black/40 backdrop-blur-md sticky top-0 z-50 border-b border-[#d4af37]/20 shrink-0">
        <button onClick={onBack} className="text-[#d4af37] flex size-8 shrink-0 items-center justify-center cursor-pointer hover:bg-[#d4af37]/10 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[#d4af37] text-sm font-extrabold leading-tight tracking-wider uppercase">Sic Bo Luxury</h2>
            <span className="flex items-center gap-0.5 px-1.5 py-0.2 bg-red-600 rounded text-white text-[8px] font-black animate-pulse">
              <span className="size-1 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          </div>
          <span className="text-[8px] text-[#d4af37]/60 tracking-[0.2em] leading-none mt-0.5">BÀN VIP #007</span>
        </div>
        <LuxuryWalletBar
          balance={balance - (hasPlacedBet ? 0 : totalBet)}
          isSyncingBalance={isSyncingBalance}
          handleRefreshBalance={handleRefreshBalance}
          size="sm"
        />
      </div>

      {/* Main Game Area */}
      <div className="flex flex-col flex-1 p-3 gap-2 overflow-hidden justify-between">
        {!isOnline && (
          <p className="text-red-500 text-center text-xs flex items-center justify-center gap-1 shrink-0">
            <WifiOff size={14} /> Mất kết nối. Không thể đặt cược.
          </p>
        )}
        {error && <p className="text-red-500 text-center text-xs shrink-0">{error}</p>}

        {/* Compact Info & Timer Bar */}
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-black/45 rounded-xl border border-[#d4af37]/15 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <div className="size-10 rounded-full border border-[#d4af37]/60 p-0.5">
                <div className="w-full h-full rounded-full bg-center bg-cover bg-[#1a130f]" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBgEEPQgAqAyDI24KIhCcUVWpLjq9r8YCDvEZdPWn4N8-I4e4iqEfhBYXuSLsgQSpqSiG7kS9iDqEBlv9Qc3zJ04qGfoJRB3jQIXPcnMRALE1aWdMYTK5dv5HsNNanoYwBduBLMf2vN_jEkCBiZUX1tpYfGuwJYGkRr8V4VXIhoeB-z72M1ZUdDO1PfkWB6gt5FwazWX14RoTphpwZMtzAyOWWAy8JZGMkHC6kgf4A9qVw_bQb67DH4NTZgFhzIUFry8hegzjpB0oMd")' }} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 size-2.5 rounded-full border border-[#0c0806]" />
            </div>
            <div>
              <p className="text-white text-xs font-bold leading-tight">Dealer Marc</p>
              <div className="flex items-center gap-1 text-[9px] text-[#d4af37]/80">
                <Radio size={8} className="text-red-500 animate-pulse" />
                <span>{viewerCount} xem</span>
              </div>
            </div>
          </div>
          {/* Timer 4:59 */}
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600/15 border border-red-600/60 shadow-[0_0_10px_rgba(255,0,0,0.5)]">
                <p className={`text-sm font-black text-red-500 ${phase === 'betting' && timeLeft <= 10 ? 'animate-pulse' : ''}`}>
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}
                </p>
              </div>
              <p className="text-red-500 text-sm font-black self-center">:</p>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600/15 border border-red-600/60 shadow-[0_0_10px_rgba(255,0,0,0.5)]">
                <p className={`text-sm font-black text-red-500 ${phase === 'betting' && timeLeft <= 10 ? 'animate-pulse' : ''}`}>
                  {(timeLeft % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
            <p className="text-red-500 text-[8px] font-bold tracking-tighter animate-pulse uppercase max-w-[64px] text-right leading-3">
              {phase === 'betting'
                ? 'Đặt cược'
                : phase === 'shaking'
                  ? 'Chờ lắc'
                  : phase === 'opening' && lastResult && hideResultDice
                    ? 'Chờ ván mới'
                    : 'Kết quả'}
            </p>
          </div>
        </div>

        {/* Golden Plate + Dice */}
        <div className="relative flex flex-col items-center justify-center py-1.5 flex-1 min-h-0">
          <motion.div
            className={`relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center shrink-0 ${phase === 'shaking' ? 'animate-bowl-shake' : ''}`}
          >
            <div className="absolute inset-0 rounded-full gold-gradient opacity-15 blur-xl pointer-events-none" />
            <div className="absolute inset-2 rounded-full border-4 border-[#d4af37]/30 border-dashed pointer-events-none" />
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full gold-gradient p-[3px] shadow-2xl flex items-center justify-center overflow-hidden">
              <div className="w-full h-full rounded-full bg-[#17110d] flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #d4af37 1px, transparent 0)', backgroundSize: '8px 8px' }} />
                {/* Xúc xắc */}
                <div
                  className={`flex gap-3 z-10 transition-opacity duration-300 ${
                    phase === 'opening' && lastResult && !hideResultDice ? 'opacity-100' : 'opacity-0 invisible'
                  }`}
                >
                  <DiceFace value={displayDice[0]} className="size-9 sm:size-11 rotate-12" shaking={phase === 'shaking'} />
                  <DiceFace value={displayDice[1]} className="size-9 sm:size-11 -rotate-6" shaking={phase === 'shaking'} />
                  <DiceFace value={displayDice[2]} className="size-9 sm:size-11 rotate-45" shaking={phase === 'shaking'} />
                </div>
                {/* Nắp bát úp */}
                <AnimatePresence>
                  {(phase === 'betting' ||
                    phase === 'shaking' ||
                    (phase === 'opening' && (!lastResult || hideResultDice))) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1, y: -25 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 rounded-full gold-gradient border-2 border-[#996515]/60 shadow-inner z-20 flex items-center justify-center cursor-pointer"
                    >
                      <div className="w-8 h-8 gold-gradient rounded-full border border-[#996515]/50 shadow-inner" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Result Badge */}
          <div className="h-7 mt-1.5 flex items-center justify-center shrink-0">
            <AnimatePresence mode="wait">
              {lastResult && (phase === 'opening' || phase === 'result_display') && !hideResultDice ? (
                <motion.div
                  key="result-badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <div className="px-5 py-0.5 gold-gradient rounded-full shadow border border-[#f9e498]/40">
                    <span className="text-slate-900 font-black text-sm tracking-wider uppercase">
                      {lastResult.sum} - {lastRes === 'BIG' ? 'TÀI' : 'XỈU'}
                    </span>
                  </div>
                  {lastResult.winAmount > 0 && (
                    <span className="text-green-500 font-bold text-xs animate-bounce">
                      +${lastResult.winAmount.toLocaleString()}
                    </span>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {sicMeta && (
          <div className="px-3 mb-1 text-center text-[9px] text-slate-500 leading-none shrink-0">
            Giờ server <span className="text-[#f9e498]/80 font-mono">{sicMeta.serverTime}</span>
          </div>
        )}

        {/* Bàn cược + chip bay vào ô */}
        <div ref={boardRef} className="relative px-2 shrink-0">
          <div className="pointer-events-none absolute inset-0 z-[24] overflow-visible" aria-hidden>
            {flyChips.map((c) => (
              <motion.div
                key={c.id}
                className="absolute"
                style={{ left: c.x0, top: c.y0, marginLeft: -18, marginTop: -18 }}
                initial={{ x: 0, y: 0, rotate: c.rot0, scale: 0.3, opacity: 0.9 }}
                animate={{ x: c.x1 - c.x0, y: c.y1 - c.y0, rotate: (c.tier % 2) * 8 - 4, scale: 1, opacity: 1 }}
                transition={{ duration: 0.55, delay: c.delay, ease: [0.2, 0.9, 0.2, 1] }}
              >
                <CasinoChipVisual size={32} tier={c.tier} />
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 relative z-10">
            {(loading || betsLocked || hasPlacedBet) && (
              <div className="absolute inset-0 z-10 bg-black/30 cursor-not-allowed rounded-xl pointer-events-auto" />
            )}
            {(() => {
              const isBigBoosted = !!(sicMeta?.payoutBoost && payoutRatio.BIG > 2);
              const isSmallBoosted = !!(sicMeta?.payoutBoost && payoutRatio.SMALL > 2);
              return (
                <>
                  <button
                    ref={bigZoneRef}
                    onClick={() => handleZoneSelect('BIG')}
                    disabled={!canBet}
                    className={`flex flex-col items-center justify-center h-20 sm:h-24 rounded-xl border relative overflow-hidden group transition-all ${
                      isBigActive
                        ? 'gold-gradient luxury-shadow border-[#f9e498]/40'
                        : isBigBoosted
                          ? 'bg-[#ffe885]/15 border-[#ffe885]/80 shadow-[0_0_15px_rgba(255,232,133,0.35)]'
                          : 'bg-[#d4af37]/20 border-[#d4af37]/30'
                    } ${lastRes === 'BIG' ? 'ring-2 ring-green-500' : ''} ${selectedZones.BIG ? 'ring-2 ring-white/80' : ''}`}
                  >
                    <div className="absolute inset-0 bg-black/10 group-active:bg-black/35 transition-colors" />
                    <span className={`text-2xl font-black tracking-widest italic relative z-10 ${
                      isBigActive
                        ? 'text-slate-900'
                        : isBigBoosted
                          ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : 'text-slate-900'
                    }`}>TÀI</span>
                    <span className={`text-xs font-bold mt-0.5 relative z-10 ${
                      isBigActive
                        ? 'text-slate-900/60'
                        : isBigBoosted
                          ? 'text-amber-300 font-black'
                          : 'text-slate-900/60'
                    }`}>1:{formatSicBoProfitOdds(payoutRatio.BIG)}</span>
                    {bets.BIG > 0 && !placedBets.BIG && (
                      <div className="absolute top-1 right-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white/40 shadow-lg z-20">
                        ${bets.BIG}
                      </div>
                    )}
                    {placedBets.BIG > 0 && <ChipStack amount={placedBets.BIG} zoneKey="BIG" />}
                  </button>

                  <button
                    ref={smallZoneRef}
                    onClick={() => handleZoneSelect('SMALL')}
                    disabled={!canBet}
                    className={`flex flex-col items-center justify-center h-20 sm:h-24 rounded-xl border relative overflow-hidden group transition-all ${
                      isSmallActive
                        ? 'ring-1 ring-slate-400 bg-gradient-to-br from-slate-700 to-slate-900'
                        : isSmallBoosted
                          ? 'bg-gradient-to-br from-amber-950/40 to-slate-950 border-[#ffe885]/80 shadow-[0_0_15px_rgba(255,232,133,0.35)]'
                          : 'bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-500/20'
                    } ${lastRes === 'SMALL' ? 'ring-2 ring-green-500' : ''} ${selectedZones.SMALL ? 'ring-2 ring-white/80' : ''}`}
                  >
                    <div className="absolute inset-0 bg-white/5 group-active:bg-black/35 transition-colors" />
                    <span className={`text-2xl font-black tracking-widest italic relative z-10 ${
                      isSmallActive
                        ? 'text-white'
                        : isSmallBoosted
                          ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : 'text-white'
                    }`}>XỈU</span>
                    <span className={`text-xs font-bold mt-0.5 relative z-10 ${
                      isSmallActive
                        ? 'text-white/60'
                        : isSmallBoosted
                          ? 'text-amber-300 font-black'
                          : 'text-white/60'
                    }`}>1:{formatSicBoProfitOdds(payoutRatio.SMALL)}</span>
                    {bets.SMALL > 0 && !placedBets.SMALL && (
                      <div className="absolute top-1 right-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white/40 shadow-lg z-20">
                        ${bets.SMALL}
                      </div>
                    )}
                    {placedBets.SMALL > 0 && <ChipStack amount={placedBets.SMALL} zoneKey="SMALL" />}
                  </button>
                </>
              );
            })()}
          </div>
        </div>

        {/* Chips Selector */}
        <div
          ref={chipDockRef}
          className={`flex justify-center gap-2 overflow-x-auto py-1 no-scrollbar shrink-0 ${!canBet || selectedCount === 0 ? 'opacity-40 pointer-events-none' : ''}`}
        >
          {CHIPS.map((chip) => (
            <div key={chip.val} className="flex flex-col items-center shrink-0">
              <button
                onClick={() => handleChipClick(chip)}
                disabled={!canBet || selectedCount === 0 || (chip.isPercent50 ? false : balance < totalBet + chip.amount * selectedCount)}
                className={`rounded-full p-0.5 transition-all ${selectedChip.val === chip.val ? 'scale-105 ring-2 ring-[#d4af37]/50' : 'opacity-90 hover:opacity-100'}`}
              >
                <CasinoChipVisual size={42} tier={chip.tier} label={chip.isPercent50 ? '50%' : `$${chip.val}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Custom Bet Input */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-1.5 bg-black/60 rounded-full border border-[#d4af37]/30 px-3 py-1 shadow-inner w-56 mx-auto shrink-0">
            <span className="text-[#d4af37] font-bold text-xs">$</span>
            <input
              type="number"
              value={customBetAmount}
              onChange={(e) => setCustomBetAmount(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCustomBetAdd(); } }}
              disabled={!canBet}
              placeholder="Nhập số tiền..."
              min={MIN_BET}
              className="bg-transparent text-white text-xs w-full outline-none font-mono placeholder:text-white/20"
            />
            <button
              onClick={handleCustomBetAdd}
              disabled={!canBet || !customBetAmount}
              className="text-slate-900 gold-gradient px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider disabled:opacity-50 active:scale-95 transition-transform shrink-0"
            >
              Chọn
            </button>
          </div>
        )}

        {/* Roadmap */}
        <div className="bg-black/45 rounded-xl border border-[#d4af37]/15 overflow-hidden shrink-0">
          <div className="flex justify-between items-center px-3 py-1 bg-black/20 border-b border-[#d4af37]/10">
            <span className="text-[#d4af37] text-[9px] font-bold uppercase tracking-wider">Lịch sử kết quả</span>
            <div className="flex gap-2 text-[9px]">
              <span className="text-white/60">
                Tài: <span className="text-[#d4af37] font-bold">{history.filter((h) => h === 'BIG').length}</span>
              </span>
              <span className="text-white/60">
                Xỉu: <span className="text-slate-300 font-bold">{history.filter((h) => h === 'SMALL').length}</span>
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center p-1.5 gap-1 overflow-x-auto no-scrollbar">
            {Array.from({ length: 14 }).map((_, colIndex) => {
              const idx = 13 - colIndex;
              const res = history[idx];
              return (
                <div key={colIndex} className="flex-1 flex justify-center items-center">
                  {res ? (
                    <div
                      className={`size-3.5 rounded-full shadow-sm shrink-0 flex items-center justify-center text-[8px] font-black ${
                        res === 'BIG' ? 'gold-gradient text-slate-900' : 'bg-slate-600 text-white'
                      } ${idx === 0 ? 'ring-1 ring-white ring-offset-1 ring-offset-black animate-pulse' : ''}`}
                    >
                      {res === 'BIG' ? 'T' : 'X'}
                    </div>
                  ) : (
                    <div className="size-3.5 rounded-full border border-white/5 bg-black/20" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Extra Action Area */}
      <div className="p-3 flex gap-3 bg-gradient-to-t from-black to-transparent shrink-0">
        <button
          onClick={openHistoryModal}
          className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors"
        >
          <HistoryIcon size={16} />
          Lịch sử cược
        </button>
        <button
          onClick={handlePlayClick}
          disabled={totalBet <= 0 || loading || !isOnline || !canBet}
          className="flex-1 h-10 rounded-xl gold-gradient text-slate-900 text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-[#d4af37]/20 uppercase tracking-wider active:scale-95 transition-transform disabled:grayscale disabled:opacity-50"
        >
          {loading ? 'ĐANG XỬ LÝ...' : `CHƠI ($${totalBet})`}
        </button>
      </div>

      {/* Chat trực tiếp - nút nổi có thể kéo, Socket.io, AI tương tác */}
      <SicBoGameChat
        socket={socket}
        userId={user?.id ?? null}
        username={user?.username ?? 'Player'}
        isOpen={showChat}
        lastResult={lastResult?.result ?? null}
        onToggle={() => setShowChat((v) => !v)}
      />

      {/* Modal xác nhận cược */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-slate-800 to-slate-900 border border-[#d4af37]/50 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_30px_rgba(212,175,55,0.2)]"
            >
              <h3 className="text-[#d4af37] text-xl font-black text-center mb-4 uppercase tracking-widest">Xác nhận cược</h3>
              {insufficientBalance && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-center font-bold">
                  Số dư không đủ
                </div>
              )}
              <div className="space-y-3 mb-6">
                {bets.BIG > 0 && (
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/10">
                    <span className="text-white font-bold">TÀI</span>
                    <span className="text-[#f9e498] font-black">${bets.BIG.toLocaleString()}</span>
                  </div>
                )}
                {bets.SMALL > 0 && (
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/10">
                    <span className="text-white font-bold">XỈU</span>
                    <span className="text-[#f9e498] font-black">${bets.SMALL.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-[#d4af37]/20 p-3 rounded-lg border border-[#d4af37]/50 mt-2">
                  <span className="text-[#d4af37] font-black uppercase">Tổng cược</span>
                  <span className="text-[#f9e498] font-black text-lg">${totalBet.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setInsufficientBalance(false);
                    setError('');
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold active:bg-white/20 transition-colors"
                >
                  HỦY
                </button>
                <button onClick={executeConfirm} className="flex-1 py-3 rounded-xl gold-gradient text-slate-900 font-black shadow-lg active:scale-95 transition-transform">
                  XÁC NHẬN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Lịch sử cược */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#1a130f] border border-[#d4af37]/30 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_40px_rgba(212,175,55,0.15)] max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[#d4af37] text-xl font-black uppercase tracking-widest">Lịch sử cược (15 ván)</h3>
                <button onClick={() => setShowHistoryModal(false)} className="text-white/50 hover:text-white text-xl">
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                {loadingHistory ? (
                  <p className="text-center text-white/40 py-8">Đang tải...</p>
                ) : betHistoryList.length === 0 ? (
                  <p className="text-center text-white/40 py-8 italic">Chưa có lịch sử cược Sic Bo</p>
                ) : (
                  betHistoryList.map((item) => {
                    const zones = Object.entries(item.betData)
                      .filter(([k, v]) => Number(v) > 0 && (k === 'BIG' || k === 'SMALL'))
                      .map(([k]) => (k === 'BIG' ? 'TÀI' : k === 'SMALL' ? 'XỈU' : k))
                      .join(', ');
                    const won = item.payout > 0;
                    const isDraw = item.payout === 0;
                    const timeStr = new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={item.id} className="bg-black/40 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black px-2 py-0.5 rounded bg-[#d4af37]/30 text-[#f9e498]">{zones || '-'}</span>
                            <span className="text-white/40 text-[10px]">{timeStr}</span>
                          </div>
                          <div className="text-white font-mono mt-1">${item.betAmount.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-black ${won ? 'text-green-500' : isDraw ? 'text-yellow-500' : 'text-red-500'}`}>{won ? 'THẮNG' : isDraw ? 'HÒA' : 'THUA'}</div>
                          {item.payout !== 0 && (
                            <div className={`text-xs font-bold ${item.payout > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {item.payout > 0 ? `+${item.payout.toLocaleString()}` : item.payout.toLocaleString()}
                            </div>
                          )}
                          {item.result && <div className="text-white/50 text-[10px]">{item.result === 'BIG' ? 'TÀI' : 'XỈU'}</div>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
