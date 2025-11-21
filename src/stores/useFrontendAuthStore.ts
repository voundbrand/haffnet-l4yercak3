/**
 * Frontend Authentication Store (Zustand)
 *
 * Manages client-side authentication state:
 * - User data
 * - Session token
 * - Loading states
 *
 * Persists to localStorage for cross-tab synchronization.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface FrontendUser {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
}

interface FrontendAuthState {
  user: FrontendUser | null;
  sessionToken: string | null;
  loading: boolean;

  // Actions
  setUser: (user: FrontendUser) => void;
  setSessionToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useFrontendAuthStore = create<FrontendAuthState>()(
  persist(
    (set) => ({
      user: null,
      sessionToken: null,
      loading: false,

      setUser: (user) => set({ user }),
      setSessionToken: (token) => set({ sessionToken: token }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ user: null, sessionToken: null }),
      hydrate: () => {
        // Called on mount to ensure hydration
        set((state) => state);
      },
    }),
    {
      name: 'frontend-auth-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
