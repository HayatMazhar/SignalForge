import { Platform } from 'react-native';
import { useThemeStore, type ThemeColors } from '../stores/themeStore';

const AZURE_API = 'https://signalforge-api.ambitiouscliff-f7080230.eastus.azurecontainerapps.io';

export const API_BASE_URL = Platform.select({
  android: AZURE_API,
  ios: AZURE_API,
  web: AZURE_API,
  default: AZURE_API,
});

export function useTheme(): ThemeColors {
  return useThemeStore((s) => s.colors);
}

export const COLORS = {
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
  textPrimary: '#F0F4F8',
  textMuted: '#5B6378',
};
