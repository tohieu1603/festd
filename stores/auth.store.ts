import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '@/lib/types';
import { api, setTokens, clearTokens, getAccessToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const tokens: AuthTokens = await api.login({ username, password });
          setTokens(tokens);

          // Fetch user data after successful login
          await get().fetchUser();

          set({ isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false, isAuthenticated: false });
          throw error;
        }
      },

      logout: () => {
        clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      fetchUser: async () => {
        const token = getAccessToken();
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await api.get<User>('/auth/me');
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch user:', error);
          clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Do NOT persist isAuthenticated - it should be determined by token validity
        user: state.user,
      }),
    }
  )
);
