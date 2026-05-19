import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  balance?: number;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  register: (email: string, username: string, fullName: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('casino_token'));
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const t = sessionStorage.getItem('casino_token');
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: u } = await authApi.me();
      setUser(u);
    } catch {
      sessionStorage.removeItem('casino_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [token, refreshUser]);

  const login = async (email: string, password: string) => {
    const { user: u, token: t } = await authApi.login(email, password);
    sessionStorage.setItem('casino_token', t);
    setToken(t);
    setUser(u);
    try {
      const { user: me } = await authApi.me();
      setUser(me);
      return me;
    } catch {
      return u;
    }
  };

  const register = async (email: string, username: string, fullName: string, password: string) => {
    const { user: u, token: t } = await authApi.register(email, username, fullName, password);
    sessionStorage.setItem('casino_token', t);
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    sessionStorage.removeItem('casino_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
