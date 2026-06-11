import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { resolveSocketUrl } from '../api/resolveApiBase';

export function useSupportSocket(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setConnected(false);
      return;
    }

    const url = resolveSocketUrl();
    const opts = {
      auth: { token },
      // Ưu tiên websocket trước để kết nối tức thì và giảm độ trễ, fallback về polling nếu bị chặn
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      timeout: 12000,
    };
    const s = url ? io(url, opts) : io(opts);

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    setSocket(s);
    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  return { socket, connected };
}
