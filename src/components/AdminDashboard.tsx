/**
 * Admin Dashboard - Quản trị toàn diện hệ thống
 * 1. Tài khoản (gồm Nạp/Rút) | 2. Giao dịch | 3. Games (tỉ lệ trả thưởng)
 * 4. Chat (file/media, broadcast, cá nhân)
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Users,
  Wallet,
  CreditCard,
  TrendingUp,
  RefreshCw,
  Check,
  X,
  Shield,
  Gamepad2,
  MessageSquare,
  Plus,
  Minus,
  Trash2,
  Pencil,
  ScrollText,
  Paperclip,
  Send,
  Bell,
  LayoutTemplate,
  UserCog,
} from 'lucide-react';
import { admin } from '../api/adminClient';
import { CasinoPayoutControl } from './CasinoPayoutControl';
import { supportApi } from '../api/client';
import { useAppSocket } from '../context/SocketContext';
import { ADMIN_PLAYER_MESSAGE_SOUND_URL } from '../constants/adminPlayerMessageSound';
import { ADMIN_WITHDRAW_PENDING_SOUND_URL } from '../constants/adminWithdrawSound';
import { useAuth } from '../context/AuthContext';
import {
  mergeAllSiteContent,
  LANDING_CONTENT_KEYS,
  MARKETING_CONTENT_KEYS,
} from '../constants/landingContentDefaults';
import { resolveApiBase } from '../api/resolveApiBase';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Virtual Scroll for Support Messages list to optimize memory and browser rendering performance */
function VirtualChatList({
  items,
  renderItem,
  itemHeight = 110,
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height || 500);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 4);
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + 4);

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      className="flex-1 overflow-y-auto mb-4 pr-1 relative"
      style={{ scrollBehavior: 'auto' }}
    >
      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)`, position: 'absolute', left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visibleItems.map((item, idx) => renderItem(item, startIndex + idx))}
        </div>
      </div>
    </div>
  );
}

type Tab = 'stats' | 'users' | 'transactions' | 'games' | 'chat' | 'cms' | 'staff';

const CMS_FIELD_LABELS: Record<string, string> = {
  'landing.heroVideoUrl': 'Video hero (URL .mp4)',
  'landing.aboutKicker': 'Nhãn “Về chúng tôi”',
  'landing.aboutTitle': 'Tiêu đề khu vực giới thiệu',
  'landing.aboutImageUrl': 'Ảnh giới thiệu (URL)',
  'landing.aboutParagraph': 'Đoạn giới thiệu (nhiều dòng)',
  'landing.statRooms': 'Ô thống kê — phòng',
  'landing.statRestaurants': 'Ô thống kê — nhà hàng',
  'landing.statCasino': 'Ô thống kê — casino',
  'landing.statGolf': 'Ô thống kê — golf',
  'landing.alertTitle': 'Cảnh báo — tiêu đề',
  'landing.alertBody': 'Cảnh báo — nội dung',
  'landing.promoImageUrl': 'Tin nổi bật — ảnh (URL)',
  'landing.promoTitle': 'Tin nổi bật — tiêu đề',
  'landing.promoBody': 'Tin nổi bật — mô tả',
  'marketing.home.postTitle': 'Trang chủ — Quảng bá: tiêu đề',
  'marketing.home.postImageUrl': 'Trang chủ — Quảng bá: ảnh (URL)',
  'marketing.home.postBody': 'Trang chủ — Quảng bá: nội dung',
  'marketing.hotel.heroUrl': 'Khách sạn — ảnh banner (URL, để trống = mặc định)',
  'marketing.hotel.intro': 'Khách sạn — đoạn mở đầu (để trống = mặc định)',
  'marketing.hotel.postTitle': 'Khách sạn — Bài 1: tiêu đề',
  'marketing.hotel.postImageUrl': 'Khách sạn — Bài 1: ảnh (URL)',
  'marketing.hotel.postBody': 'Khách sạn — Bài 1: nội dung',
  'marketing.hotel.post2Title': 'Khách sạn — Bài 2: tiêu đề',
  'marketing.hotel.post2ImageUrl': 'Khách sạn — Bài 2: ảnh (URL)',
  'marketing.hotel.post2Body': 'Khách sạn — Bài 2: nội dung',
  'marketing.restaurant.heroUrl': 'Nhà hàng — ảnh banner (URL)',
  'marketing.restaurant.intro': 'Nhà hàng — đoạn mở đầu',
  'marketing.restaurant.postTitle': 'Nhà hàng — Bài 1: tiêu đề',
  'marketing.restaurant.postImageUrl': 'Nhà hàng — Bài 1: ảnh (URL)',
  'marketing.restaurant.postBody': 'Nhà hàng — Bài 1: nội dung',
  'marketing.restaurant.post2Title': 'Nhà hàng — Bài 2: tiêu đề',
  'marketing.restaurant.post2ImageUrl': 'Nhà hàng — Bài 2: ảnh (URL)',
  'marketing.restaurant.post2Body': 'Nhà hàng — Bài 2: nội dung',
  'marketing.uudai.postTitle': 'Ưu đãi — Bài 1: tiêu đề',
  'marketing.uudai.postImageUrl': 'Ưu đãi — Bài 1: ảnh (URL)',
  'marketing.uudai.postBody': 'Ưu đãi — Bài 1: nội dung',
  'marketing.uudai.post2Title': 'Ưu đãi — Bài 2: tiêu đề',
  'marketing.uudai.post2ImageUrl': 'Ưu đãi — Bài 2: ảnh (URL)',
  'marketing.uudai.post2Body': 'Ưu đãi — Bài 2: nội dung',
};

const CMS_FORM_SECTIONS: { title: string; keys: string[] }[] = [
  { title: 'Trang chủ — khu vực chính', keys: [...LANDING_CONTENT_KEYS] },
  { title: 'Trang chủ — tin / ảnh quảng bá thêm', keys: MARKETING_CONTENT_KEYS.filter((k) => k.startsWith('marketing.home')) },
  { title: 'Khách sạn — banner, giới thiệu & bài đăng', keys: MARKETING_CONTENT_KEYS.filter((k) => k.includes('.hotel.')) },
  { title: 'Nhà hàng — banner, giới thiệu & bài đăng', keys: MARKETING_CONTENT_KEYS.filter((k) => k.includes('.restaurant.')) },
  { title: 'Ưu đãi — bài đăng / hình ảnh', keys: MARKETING_CONTENT_KEYS.filter((k) => k.includes('.uudai.')) },
];

const GAME_NAMES: Record<string, string> = {
  sicbo: 'Xúc Xắc',
  baccarat: 'Baccarat',
  dragontiger: 'Long Hổ',
  roulette: 'Roulette',
  blackjack: 'Blackjack',
  slot: 'Slot',
  baicao: 'Bài Cào',
  tigerbaccarat: 'Tiger Baccarat',
  baccaratlongho: 'Baccarat Long Hổ',
  threecard: 'Three Card',
  caribbean: 'Caribbean',
  niuniu: 'Niu Niu',
  texasholdem: 'Texas Holdem',
  russianpoker: 'Russian Poker',
};

const SICBO_OPTIONS = [
  { key: 'BIG', label: 'Tài' },
  { key: 'SMALL', label: 'Xỉu' },
];

const ADD_REASON_OPTIONS: { value: string; label: string }[] = [
  { value: 'nap_tien', label: 'Nạp tiền' },
  { value: 'nop_phat', label: 'Nộp phạt' },
  { value: 'khuyen_mai', label: 'Khuyến mãi' },
  { value: 'khac', label: 'Lý do khác' },
];

function MemberFlipCard({
  u,
  onOpenDetail,
  onBan,
  onQuickAdd,
  onQuickSubtract,
  canBan = true,
}: {
  u: any;
  onOpenDetail: () => void;
  onBan: () => void | Promise<void>;
  onQuickAdd: () => void;
  onQuickSubtract: () => void;
  canBan?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const pwdLogin = u.loginPasswordPlain ? String(u.loginPasswordPlain) : '—';
  const pwdW = u.withdrawPinPlain ? String(u.withdrawPinPlain) : '—';
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-slate-900 via-slate-800 to-black shadow-xl shadow-black/50 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setFlipped((f) => !f);
        }}
        className="cursor-pointer select-none px-3 pt-3"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative mx-auto max-w-[340px] h-[188px] transition-transform duration-700 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div
            className="absolute inset-0 rounded-xl border border-amber-500/30 p-4 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-amber-950/40 to-black"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-amber-500/90 font-bold">
                Thành viên · VIP {u.vipLevel ?? 0}
              </p>
              <p className="font-bold text-lg text-white truncate">{u.fullName}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">@{u.username}</p>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div>
                <span className="text-slate-500">Số dư</span>
                <p className="font-mono text-amber-400 font-bold">${(u.balance ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-500">Tổng nạp</span>
                <p className="font-mono text-emerald-400 font-bold">${Number(u.totalDeposit ?? 0).toLocaleString()}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Tổng rút</span>
                <p className="font-mono text-sky-400 font-bold">${Number(u.totalWithdraw ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div
            className="absolute inset-0 rounded-xl border border-slate-600/50 p-3 flex flex-col justify-center gap-1.5 text-[10px] bg-gradient-to-br from-slate-800 to-black overflow-y-auto"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="text-[9px] uppercase text-slate-500 font-bold shrink-0">Mặt sau</p>
            <div>
              <span className="text-slate-500">Ngân hàng</span>
              <p className="text-white font-medium break-words">{u.bankName || '—'}</p>
            </div>
            <div>
              <span className="text-slate-500">Số TK</span>
              <p className="font-mono text-slate-200 break-all">{u.bankAccountNumber || '—'}</p>
            </div>
            <div>
              <span className="text-slate-500">Mật khẩu rút</span>
              <p className="font-mono text-amber-300 break-all">{pwdW}</p>
            </div>
            <div>
              <span className="text-slate-500">Mật khẩu đăng nhập</span>
              <p className="font-mono text-amber-300 break-all">{pwdLogin}</p>
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-2 pb-1">Chạm thẻ để lật</p>
      </div>
      <div className="flex flex-wrap gap-2 p-3 pt-0 border-t border-white/5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail();
          }}
          className="flex-1 min-w-[100px] py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-xs font-bold"
        >
          Quản lý
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd();
          }}
          className="px-3 py-2 rounded-lg bg-green-700 text-xs font-bold"
        >
          + Cộng
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickSubtract();
          }}
          className="px-3 py-2 rounded-lg bg-red-700 text-xs font-bold"
        >
          − Trừ
        </button>
        {canBan && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBan();
            }}
            className={`px-3 py-2 rounded-lg text-xs font-bold ${u.isBanned ? 'bg-green-600' : 'bg-red-900'}`}
          >
            {u.isBanned ? 'Mở khóa' : 'Khóa'}
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<any>(null);
  const [readTicketIds, setReadTicketIds] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdraws, setWithdraws] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [superEditTx, setSuperEditTx] = useState<{ id: string; amount: string; type: string } | null>(null);
  const { user: adminSelf } = useAuth();
  const isSuperAdminUi = String(adminSelf?.role || '').toLowerCase() === 'super_admin';
  const [cmsDraft, setCmsDraft] = useState<Record<string, string>>(() => mergeAllSiteContent({}));
  const [cmsSaving, setCmsSaving] = useState(false);
  const [games, setGames] = useState<any[]>([]);
  const [payoutConfigs, setPayoutConfigs] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [balanceAdjustUserId, setBalanceAdjustUserId] = useState<string | null>(null);
  const [adjustAddReason, setAdjustAddReason] = useState<string>('nap_tien');
  const [userBets, setUserBets] = useState<any[]>([]);
  const [chatTicketId, setChatTicketId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatMode, setChatMode] = useState<'ticket' | 'broadcast' | 'direct'>('ticket');
  const [directTargetUserId, setDirectTargetUserId] = useState('');
  const [chatPendingAttachment, setChatPendingAttachment] = useState<{
    url: string;
    attachmentType: string;
    name?: string;
  } | null>(null);
  const [detailCardFlipped, setDetailCardFlipped] = useState(false);
  const [staffManagers, setStaffManagers] = useState<
    Array<{ id: string; username: string; email: string; fullName: string; role: string; isBanned: boolean; createdAt: string }>
  >([]);
  const [staffPromoteUsername, setStaffPromoteUsername] = useState('');
  const { socket } = useAppSocket();
  const tabRef = useRef<Tab>(tab);
  const playerMsgAudioRef = useRef<HTMLAudioElement | null>(null);
  const withdrawAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatTicketIdRef = useRef<string | null>(null);
  const supportNotifByTicketRef = useRef<Map<string, Notification>>(new Map());
  tabRef.current = tab;
  chatTicketIdRef.current = chatTicketId;

  useEffect(() => {
    const a = new Audio(ADMIN_PLAYER_MESSAGE_SOUND_URL);
    a.preload = 'auto';
    a.loop = true;
    playerMsgAudioRef.current = a;
    return () => {
      a.pause();
      playerMsgAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const a = new Audio(ADMIN_WITHDRAW_PENDING_SOUND_URL);
    a.preload = 'auto';
    a.loop = true;
    withdrawAudioRef.current = a;
    return () => {
      a.pause();
      withdrawAudioRef.current = null;
    };
  }, []);

  // Tải danh sách ticket khi mount để cập nhật badge số lượng tin nhắn chưa đọc ở tab Chat
  useEffect(() => {
    supportApi.getTickets()
      .then((res) => {
        if (res.tickets) setTickets(res.tickets);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setDetailCardFlipped(false);
  }, [selectedUserId]);

  /** Vào đúng ticket đang chat → đóng thông báo OS + dừng chuông tin nhắn */
  useEffect(() => {
    if (!chatTicketId) return;
    // Stop player message alert sound when admin opens a ticket
    const msgAudio = playerMsgAudioRef.current;
    if (msgAudio) {
      msgAudio.loop = false;
      msgAudio.pause();
      msgAudio.currentTime = 0;
    }
    // Mark this ticket as read in unread set
    setReadTicketIds((prev) => { const s = new Set(prev); s.add(chatTicketId); return s; });
    const m = supportNotifByTicketRef.current;
    const n = m.get(chatTicketId);
    if (n) {
      try { n.close(); } catch { /* ignore */ }
      m.delete(chatTicketId);
    }
  }, [chatTicketId]);

  /** Stop withdraw sound when admin goes to users/transactions tab */
  useEffect(() => {
    if (tab === 'users' || tab === 'transactions') {
      const wAudio = withdrawAudioRef.current;
      if (wAudio) {
        wAudio.loop = false;
        wAudio.pause();
        wAudio.currentTime = 0;
      }
    }
  }, [tab]);

  /** Super: tự xin quyền thông báo trình duyệt (chuông rút tiền / tin nhắn) */
  useEffect(() => {
    if (!isSuperAdminUi || typeof Notification === 'undefined') return;
    if (Notification.permission !== 'default') return;
    void Notification.requestPermission();
  }, [isSuperAdminUi]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'stats') setStats(await admin.stats());
      if (tab === 'users') {
        const [usersRes, depositsRes, withdrawsRes] = await Promise.all([
          admin.users({ search: search || undefined, limit: 100 }),
          admin.deposits('pending'),
          admin.withdraws('pending'),
        ]);
        setUsers(usersRes.users);
        setDeposits(depositsRes.deposits);
        setWithdraws(withdrawsRes.withdraws);
      }
      if (tab === 'transactions') {
        const r = await admin.transactions({ limit: 400 });
        setActivityFeed(r.feed || []);
      }
      if (tab === 'games') {
        const [gamesRes, payoutRes] = await Promise.all([
          admin.games(),
          admin.payoutConfigs().catch(() => ({ configs: [] })),
        ]);
        setGames(gamesRes.games || []);
        setPayoutConfigs(payoutRes.configs || []);
      }
      if (tab === 'staff') {
        const r = await admin.staffManagers();
        setStaffManagers(r.managers || []);
      }
      if (tab === 'chat') {
        const [{ tickets: t }, usersRes] = await Promise.all([
          supportApi.getTickets(),
          admin.users({ limit: 500 }),
        ]);
        setTickets(t || []);
        setUsers(usersRes.users);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  /** Tin từ người chơi: NGAY LẬP TỨC append + chuông + thông báo OS; debounce reload danh sách ticket */
  useEffect(() => {
    if (!socket) return;
    let deb: ReturnType<typeof setTimeout> | undefined;
    const onSupport = (payload: {
      ticketId: string;
      message: { id: string; content: string; senderRole: string; createdAt: string; attachmentUrl?: string | null; attachmentType?: string | null };
    }) => {
      if (payload.message.senderRole !== 'user') return;

      // Cập nhật danh sách ticket chạy ngầm để đảm bảo badge số lượng tin nhắn chưa đọc luôn chính xác
      supportApi.getTickets().then((res) => {
        if (res.tickets) setTickets(res.tickets);
      }).catch(() => {});

      const viewingTicket = chatTicketIdRef.current;
      const isViewingThisTicket = !!viewingTicket && viewingTicket === payload.ticketId;

      if (!isViewingThisTicket) {
        // Mark ticket as having unread messages
        setReadTicketIds((prev) => { const s = new Set(prev); s.delete(payload.ticketId); return s; });
        // Play looping alert if not already playing
        const audio = playerMsgAudioRef.current;
        if (audio && audio.paused) {
          audio.loop = true;
          audio.currentTime = 0;
          void audio.play().catch(() => {});
        }
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const prev = supportNotifByTicketRef.current.get(payload.ticketId);
          if (prev) { try { prev.close(); } catch { /* ignore */ } }
          const snippet =
            (payload.message.content || '').slice(0, 120) ||
            (payload.message.attachmentUrl ? 'Có hình / file đính kèm' : 'Tin nhắn mới');
          const n = new Notification('Tin nhắn từ người chơi', {
            body: snippet,
            tag: `support-ticket-${payload.ticketId}`,
          });
          supportNotifByTicketRef.current.set(payload.ticketId, n);
        }
      } else {
        // Play a single non-looping chime when admin has the active chat open
        const a = new Audio(ADMIN_PLAYER_MESSAGE_SOUND_URL);
        a.volume = 0.5;
        void a.play().catch(() => {});
      }

      // Instantly append message if this ticket is open
      if (viewingTicket && payload.ticketId === viewingTicket) {
        setChatMessages((prev) => {
          if (payload.tempId && prev.some((m: { id: string }) => m.id === payload.tempId)) {
            return prev.map((m: any) => m.id === payload.tempId ? payload.message : m);
          }
          if (prev.some((m: { id: string }) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
        supportApi.markTicketAsRead(payload.ticketId).catch(() => {});
      }

      // Debounce-reload ticket list (for updating last-message preview)
      if (deb) clearTimeout(deb);
      deb = setTimeout(() => {
        if (tabRef.current === 'chat') load();
      }, 800);
    };

    const onRead = (payload: { ticketId: string }) => {
      const viewingTicket = chatTicketIdRef.current;
      if (payload.ticketId === viewingTicket) {
        setChatMessages((prev) =>
          prev.map((m: any) => ({
            ...m,
            readAt: m.readAt || new Date().toISOString(),
          }))
        );
      }
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id === payload.ticketId) {
            return {
              ...t,
              messages: (t.messages || []).map((m: any) => ({
                ...m,
                readAt: m.readAt || new Date().toISOString(),
              })),
            };
          }
          return t;
        })
      );
    };

    socket.on('support_message', onSupport);
    socket.on('support_messages_read', onRead);
    return () => {
      socket.off('support_message', onSupport);
      socket.off('support_messages_read', onRead);
      if (deb) clearTimeout(deb);
    };
  }, [socket, load]);

  useEffect(() => {
    if (!socket) return;
    const onWithdraw = (payload: {
      id: string;
      amount: number;
      user?: { username?: string; email?: string } | null;
    }) => {
      const audio = withdrawAudioRef.current;
      if (audio && audio.paused) {
        audio.loop = true;
        audio.currentTime = 0;
        void audio.play().catch(() => {});
      }
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Yêu cầu rút tiền mới', {
          body: `${payload.user?.username ?? 'Người chơi'} — $${Number(payload.amount).toLocaleString()}`,
          tag: `withdraw-${payload.id}`,
        });
      }
      if (tabRef.current === 'users') load();
    };
    socket.on('withdraw_pending', onWithdraw);
    return () => {
      socket.off('withdraw_pending', onWithdraw);
    };
  }, [socket, load]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (selectedUserId) {
      admin.getUser(selectedUserId).then((r) => setUserDetail(r)).catch(() => setUserDetail(null));
      admin.getUserBets(selectedUserId).then((r) => setUserBets(r.bets)).catch(() => setUserBets([]));
    } else {
      setUserDetail(null);
      setUserBets([]);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (!socket) return;
    const onBet = (p: { userId?: string }) => {
      const uid = p?.userId;
      if (uid && uid === selectedUserId) {
        admin.getUserBets(uid).then((r) => setUserBets(r.bets)).catch(() => {});
      }
    };
    socket.on('player_bet', onBet);
    return () => {
      socket.off('player_bet', onBet);
    };
  }, [socket, selectedUserId]);

  const handleApproveDeposit = async (id: string) => {
    try {
      await admin.approveDeposit(id);
      setDeposits((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleRejectDeposit = async (id: string) => {
    try {
      await admin.rejectDeposit(id);
      setDeposits((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleApproveWithdraw = async (id: string) => {
    try {
      await admin.approveWithdraw(id);
      setWithdraws((prev) => prev.filter((w) => w.id !== id));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleRejectWithdraw = async (id: string) => {
    try {
      await admin.rejectWithdraw(id);
      setWithdraws((prev) => prev.filter((w) => w.id !== id));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleBanUser = async (userId: string, banned: boolean) => {
    try {
      await admin.banUser(userId, banned);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isBanned: banned } : u)));
      if (userDetail?.user?.id === userId) setUserDetail((d: any) => ({ ...d, user: { ...d?.user, isBanned: banned } }));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleAdjustBalance = async () => {
    const uid = balanceAdjustUserId ?? selectedUserId;
    if (!uid || !adjustAmount) return;
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt <= 0) return;
    try {
      await admin.adjustBalance(uid, amt, adjustType, {
        adjustReason: adjustType === 'add' ? adjustAddReason : undefined,
      });
      setShowAdjustModal(false);
      setAdjustAmount('');
      setBalanceAdjustUserId(null);
      if (userDetail && userDetail.user?.id === uid) admin.getUser(uid).then((r) => setUserDetail(r));
      if (uid === selectedUserId) admin.getUserBets(uid).then((r) => setUserBets(r.bets));
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Xóa vĩnh viễn tài khoản? Không thể hoàn tác.')) return;
    try {
      await admin.deleteUser(userId);
      setSelectedUserId(null);
      setUserDetail(null);
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleSuperEraseFeed = async (kind: 'ledger' | 'audit', id: string) => {
    if (!isSuperAdminUi) return;
    const pw = window.prompt('Nhập mật khẩu đăng nhập để xác nhận xóa (không tạo nhật ký mới):');
    if (pw == null || pw === '') return;
    if (!confirm('Xóa vĩnh viễn mục này?')) return;
    try {
      await admin.superEraseFeedItem({ kind, id, superPassword: pw });
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleSuperPatchLedger = async () => {
    if (!superEditTx || !isSuperAdminUi) return;
    const pw = window.prompt('Nhập mật khẩu đăng nhập để xác nhận sửa:');
    if (pw == null || pw === '') return;
    try {
      const amountRaw = superEditTx.amount.trim();
      const amount = amountRaw ? parseFloat(amountRaw) : undefined;
      await admin.superPatchLedger({
        id: superEditTx.id,
        superPassword: pw,
        ...(amount != null && Number.isFinite(amount) ? { amount } : {}),
        ...(superEditTx.type ? { type: superEditTx.type } : {}),
      });
      setSuperEditTx(null);
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleChatFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const r = await supportApi.uploadSupportMedia(dataUrl);
      setChatPendingAttachment({ url: r.url, attachmentType: r.attachmentType, name: file.name });
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleSendChat = async () => {
    const text = chatMessage.trim();
    const pend = chatPendingAttachment;
    if (!text && !pend) return;
    try {
      if (chatMode === 'ticket' && chatTicketId) {
        const tempId = `tmp_${Date.now()}`;
        const newMsg = {
          id: tempId,
          content: text || (pend ? '📷 Tập tin đính kèm' : ''),
          senderRole: 'admin',
          createdAt: new Date().toISOString(),
          attachmentUrl: pend ? pend.url : null,
          attachmentType: pend ? pend.attachmentType : null,
          readAt: null,
        };
        setChatMessages((prev) => [...prev, newMsg]);

        if (socket && socket.connected) {
          socket.emit('support_message', {
            ticketId: chatTicketId,
            content: text,
            attachmentUrl: pend ? pend.url : undefined,
            attachmentType: pend ? pend.attachmentType : undefined,
            tempId,
          });
        } else {
          const { message: saved } = await supportApi.sendMessage(
            chatTicketId,
            text,
            pend ? { attachmentUrl: pend.url, attachmentType: pend.attachmentType } : undefined
          );
          setChatMessages((prev) =>
            prev.map((m) => (m.id === tempId ? saved : m))
          );
        }
      } else if (chatMode === 'broadcast') {
        await admin.sendBroadcast(text, pend ? { attachmentUrl: pend.url, attachmentType: pend.attachmentType } : undefined);
      } else if (chatMode === 'direct' && directTargetUserId) {
        await admin.sendDirectMessage(
          directTargetUserId,
          text,
          pend ? { attachmentUrl: pend.url, attachmentType: pend.attachmentType } : undefined
        );
      } else return;
      setChatMessage('');
      setChatPendingAttachment(null);
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const requestDesktopNotifications = async () => {
    if (typeof Notification === 'undefined') {
      alert('Trình duyệt không hỗ trợ thông báo.');
      return;
    }
    const p = await Notification.requestPermission();
    if (p !== 'granted') alert('Chưa được cấp quyền thông báo.');
  };

  const handleToggleGame = async (gameId: string, enabled: boolean) => {
    try {
      await admin.setGameEnabled(gameId, enabled);
      setGames((prev) => prev.map((g) => (g.gameId === gameId ? { ...g, enabled } : g)));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleStaffPromote = async () => {
    const u = staffPromoteUsername.trim();
    if (!u) return;
    try {
      await admin.promoteManager(u);
      setStaffPromoteUsername('');
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleStaffPromoteAssistant = async () => {
    const u = staffPromoteUsername.trim();
    if (!u) return;
    try {
      await admin.promoteAssistant(u);
      setStaffPromoteUsername('');
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleStaffDemote = async (userId: string) => {
    if (!confirm('Hạ tài khoản này xuống người chơi thường?')) return;
    try {
      await admin.demoteManager(userId);
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const tabs = useMemo(() => {
    const all: { id: Tab; label: string; icon: React.ReactNode }[] = [
      { id: 'stats', label: 'Tổng quan', icon: <TrendingUp size={18} /> },
      { id: 'users', label: 'Tài khoản', icon: <Users size={18} /> },
      { id: 'transactions', label: 'Giao dịch', icon: <RefreshCw size={18} /> },
      { id: 'games', label: 'Games', icon: <Gamepad2 size={18} /> },
      { id: 'chat', label: 'Chat', icon: <MessageSquare size={18} /> },
    ];
    if (isSuperAdminUi) {
      all.push({ id: 'staff', label: 'Quản lý nhân sự', icon: <UserCog size={18} /> });
      all.push({ id: 'cms', label: 'Nội dung web', icon: <LayoutTemplate size={18} /> });
    }
    return all;
  }, [isSuperAdminUi]);

  useEffect(() => {
    if ((tab === 'cms' || tab === 'staff') && !isSuperAdminUi) setTab('stats');
  }, [tab, isSuperAdminUi]);

  useEffect(() => {
    if (tab !== 'cms' || !isSuperAdminUi) return;
    const base = resolveApiBase();
    fetch(`${base}/api/site-content`)
      .then((r) => r.json())
      .then((d: { content?: Record<string, string> }) => setCmsDraft(mergeAllSiteContent(d.content || {})))
      .catch(() => setCmsDraft(mergeAllSiteContent({})));
  }, [tab, isSuperAdminUi]);

  const handleSaveCms = async () => {
    setCmsSaving(true);
    try {
      await admin.saveSiteContent(cmsDraft);
      alert('Đã lưu. Người chơi thấy sau khi tải lại Trang chủ / Khách sạn / Nhà hàng / Ưu đãi.');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCmsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-slate-900/95 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-800 text-amber-500">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="text-amber-500" size={24} />
            <h1 className="text-lg font-bold text-amber-50">Bảng quản trị</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void requestDesktopNotifications()}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border ${
              isSuperAdminUi && typeof Notification !== 'undefined' && Notification.permission === 'granted'
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/50 ring-1 ring-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/30'
            }`}
            title={
              isSuperAdminUi
                ? 'Chuông thông báo (tin nhắn, rút tiền) — super đã được xin quyền tự động; bấm để xin lại'
                : 'Cho phép thông báo khi có tin nhắn / rút tiền'
            }
          >
            <Bell size={18} className={isSuperAdminUi ? 'shrink-0' : ''} />
            Thông báo
          </button>
          <button onClick={load} disabled={loading} className="p-2 rounded-lg hover:bg-slate-800 disabled:opacity-50">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <div className="flex border-b border-slate-700 overflow-x-auto scrollbar-none">
        {tabs.map((t) => {
          // Count unread tickets for Chat tab badge
          const isChat = t.id === 'chat';
          const unreadTickets = isChat ? tickets.filter((tk: any) => {
            const msgs = tk.messages || [];
            const last = msgs[msgs.length - 1];
            return last && last.senderRole === 'user' && tk.id !== chatTicketId && !readTicketIds.has(tk.id);
          }).length : 0;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2.5 whitespace-nowrap border-b-2 transition-colors text-xs sm:text-sm flex-shrink-0 ${
                tab === t.id ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.split(' ')[0]}</span>
              {unreadTickets > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-600 text-white text-[9px] font-black">
                  {unreadTickets > 9 ? '9+' : unreadTickets}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <main className={`p-4 mx-auto pb-24 ${tab === 'games' ? 'max-w-3xl' : 'max-w-4xl'}`}>
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400">{error}</div>
        )}

        {/* Tổng quan */}
        {tab === 'stats' && stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-amber-500/20">
              <p className="text-slate-400 text-sm">Tài khoản</p>
              <p className="text-2xl font-bold text-amber-500">{stats.users}</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-amber-500/20">
              <p className="text-slate-400 text-sm">Giao dịch</p>
              <p className="text-2xl font-bold">{stats.transactions}</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-amber-500/20">
              <p className="text-slate-400 text-sm">Tổng nạp</p>
              <p className="text-2xl font-bold text-green-500">${(stats.totalDeposits ?? 0).toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-amber-500/20">
              <p className="text-slate-400 text-sm">Tổng rút</p>
              <p className="text-2xl font-bold text-blue-500">${(stats.totalWithdraws ?? 0).toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-amber-500/20 col-span-2">
              <p className="text-slate-400 text-sm">Lợi nhuận hôm nay</p>
              <p className="text-2xl font-bold">${(stats.todayProfit ?? 0).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Tài khoản - gồm Nạp tiền và Rút tiền */}
        {tab === 'users' && (
          <>
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="Tìm email, username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg"
              />
              <button onClick={load} className="px-4 py-2 bg-amber-600 rounded-lg font-bold">
                Tìm
              </button>
            </div>

            {/* Yêu cầu Nạp tiền chờ duyệt */}
            {deposits.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Wallet size={20} className="text-green-500" /> Nạp tiền chờ duyệt
                </h3>
                <div className="space-y-2">
                  {deposits.map((d) => (
                    <div key={d.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold">{d.user?.username}</p>
                          <p className="text-sm text-slate-400">{d.user?.email}</p>
                          <p className="text-amber-500 font-mono text-lg">${Number(d.amount).toLocaleString()}</p>
                          <p className="text-xs text-slate-500">{new Date(d.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveDeposit(d.id)} className="p-2 bg-green-600 rounded-lg">
                            <Check size={20} />
                          </button>
                          <button onClick={() => handleRejectDeposit(d.id)} className="p-2 bg-red-600 rounded-lg">
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Yêu cầu Rút tiền chờ duyệt */}
            {withdraws.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <CreditCard size={20} className="text-blue-500" /> Rút tiền chờ duyệt
                </h3>
                <div className="space-y-2">
                  {withdraws.map((w) => (
                    <div key={w.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold">{w.user?.username}</p>
                          <p className="text-sm text-slate-400">{w.user?.email}</p>
                          <p className="text-blue-400 font-mono text-lg">${Number(w.amount).toLocaleString()}</p>
                          <p className="text-xs text-slate-500">{new Date(w.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveWithdraw(w.id)} className="p-2 bg-green-600 rounded-lg">
                            <Check size={20} />
                          </button>
                          <button onClick={() => handleRejectWithdraw(w.id)} className="p-2 bg-red-600 rounded-lg">
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danh sách tài khoản — thẻ lật 2 mặt + cộng/trừ nhanh */}
            <h3 className="text-lg font-bold mb-3">Danh sách tài khoản</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {users.map((u) => (
                <div key={u.id}>
                  <MemberFlipCard
                    u={u}
                    canBan
                    onOpenDetail={() => setSelectedUserId(u.id)}
                    onBan={() => handleBanUser(u.id, !u.isBanned)}
                    onQuickAdd={() => {
                      setBalanceAdjustUserId(u.id);
                      setAdjustType('add');
                      setAdjustAddReason('nap_tien');
                      setShowAdjustModal(true);
                    }}
                    onQuickSubtract={() => {
                      setBalanceAdjustUserId(u.id);
                      setAdjustType('subtract');
                      setShowAdjustModal(true);
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Giao dịch + nhật ký admin */}
        {tab === 'transactions' && (
          <div className="space-y-2 overflow-x-auto">
            <p className="text-slate-400 text-sm mb-1">
              Biến động sổ cái và toàn bộ thao tác admin (duyệt nạp/rút, cộng trừ, chat, game…)
            </p>
            {isSuperAdminUi && (
              <p className="text-amber-400/90 text-xs mb-3 border border-amber-600/40 rounded-lg px-3 py-2 bg-amber-950/20">
                Bạn có thể sửa hoặc xóa dòng sổ cái / nhật ký (cần nhập mật khẩu đăng nhập để xác nhận).
              </p>
            )}
            {activityFeed.map((row) =>
              row.kind === 'audit' ? (
                <div
                  key={`a-${row.id}`}
                  className="p-3 bg-slate-900/70 rounded-lg border border-violet-600/35 text-sm flex flex-col gap-1"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ScrollText size={16} className="text-violet-400 shrink-0" />
                      <span className="text-violet-300 font-bold text-xs uppercase">{row.action}</span>
                    </div>
                    <span className="text-slate-500 text-xs whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-200 text-sm">{row.summary}</p>
                  <p className="text-xs text-slate-500">Bởi @{row.adminUsername}</p>
                  {isSuperAdminUi && (
                    <button
                      type="button"
                      onClick={() => void handleSuperEraseFeed('audit', row.id)}
                      className="self-end mt-1 px-2 py-1 text-xs bg-red-900/80 rounded border border-red-600/50"
                    >
                      Xóa dòng
                    </button>
                  )}
                </div>
              ) : (
                <div key={`l-${row.id}`} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className={row.type === 'deposit' || row.type === 'win' ? 'text-green-500' : 'text-red-500'}>
                      {row.type} ${Number(row.amount).toLocaleString()}
                      {row.game ? ` · ${row.game}` : ''}
                    </span>
                    <span className="text-slate-400">{row.user?.username}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Số dư: {Number(row.previousBalance).toLocaleString()} → {Number(row.currentBalance).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleString()}</p>
                  {isSuperAdminUi && (
                    <div className="flex gap-2 mt-2 justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setSuperEditTx({
                            id: row.id,
                            amount: String(row.amount),
                            type: row.type,
                          })
                        }
                        className="px-2 py-1 text-xs bg-amber-800/80 rounded border border-amber-600/50 flex items-center gap-1"
                      >
                        <Pencil size={12} /> Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSuperEraseFeed('ledger', row.id)}
                        className="px-2 py-1 text-xs bg-red-900/80 rounded border border-red-600/50"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}

        {/* Games: Casino Payout v8 + bật/tắt từng game */}
        {tab === 'games' && (
          <div className="space-y-6">
            <CasinoPayoutControl configs={payoutConfigs} games={games} onReload={load} />
            <div>
              <h3 className="text-sm font-bold text-slate-400 mb-2">Bật / tắt từng game</h3>
              <div className="space-y-2">
                {games.map((g) => (
                  <div key={g.gameId} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 flex justify-between items-center gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm">{GAME_NAMES[g.gameId] || g.gameId}</p>
                      <p className="text-xs text-slate-400">Min: ${g.minBet} — Max: ${g.maxBet}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleGame(g.gameId, !g.enabled)}
                      className={`shrink-0 px-3 py-2 rounded-lg font-bold text-sm transition-all duration-150 hover:scale-105 active:scale-95 shadow-md ${
                        g.enabled
                          ? 'bg-green-600 hover:bg-green-500 hover:shadow-green-500/40'
                          : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                    >
                      {g.enabled ? 'BẬT' : 'TẮT'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'cms' && isSuperAdminUi && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Chỉnh <strong className="text-white">Trang chủ</strong>, <strong className="text-white">Khách sạn</strong>,{' '}
              <strong className="text-white">Nhà hàng</strong>, <strong className="text-white">Ưu đãi</strong> — dán URL ảnh/video (https://…).
            </p>
            <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-1">
              {CMS_FORM_SECTIONS.map((sec) => (
                <div key={sec.title} className="space-y-4 border border-slate-700/80 rounded-xl p-3 bg-slate-900/40">
                  <h3 className="text-xs font-bold text-amber-500/95 uppercase tracking-wider border-b border-amber-500/25 pb-2">
                    {sec.title}
                  </h3>
                  {sec.keys.map((key) => (
                    <div key={key}>
                      <label className="block text-xs text-amber-500/90 font-bold mb-1">{CMS_FIELD_LABELS[key] || key}</label>
                      {key.includes('Paragraph') || key.includes('Body') || key.includes('postBody') || key.includes('post2Body') || key.includes('intro') ? (
                        <textarea
                          value={cmsDraft[key] ?? ''}
                          onChange={(e) => setCmsDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                          rows={key.includes('intro') ? 3 : 4}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                        />
                      ) : (
                        <input
                          type="text"
                          value={cmsDraft[key] ?? ''}
                          onChange={(e) => setCmsDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-xs font-mono"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={cmsSaving}
              onClick={() => void handleSaveCms()}
              className="w-full py-3 rounded-xl bg-amber-600 text-black font-bold disabled:opacity-50"
            >
              {cmsSaving ? 'Đang lưu…' : 'Lưu toàn bộ nội dung'}
            </button>
          </div>
        )}

        {tab === 'staff' && isSuperAdminUi && (
          <div className="space-y-6">
            <p className="text-sm text-slate-400">
              Nâng người chơi lên <strong className="text-white">quản lý</strong> hoặc <strong className="text-white">trợ lý</strong> (cùng quyền vào bảng quản trị như quản lý). Hạ quyền hoặc xóa tài khoản quản lý/trợ lý. Tài khoản cấp cao nhất không xóa được từ đây.
            </p>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Tên đăng nhập người chơi"
                value={staffPromoteUsername}
                onChange={(e) => setStaffPromoteUsername(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => void handleStaffPromote()}
                  className="flex-1 px-4 py-2 bg-amber-600 rounded-lg font-bold whitespace-nowrap"
                >
                  Thêm quản lý
                </button>
                <button
                  type="button"
                  onClick={() => void handleStaffPromoteAssistant()}
                  className="flex-1 px-4 py-2 bg-slate-700 border border-amber-500/40 rounded-lg font-bold whitespace-nowrap text-amber-200"
                >
                  Thêm trợ lý
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-400">Danh sách quản lý</h3>
              {staffManagers.length === 0 && <p className="text-xs text-slate-500">Chưa có dữ liệu.</p>}
              {staffManagers.map((m) => (
                <div
                  key={m.id}
                  className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">@{m.username}</p>
                    <p className="text-xs text-slate-400 truncate">{m.fullName || m.email}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {m.role === 'super_admin'
                        ? 'Toàn quyền hệ thống'
                        : m.role === 'assistant'
                          ? 'Trợ lý'
                          : 'Quản lý'}
                      {m.isBanned ? ' · Đang khóa' : ''}
                    </p>
                  </div>
                  {(m.role === 'admin' || m.role === 'assistant') && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleStaffDemote(m.id)}
                        className="px-3 py-2 rounded-lg bg-slate-700 text-xs font-bold border border-slate-600"
                      >
                        Hạ xuống người chơi
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteUser(m.id)}
                        className="px-3 py-2 rounded-lg bg-red-900/90 text-xs font-bold border border-red-600 flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Xóa tài khoản
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat */}
        {tab === 'chat' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 bg-slate-800/70 border border-slate-600 rounded-xl px-3 py-2 leading-relaxed">
              <span className="text-amber-400 font-semibold">Thông báo toàn hệ thống</span> và{' '}
              <span className="text-amber-400 font-semibold">Gửi cá nhân</span> đều tới app người chơi tại{' '}
              <strong className="text-white">Trung tâm hỗ trợ → Thông báo</strong> (socket realtime).{' '}
              <span className="text-slate-400">Ticket chat</span> mở hội thoại theo từng ticket.
            </p>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setChatMode('broadcast')}
                className={`px-3 py-2 rounded-lg text-sm font-bold ${chatMode === 'broadcast' ? 'bg-amber-600' : 'bg-slate-700'}`}
              >
                Thông báo toàn hệ thống
              </button>
              <button
                onClick={() => setChatMode('direct')}
                className={`px-3 py-2 rounded-lg text-sm font-bold ${chatMode === 'direct' ? 'bg-amber-600' : 'bg-slate-700'}`}
              >
                Gửi cá nhân
              </button>
              <button
                onClick={() => setChatMode('ticket')}
                className={`px-3 py-2 rounded-lg text-sm font-bold ${chatMode === 'ticket' ? 'bg-amber-600' : 'bg-slate-700'}`}
              >
                Ticket chat
              </button>
            </div>

            {chatMode === 'direct' && (
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-1">Chọn người nhận</label>
                <select
                  value={directTargetUserId}
                  onChange={(e) => setDirectTargetUserId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 rounded-lg"
                >
                  <option value="">-- Chọn user --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {chatMode === 'ticket' && (
              <div className="space-y-2">
                {tickets.length === 0 && <p className="text-slate-400 text-center py-8">Chưa có ticket chat</p>}
                {tickets.map((t) => {
                  const msgs = t.messages || [];
                  const lastMsg = msgs[msgs.length - 1];
                  const hasUnread = lastMsg && lastMsg.senderRole === 'user' && t.id !== chatTicketId && !readTicketIds.has(t.id);
                  return (
                    <div key={t.id} className={`p-4 rounded-xl border transition-colors ${
                      hasUnread ? 'bg-amber-950/30 border-amber-600/40' : 'bg-slate-800/50 border-slate-700'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {hasUnread && <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />}
                            <p className="font-bold truncate">{t.user?.username}</p>
                          </div>
                          <p className="text-sm text-slate-400 truncate">{t.user?.email}</p>
                          {lastMsg && (
                            <p className={`text-xs mt-1 truncate ${
                              hasUnread ? 'text-amber-300 font-medium' : 'text-slate-500'
                            }`}>
                              {lastMsg.senderRole === 'admin' ? '↩ Bạn: ' : ''}
                              {(lastMsg.content || '').slice(0, 60) || '📎 File đính kèm'}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setChatTicketId(t.id);
                            setChatMessages(t.messages || []);
                            supportApi.markTicketAsRead(t.id).catch(() => {});
                          }}
                          className={`ml-2 shrink-0 px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-150 hover:scale-105 active:scale-95 ${
                            hasUnread ? 'bg-amber-500 text-black' : 'bg-amber-600 hover:bg-amber-500'
                          }`}
                        >
                          {hasUnread ? '● Chat' : 'Chat'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {(chatMode === 'broadcast' || chatMode === 'direct') && (
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                {chatPendingAttachment && (
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs bg-slate-900/80 rounded-lg px-3 py-2 border border-amber-500/30">
                    <span className="truncate text-amber-200">
                      Đính kèm: {chatPendingAttachment.name || chatPendingAttachment.attachmentType}
                    </span>
                    <button type="button" className="text-red-400 font-bold shrink-0" onClick={() => setChatPendingAttachment(null)}>
                      Gỡ
                    </button>
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  <input
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx,.zip"
                    className="hidden"
                    id="chat-file"
                    onChange={handleChatFileInput}
                  />
                  <label htmlFor="chat-file" className="p-2 bg-slate-700 rounded-lg cursor-pointer shrink-0 self-center">
                    <Paperclip size={20} />
                  </label>
                  <textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                    placeholder={
                      chatMode === 'broadcast'
                        ? 'Nhập thông báo gửi toàn hệ thống... (Enter gửi, Shift+Enter xuống dòng)'
                        : 'Nhập tin nhắn gửi cá nhân... (Enter gửi, Shift+Enter xuống dòng)'
                    }
                    rows={2}
                    className="flex-1 px-4 py-2 bg-slate-800 rounded-lg resize-none min-h-[44px] max-h-32"
                    style={{ overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}
                  />
                  <button onClick={handleSendChat} className="px-4 py-2 bg-amber-600 rounded-lg font-bold flex items-center gap-2 shrink-0">
                    <Send size={18} /> Gửi
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Enter: Gửi | Shift+Enter: Xuống dòng. Hỗ trợ gửi hình ảnh, file, video.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal chi tiết user - đầy đủ thông tin, xóa đổi mật khẩu */}
      {selectedUserId && userDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => setSelectedUserId(null)}
        >
          <div
            className="bg-slate-900 rounded-2xl border border-amber-500/30 w-full max-w-md max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Quản lý tài khoản</h2>
                  <p className="text-sm text-slate-400">{userDetail.user?.email}</p>
                  {userDetail.user?.isBanned && <span className="text-red-500 font-bold text-sm">Đã khóa</span>}
                </div>
                <button type="button" onClick={() => setSelectedUserId(null)} className="text-slate-400 hover:text-white p-1">
                  ✕
                </button>
              </div>

              {/* Thẻ ngân hàng 3D — lật mặt sau */}
              <div
                className="mx-auto mb-6 w-full max-w-[340px] cursor-pointer select-none"
                style={{ perspective: '1100px' }}
                onClick={() => setDetailCardFlipped((f) => !f)}
                role="presentation"
              >
                <div
                  className="relative h-[240px] transition-transform duration-700 ease-out"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: detailCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-2xl border border-amber-500/35 p-3 flex flex-col justify-between shadow-2xl bg-gradient-to-br from-slate-900 via-amber-950/50 to-black overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  >
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.3em] text-amber-400/90 font-bold">
                        Mặt trước · VIP {userDetail.user?.vipLevel ?? 0}
                      </p>
                      <p className="text-lg font-bold text-white mt-1 truncate">{userDetail.user?.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Tên đăng nhập <span className="text-amber-200">{userDetail.user?.username ?? '—'}</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                      <div>
                        <span className="text-slate-500">Số tiền</span>
                        <p className="font-mono text-amber-400 font-bold">${(userDetail.user?.balance ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Tổng nạp</span>
                        <p className="font-mono text-emerald-400 font-bold">
                          ${Number(userDetail.user?.totalDeposit ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">Tổng rút</span>
                        <p className="font-mono text-sky-400 font-bold">
                          ${Number(userDetail.user?.totalWithdraw ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-white/10">
                        <span className="text-slate-500">Nạp hợp lệ VIP (admin · Nạp tiền)</span>
                        <p className="font-mono text-yellow-400 font-bold">
                          ${Number(userDetail.user?.vipValidDepositTotal ?? 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    className="absolute inset-0 rounded-2xl border border-slate-600/50 p-3 flex flex-col justify-center gap-1.5 shadow-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-black text-[10px] overflow-y-auto"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-bold mb-1">Mặt sau</p>
                    <div>
                      <span className="text-slate-500">Ngân hàng</span>
                      <p className="font-medium text-white">{userDetail.user?.bankName || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Số TK</span>
                      <p className="font-mono text-slate-200">{userDetail.user?.bankAccountNumber || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Mật khẩu rút tiền (6 số)</span>
                      <p className="font-mono text-amber-300 break-all">
                        {userDetail.user?.withdrawPinPlain != null && userDetail.user.withdrawPinPlain !== ''
                          ? userDetail.user.withdrawPinPlain
                          : userDetail.user?.hasWithdrawPassword
                            ? '(Đã đặt — user cần lưu lại STK để ghi mã hiển thị)'
                            : 'Chưa đặt'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Mật khẩu đăng nhập (plain)</span>
                      <p className="font-mono text-amber-300 break-all">
                        {userDetail.user?.loginPasswordPlain != null && userDetail.user.loginPasswordPlain !== ''
                          ? userDetail.user.loginPasswordPlain
                          : '(Chưa lưu — đăng ký mới hoặc admin đổi mật khẩu để hiện tại đây)'}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-center text-[10px] text-slate-500 mt-2">Chạm thẻ để lật mặt trước / sau</p>
              </div>

              <div className="space-y-4 mt-2">
                <div>
                  <p className="text-sm font-bold text-slate-400 mb-2">Cộng / Trừ tiền</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setBalanceAdjustUserId(null);
                        setAdjustType('add');
                        setAdjustAddReason('nap_tien');
                        setShowAdjustModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 rounded-lg"
                    >
                      <Plus size={18} /> Cộng
                    </button>
                    <button
                      onClick={() => {
                        setBalanceAdjustUserId(null);
                        setAdjustType('subtract');
                        setShowAdjustModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 rounded-lg"
                    >
                      <Minus size={18} /> Trừ
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-400 mb-2">Khóa / mở khóa tài khoản</p>
                  <button
                    onClick={() => handleBanUser(selectedUserId, !userDetail.user?.isBanned)}
                    className={`w-full py-2 rounded-lg font-bold ${userDetail.user?.isBanned ? 'bg-green-600' : 'bg-red-600'}`}
                  >
                    {userDetail.user?.isBanned ? 'Mở khóa' : 'Khóa tài khoản'}
                  </button>
                </div>

                {isSuperAdminUi && (
                  <div>
                    <p className="text-sm font-bold text-slate-400 mb-2">Xóa vĩnh viễn</p>
                    <button
                      onClick={() => handleDeleteUser(selectedUserId)}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-red-900 border border-red-600 rounded-lg"
                    >
                      <Trash2 size={18} /> Xóa tài khoản
                    </button>
                  </div>
                )}

                <div>
                  <p className="text-sm font-bold text-slate-400 mb-2">Lịch sử cá cược (cập nhật realtime)</p>
                  <div className="max-h-48 overflow-y-auto space-y-1 mb-4 border border-slate-700 rounded-lg p-2">
                    {userBets.length === 0 && <p className="text-xs text-slate-500">Chưa có cược.</p>}
                    {userBets.map((b: any) => (
                      <div key={b.id} className="text-[11px] p-2 bg-slate-800/80 rounded border border-slate-700/50">
                        <span className="text-amber-400 font-bold">{GAME_NAMES[b.game] || b.game}</span>
                        <span className="text-slate-300 ml-2">Cược ${Number(b.betAmount).toLocaleString()}</span>
                        <span className="text-slate-500 ml-2">KQ: {b.result ?? '—'}</span>
                        <span className="text-green-400 ml-2">Trả ${Number(b.payout).toLocaleString()}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{new Date(b.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-400 mb-2">Biến động số dư</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {(userDetail.transactions || []).map((t: any) => {
                      const meta = t.metadata as Record<string, unknown> | null | undefined;
                      const ar = meta?.adminAdjustReason;
                      const reasonTxt =
                        ar === 'nap_tien'
                          ? 'Nạp tiền'
                          : ar === 'nop_phat'
                            ? 'Nộp phạt'
                            : ar === 'khuyen_mai'
                              ? 'Khuyến mãi'
                              : ar === 'khac'
                                ? 'Lý do khác'
                                : null;
                      return (
                        <div key={t.id} className="text-xs p-2 bg-slate-800 rounded">
                          <span className={t.type === 'deposit' || t.type === 'win' ? 'text-green-500' : 'text-red-500'}>
                            {t.type} ${Number(t.amount).toLocaleString()}
                            {t.game ? ` · ${t.game}` : ''}
                          </span>
                          {reasonTxt && <span className="text-amber-400 ml-1">({reasonTxt})</span>}
                          <span className="text-slate-500 ml-2">{new Date(t.createdAt).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sửa bút toán sổ cái (chỉ tài khoản có quyền mở rộng) */}
      {superEditTx && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-amber-500/30">
            <h3 className="text-lg font-bold text-amber-400 mb-3">Sửa giao dịch sổ cái</h3>
            <label className="block text-xs text-slate-400 mb-1">Loại</label>
            <select
              value={superEditTx.type}
              onChange={(e) => setSuperEditTx((s) => (s ? { ...s, type: e.target.value } : s))}
              className="w-full px-3 py-2 bg-slate-800 rounded-lg mb-3 text-sm"
            >
              {['bet', 'win', 'lose', 'deposit', 'withdraw'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <label className="block text-xs text-slate-400 mb-1">Số tiền</label>
            <input
              type="number"
              value={superEditTx.amount}
              onChange={(e) => setSuperEditTx((s) => (s ? { ...s, amount: e.target.value } : s))}
              className="w-full px-3 py-2 bg-slate-800 rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setSuperEditTx(null)} className="flex-1 py-2 bg-slate-600 rounded-lg">
                Hủy
              </button>
              <button type="button" onClick={() => void handleSuperPatchLedger()} className="flex-1 py-2 bg-amber-600 rounded-lg font-bold">
                Lưu + replay sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cộng/trừ tiền */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-amber-500/20">
            <h3 className="text-lg font-bold mb-1">{adjustType === 'add' ? 'Cộng tiền' : 'Trừ tiền'}</h3>
            <p className="text-xs text-slate-500 mb-4">
              Tên đăng nhập:{' '}
              <span className="font-mono text-amber-200">
                {users.find((u) => u.id === (balanceAdjustUserId ?? selectedUserId))?.username ??
                  userDetail?.user?.username ??
                  '—'}
              </span>
            </p>
            {adjustType === 'add' && (
              <div className="mb-3">
                <label className="block text-xs text-slate-400 mb-1">Lý do cộng tiền</label>
                <select
                  value={adjustAddReason}
                  onChange={(e) => setAdjustAddReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 rounded-lg text-sm"
                >
                  {ADD_REASON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {adjustAddReason === 'nap_tien' && (
                  <p className="text-[10px] text-amber-400/90 mt-1">
                    Nạp tiền được cộng vào tổng hợp lệ VIP; đủ ngưỡng → lên VIP + thưởng sau 5 phút.
                  </p>
                )}
              </div>
            )}
            <input
              type="number"
              placeholder="Số tiền"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAdjustModal(false);
                  setBalanceAdjustUserId(null);
                }}
                className="flex-1 py-2 bg-slate-600 rounded-lg"
              >
                Hủy
              </button>
              <button type="button" onClick={handleAdjustBalance} className="flex-1 py-2 bg-amber-600 rounded-lg font-bold">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chat */}
      {chatTicketId && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Chat hỗ trợ</h3>
            <button onClick={() => setChatTicketId(null)} className="p-2">
              ✕
            </button>
          </div>
          <VirtualChatList
            items={chatMessages}
            itemHeight={110}
            renderItem={(m: any) => (
              <div
                key={m.id}
                className={`p-3 rounded-lg max-w-[80%] ${m.senderRole === 'admin' ? 'ml-auto bg-amber-600/30' : 'bg-slate-700'}`}
                style={{ overflowWrap: 'break-word', whiteSpace: 'pre-wrap', minHeight: '90px' }}
              >
                {m.content ? <p className="text-sm">{m.content}</p> : null}
                {m.attachmentUrl &&
                  (m.attachmentType === 'video' ? (
                    <video src={m.attachmentUrl} controls className="mt-2 max-w-full rounded-lg max-h-64" />
                  ) : m.attachmentType === 'file' ? (
                    <a
                      href={m.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-amber-400 underline"
                    >
                      Mở đính kèm
                    </a>
                  ) : (
                    <img
                      src={m.attachmentUrl}
                      alt="Đính kèm"
                      className="mt-2 max-w-full rounded-lg max-h-64 object-contain bg-slate-900/50"
                    />
                  ))}
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 justify-end">
                  <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                  {m.senderRole === 'admin' && (
                    <span className={m.readAt ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                      ({m.readAt ? 'Đã xem' : 'Đã gửi'})
                    </span>
                  )}
                </p>
              </div>
            )}
          />
          <div className="flex flex-col gap-2">
            {chatPendingAttachment && (
              <div className="flex items-center justify-between gap-2 text-xs bg-slate-900/80 rounded-lg px-3 py-2 border border-amber-500/30">
                <span className="truncate text-amber-200">
                  Đính kèm: {chatPendingAttachment.name || chatPendingAttachment.attachmentType}
                </span>
                <button type="button" className="text-red-400 font-bold shrink-0" onClick={() => setChatPendingAttachment(null)}>
                  Gỡ
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
            <input
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.zip"
              className="hidden"
              id="ticket-file"
              onChange={handleChatFileInput}
            />
            <label htmlFor="ticket-file" className="p-2 bg-slate-700 rounded-lg cursor-pointer shrink-0 self-center">
              <Paperclip size={20} />
            </label>
            <textarea
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChat();
                }
              }}
              placeholder="Nhập tin nhắn... (Enter gửi, Shift+Enter xuống dòng)"
              rows={2}
              className="flex-1 px-4 py-2 bg-slate-800 rounded-lg resize-none min-h-[44px] max-h-32"
              style={{ overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}
            />
            <button onClick={handleSendChat} className="px-4 py-2 bg-amber-600 rounded-lg font-bold shrink-0">
              Gửi
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
