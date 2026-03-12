import { Platform } from 'react-native';

export const API_BASE_URL = Platform.select({
  android: 'http://10.40.50.72:5280',
  ios: 'http://10.40.50.72:5280',
  web: 'http://localhost:5280',
  default: 'http://localhost:5280',
});

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
