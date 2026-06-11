import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { walletApi } from '../api/client';
import { useAuth } from './AuthContext';
import { useAppSocket } from './SocketContext';

interface WalletContextType {
  balance: number;
  isOnline: boolean;
  isSyncing: boolean;
  error: string | null;
  syncBalance: () => Promise<void>;
  setBalanceFromGame: (balance: number | ((prev: number) => number)) => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [balance, setBalance] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { socket } = useAppSocket();

  const syncBalance = useCallback(async () => {
    const t = sessionStorage.getItem('casino_token');
    if (!t) return;

    setIsSyncing(true);
    setError(null);
    try {
      const { balance: b } = await walletApi.sync();
      setBalance(b);
      setIsOnline(true);
    } catch (err) {
      setError((err as Error).message);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const setBalanceFromGame = useCallback((b: number | ((prev: number) => number)) => {
    setBalance((prev) => (typeof b === 'function' ? b(prev) : b));
    setIsOnline(true);
    setError(null);
  }, []);

  useEffect(() => {
    if (token) syncBalance();
    else setBalance(0);
  }, [token, syncBalance]);

  useEffect(() => {
    if (!socket) return;
    const onBalanceUpdated = (payload: { balance: number }) => {
      if (typeof payload?.balance === 'number') {
        setBalance(payload.balance);
      }
    };
    socket.on('balance_updated', onBalanceUpdated);
    return () => {
      socket.off('balance_updated', onBalanceUpdated);
    };
  }, [socket]);

  return (
    <WalletContext.Provider
      value={{
        balance,
        isOnline,
        isSyncing,
        error,
        syncBalance,
        setBalanceFromGame,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
