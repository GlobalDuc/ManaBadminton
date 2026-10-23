import React, { createContext, useContext, useState } from 'react';
import type { AuthResponse } from '../types';

interface AuthContextValue {
  user: AuthResponse | null;
  loginUser: (data: AuthResponse) => void;
  logoutUser: () => void;
  canManage: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'bh_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved) as AuthResponse;
    } catch {
      return null;
    }
  });

  const loginUser = (data: AuthResponse) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setUser(data);
  };

  const logoutUser = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const canManage = user?.role === 'Admin' || user?.role === 'Treasurer';

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser, canManage }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
