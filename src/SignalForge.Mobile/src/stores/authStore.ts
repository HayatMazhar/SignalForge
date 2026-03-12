import { create } from 'zustand';
import { Platform } from 'react-native';

interface User { id: string; email: string; fullName: string; }

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
  loadToken: () => Promise<void>;
}

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    const SecureStore = await import('expo-secure-store');
    return await SecureStore.getItemAsync(key);
  }
}

async function removeItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(key);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (token, refreshToken, user) => {
    try {
      await setItem('sf_token', token);
      await setItem('sf_refresh', refreshToken);
      await setItem('sf_user', JSON.stringify(user));
    } catch {}
    set({ token, refreshToken, user, isAuthenticated: true, isLoading: false });
  },
  setTokens: async (token, refreshToken) => {
    try {
      await setItem('sf_token', token);
      await setItem('sf_refresh', refreshToken);
    } catch {}
    set({ token, refreshToken });
  },
  logout: async () => {
    try {
      await removeItem('sf_token');
      await removeItem('sf_refresh');
      await removeItem('sf_user');
    } catch {}
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false, isLoading: false });
  },
  loadToken: async () => {
    try {
      const token = await getItem('sf_token');
      const refreshToken = await getItem('sf_refresh');
      const userStr = await getItem('sf_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, refreshToken, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
