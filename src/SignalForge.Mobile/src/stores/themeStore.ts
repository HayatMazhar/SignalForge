import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'dark' | 'light' | 'midnight' | 'amoled' | 'sunset';

export type ThemeColors = {
  bg: string;
  surface: string;
  surfaceLight: string;
  border: string;
  accent: string;
  accentDim: string;
  danger: string;
  warning: string;
  info: string;
  purple: string;
  cyan: string;
  textPrimary: string;
  textMuted: string;
  isDark: boolean;
};

export type ThemeMeta = {
  id: ThemeMode;
  label: string;
  icon: string;
  preview: [string, string, string];
};

export const DARK: ThemeColors = {
  bg: '#06060B',
  surface: '#0C0F1A',
  surfaceLight: '#151929',
  border: '#1A1F35',
  accent: '#00FF94',
  accentDim: '#00CC76',
  danger: '#FF3B5C',
  warning: '#FFB020',
  info: '#38BDF8',
  purple: '#A78BFA',
  cyan: '#06B6D4',
  textPrimary: '#F0F4F8',
  textMuted: '#5B6378',
  isDark: true,
};

export const LIGHT: ThemeColors = {
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceLight: '#F0F2F5',
  border: '#E2E8F0',
  accent: '#00A86B',
  accentDim: '#009960',
  danger: '#E53E3E',
  warning: '#DD6B20',
  info: '#2B6CB0',
  purple: '#805AD5',
  cyan: '#0891B2',
  textPrimary: '#1A202C',
  textMuted: '#718096',
  isDark: false,
};

export const MIDNIGHT: ThemeColors = {
  bg: '#0B1120',
  surface: '#111D35',
  surfaceLight: '#172647',
  border: '#1E3058',
  accent: '#60A5FA',
  accentDim: '#3B82F6',
  danger: '#F87171',
  warning: '#FBBF24',
  info: '#67E8F9',
  purple: '#C4B5FD',
  cyan: '#22D3EE',
  textPrimary: '#E8EDF5',
  textMuted: '#6B83A8',
  isDark: true,
};

export const AMOLED: ThemeColors = {
  bg: '#000000',
  surface: '#0A0A0A',
  surfaceLight: '#141414',
  border: '#1C1C1C',
  accent: '#00FF94',
  accentDim: '#00CC76',
  danger: '#FF4D6A',
  warning: '#FFB020',
  info: '#38BDF8',
  purple: '#A78BFA',
  cyan: '#06B6D4',
  textPrimary: '#FAFAFA',
  textMuted: '#525252',
  isDark: true,
};

export const SUNSET: ThemeColors = {
  bg: '#1A1015',
  surface: '#261820',
  surfaceLight: '#33202B',
  border: '#3D2835',
  accent: '#F59E0B',
  accentDim: '#D97706',
  danger: '#EF4444',
  warning: '#FB923C',
  info: '#F9A8D4',
  purple: '#E879F9',
  cyan: '#FCA5A5',
  textPrimary: '#FEF3C7',
  textMuted: '#92647A',
  isDark: true,
};

export const THEMES: Record<ThemeMode, ThemeColors> = {
  system: DARK,
  dark: DARK,
  light: LIGHT,
  midnight: MIDNIGHT,
  amoled: AMOLED,
  sunset: SUNSET,
};

export const THEME_LIST: ThemeMeta[] = [
  { id: 'system',   label: 'System',   icon: 'phone-portrait', preview: ['#06060B', '#0C0F1A', '#00FF94'] },
  { id: 'dark',     label: 'Dark',     icon: 'moon',           preview: ['#06060B', '#0C0F1A', '#00FF94'] },
  { id: 'light',    label: 'Light',    icon: 'sunny',          preview: ['#F5F7FA', '#FFFFFF', '#00A86B'] },
  { id: 'midnight', label: 'Midnight', icon: 'cloudy-night',   preview: ['#0B1120', '#111D35', '#60A5FA'] },
  { id: 'amoled',   label: 'AMOLED',   icon: 'contrast',       preview: ['#000000', '#0A0A0A', '#00FF94'] },
  { id: 'sunset',   label: 'Sunset',   icon: 'partly-sunny',   preview: ['#1A1015', '#261820', '#F59E0B'] },
];

const STORAGE_KEY = 'sf_theme_mode';

function resolveColors(mode: ThemeMode, system: ColorSchemeName): ThemeColors {
  if (mode === 'system') return system === 'light' ? LIGHT : DARK;
  return THEMES[mode] ?? DARK;
}

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  colors: resolveColors('system', Appearance.getColorScheme()),

  setMode: async (mode) => {
    const colors = resolveColors(mode, Appearance.getColorScheme());
    set({ mode, colors });
    try { await AsyncStorage.setItem(STORAGE_KEY, mode); } catch {}
  },

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const validModes: ThemeMode[] = ['system', 'dark', 'light', 'midnight', 'amoled', 'sunset'];
      const mode: ThemeMode = validModes.includes(saved as ThemeMode) ? (saved as ThemeMode) : 'system';
      const colors = resolveColors(mode, Appearance.getColorScheme());
      set({ mode, colors });
    } catch {}
  },
}));

Appearance.addChangeListener(({ colorScheme }) => {
  const { mode } = useThemeStore.getState();
  if (mode === 'system') {
    useThemeStore.setState({ colors: resolveColors('system', colorScheme) });
  }
});
