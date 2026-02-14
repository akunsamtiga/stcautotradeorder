import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  role: 'user' | 'admin' | 'superadmin';
  isEmailVerified: boolean;
  referralCode: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // ✅ FIX: Tidak persist isAuthenticated — di-derive saat rehydration
      // Mencegah user "sudah login" padahal token sudah expired
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // ✅ FIX: isAuthenticated berdasarkan keberadaan token + user
          state.isAuthenticated = !!(state.token && state.user);
          state.setHasHydrated(true);
        }
      },
    }
  )
);