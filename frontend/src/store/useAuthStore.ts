// store/useAuthStore.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  balanceStars: number;
  isAdmin: boolean;
  totalSpent: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
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
          },
          isAuthenticated: true,
        }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      updateBalance: (newBalance) =>
        set((state) => ({
          user: state.user ? { ...state.user, balanceStars: newBalance } : null,
        })),
    }),
    {
      name: "prompt-marketplace-auth",
      skipHydration: true,
    }
  )
);
