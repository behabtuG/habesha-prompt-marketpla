// store/useAuthStore.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  telegramId?: string | null;
  email?: string | null;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  balanceStars: number;
  isAdmin: boolean;
  totalSpent: number;
  authProvider?: "TELEGRAM" | "EMAIL" | "BOTH";
  emailVerified?: boolean;
  hasTelegram?: boolean;
  hasEmail?: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) =>
        set({
          token,
          user: {
            ...user,
            balanceStars: user.balanceStars || 0,
            totalSpent: user.totalSpent || 0,
            hasTelegram: !!user.telegramId,
            hasEmail: !!user.email,
          },
          isAuthenticated: true,
        }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      updateBalance: (newBalance) =>
        set((state) => ({
          user: state.user ? { ...state.user, balanceStars: newBalance } : null,
        })),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "prompt-marketplace-auth",
    }
  )
);
