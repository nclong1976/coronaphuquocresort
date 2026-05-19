import React, { createContext, useContext } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useSupportSocket } from '../hooks/useSupportSocket';

type SocketCtx = { socket: Socket | null; connected: boolean };

const SocketContext = createContext<SocketCtx>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { socket, connected } = useSupportSocket(token);
  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
}

export function useAppSocket() {
  return useContext(SocketContext);
}
