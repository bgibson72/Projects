import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'employee';
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  phone: string;
  color: string;
  idNumber: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set): AuthState => {
      console.log('authStore: Initializing state');
      return {
        user: null,
        isAuthenticated: false,
        login: (user: User) => {
          console.log('authStore: Logging in user:', user);
          set({ user, isAuthenticated: true });
        },
        logout: () => {
          console.log('authStore: Logging out');
          set({ user: null, isAuthenticated: false });
        },
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
