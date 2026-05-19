import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const raw = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
const SOCKET_URL = raw.trim() !== '' ? raw.replace(/\/$/, '') : 'http://localhost:4000';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, []);

  return { socket, connected };
}
