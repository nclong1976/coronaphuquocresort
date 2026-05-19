import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAppSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'corona_player_notices_v1';
const SEEN_KEY = 'corona_player_notices_seen_at';
const MAX_NOTICES = 50;

export type PlayerNotice = {
  id: string;
  at: string;
  content: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  source: 'broadcast' | 'direct' | 'system';
};

export type PlayerNotificationsContextValue = {
  notices: PlayerNotice[];
  unreadCount: number;
  markNoticesSeen: () => void;
  pushSystemNotice: (content: string) => void;
};

const PlayerNotificationsContext = createContext<PlayerNotificationsContextValue | null>(null);

function loadStored(): PlayerNotice[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as PlayerNotice[]) : [];
  } catch {
    return [];
  }
}

function saveStored(n: PlayerNotice[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(n.slice(0, MAX_NOTICES)));
  } catch {
    /* ignore quota */
  }
}

export function PlayerNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useAppSocket();
  const { token } = useAuth();
  const [notices, setNotices] = useState<PlayerNotice[]>(loadStored);
  const [seenAt, setSeenAt] = useState(() => sessionStorage.getItem(SEEN_KEY) ?? '');

  const append = useCallback((row: Omit<PlayerNotice, 'id' | 'at'> & { at?: string }) => {
    const item: PlayerNotice = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      at: row.at ?? new Date().toISOString(),
      content: row.content,
      attachmentUrl: row.attachmentUrl,
      attachmentType: row.attachmentType,
      source: row.source,
    };
    setNotices((prev) => {
      const next = [item, ...prev].slice(0, MAX_NOTICES);
      saveStored(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!socket || !token) return;
    const onBroadcast = (d: {
      content?: string;
      attachmentUrl?: string | null;
      attachmentType?: string | null;
    }) => {
      const c = typeof d?.content === 'string' ? d.content.trim() : '';
      const att = d?.attachmentUrl && String(d.attachmentUrl).trim() ? String(d.attachmentUrl).trim() : null;
      if (!c && !att) return;
      append({
        content: c || '📎 Đính kèm từ Admin',
        attachmentUrl: att,
        attachmentType: d?.attachmentType ?? null,
        source: 'broadcast',
      });
    };
    const onDirect = (d: {
      content?: string;
      attachmentUrl?: string | null;
      attachmentType?: string | null;
    }) => {
      const c = typeof d?.content === 'string' ? d.content.trim() : '';
      const att = d?.attachmentUrl && String(d.attachmentUrl).trim() ? String(d.attachmentUrl).trim() : null;
      if (!c && !att) return;
      append({
        content: c || '📎 Đính kèm từ Admin',
        attachmentUrl: att,
        attachmentType: d?.attachmentType ?? null,
        source: 'direct',
      });
    };
    const onVipBonus = (d: { message?: string; amount?: number }) => {
      const base =
        typeof d?.message === 'string' && d.message.trim()
          ? d.message.trim()
          : 'Hệ thống đã cộng tiền VIP thành công vào tài khoản quý khách';
      const msg =
        typeof d?.amount === 'number' && d.amount > 0 ? `${base} (+$${d.amount.toLocaleString()})` : base;
      append({ content: msg, source: 'system' });
    };
    socket.on('admin_broadcast', onBroadcast);
    socket.on('admin_direct', onDirect);
    socket.on('vip_bonus_credited', onVipBonus);
    return () => {
      socket.off('admin_broadcast', onBroadcast);
      socket.off('admin_direct', onDirect);
      socket.off('vip_bonus_credited', onVipBonus);
    };
  }, [socket, token, append]);

  const markNoticesSeen = useCallback(() => {
    const t = new Date().toISOString();
    setSeenAt(t);
    try {
      sessionStorage.setItem(SEEN_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const pushSystemNotice = useCallback(
    (content: string) => {
      append({ content, source: 'system' });
    },
    [append]
  );

  const unreadCount = useMemo(() => {
    if (!seenAt) return notices.length;
    return notices.filter((n) => n.at > seenAt).length;
  }, [notices, seenAt]);

  const value = useMemo(
    () => ({ notices, unreadCount, markNoticesSeen, pushSystemNotice }),
    [notices, unreadCount, markNoticesSeen, pushSystemNotice]
  );

  return <PlayerNotificationsContext.Provider value={value}>{children}</PlayerNotificationsContext.Provider>;
}

export function usePlayerNotifications(): PlayerNotificationsContextValue {
  const ctx = useContext(PlayerNotificationsContext);
  if (!ctx) {
    return { notices: [], unreadCount: 0, markNoticesSeen: () => {}, pushSystemNotice: () => {} };
  }
  return ctx;
}
