import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

const H = { headerShown: true, headerStyle: { backgroundColor: '#0C0F1A' }, headerTintColor: '#F0F4F8' };

const SCREENS: { name: string; title: string }[] = [
  { name: 'chat', title: 'AI Chat' },
  { name: 'backtest', title: 'Backtest' },
  { name: 'news', title: 'News' },
  { name: 'watchlist', title: 'Watchlist' },
  { name: 'alerts', title: 'Alerts' },
  { name: 'insights', title: 'AI Insights' },
  { name: 'leaderboard', title: 'Leaderboard' },
  { name: 'copy-trading', title: 'Copy Trading' },
  { name: 'heatmap', title: 'Heatmap' },
  { name: 'sector-rotation', title: 'Sectors' },
  { name: 'anomaly-detector', title: 'Anomalies' },
  { name: 'share-signal', title: 'Share' },
  { name: 'pdf-export', title: 'Export' },
  { name: 'multi-chart', title: 'Charts' },
  { name: 'compare', title: 'Compare' },
  { name: 'settings', title: 'Settings' },
  { name: 'screener', title: 'Screener' },
  { name: 'voice-command', title: 'Voice AI' },
  { name: 'swipe-signals', title: 'Swipe' },
  { name: 'morning-briefing', title: 'Briefing' },
  { name: 'stock-radar', title: 'Radar' },
  { name: 'gamification', title: 'Badges' },
  { name: 'market-mood', title: 'Market Mood' },
  { name: 'price-alerts-map', title: 'Smart Alerts' },
  { name: 'ai-screener', title: 'AI Screener' },
  { name: 'trading-simulator', title: 'Simulator' },
  { name: 'streak-tracker', title: 'Streaks' },
  { name: 'admin/index', title: 'Admin' },
  { name: 'admin/users', title: 'Users' },
  { name: 'admin/roles', title: 'Roles' },
  { name: 'admin/config', title: 'Config' },
  { name: 'earnings', title: 'Earnings' },
  { name: 'economic-calendar', title: 'Economy' },
  { name: 'insider-trades', title: 'Insiders' },
  { name: 'dividends', title: 'Dividends' },
  { name: 'ipos', title: 'IPOs' },
  { name: 'price-predictor', title: 'AI Predict' },
  { name: 'portfolio-optimizer', title: 'Optimizer' },
  { name: 'trade-journal', title: 'Journal' },
  { name: 'natural-query', title: 'AI Query' },
  { name: 'sentiment-trend', title: 'Sentiment' },
  { name: 'analytics', title: 'Analytics' },
  { name: 'correlation', title: 'Correlation' },
  { name: 'tax-report', title: 'Tax Report' },
  { name: 'discussion', title: 'Discussion' },
  { name: 'webhooks', title: 'Webhooks' },
  { name: 'notification-center', title: 'Notifications' },
  { name: 'activity-log', title: 'Activity' },
  { name: 'data-export', title: 'Export Data' },
  { name: 'referral', title: 'Referral' },
  { name: 'help-center', title: 'Help' },
  { name: 'feedback', title: 'Feedback' },
  { name: 'connected-accounts', title: 'Brokers' },
];

export default function RootLayout() {
  const loadToken = useAuthStore((s) => s.loadToken);
  useEffect(() => { loadToken(); }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#06060B' }, headerBackTitle: 'Back' }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="stocks/[symbol]" options={{ ...H, headerTitle: '', headerBackTitle: 'Back' }} />
          {SCREENS.map((s) => (
            <Stack.Screen key={s.name} name={s.name} options={{ ...H, headerTitle: s.title, headerBackTitle: 'Back' }} />
          ))}
          <Stack.Screen name="not-found" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
