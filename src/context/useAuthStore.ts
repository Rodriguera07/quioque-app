import { create } from 'zustand';

const MOCK_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

interface AuthState {
  isAuthenticated: boolean;
  userName: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userName: null,
  login: (username, password) => {
    const ok =
      username.trim().toLowerCase() === MOCK_CREDENTIALS.username &&
      password === MOCK_CREDENTIALS.password;
    if (ok) {
      set({ isAuthenticated: true, userName: 'Gerente' });
    }
    return ok;
  },
  logout: () => set({ isAuthenticated: false, userName: null }),
}));
