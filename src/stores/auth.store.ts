import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/database.types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,

            login: async (username: string, password: string) => {
                set({ isLoading: true });
                try {
                    // Import here to avoid circular dependency
                    const { authService } = await import('../services/auth.service');
                    const user = await authService.login(username, password);
                    set({ user, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: () => {
                set({ user: null, isAuthenticated: false });
                localStorage.removeItem('auth-storage');
            },

            setUser: (user) => {
                set({ user, isAuthenticated: !!user });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
