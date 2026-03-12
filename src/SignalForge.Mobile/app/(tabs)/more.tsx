import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';

const { width } = Dimensions.get('window');
const C = {
  bg: '#06060B', surface: '#0C0F1A', surfaceLight: '#151929', accent: '#00FF94',
  danger: '#FF3B5C', warning: '#FFB020', info: '#38BDF8', purple: '#A78BFA',
  textPrimary: '#F0F4F8', textMuted: '#5B6378', border: '#1A1F35',
};

const SECTIONS = [
  {
    title: 'Trading',
    items: [
      { icon: 'eye', label: 'Watchlist', route: '/watchlist', color: C.accent },
      { icon: 'notifications', label: 'Alerts', route: '/alerts', color: C.warning },
      { icon: 'newspaper', label: 'News', route: '/news', color: C.info },
      { icon: 'search', label: 'Screener', route: '/screener', color: C.purple },
      { icon: 'swap-horizontal', label: 'Compare', route: '/compare', color: C.accent },
      { icon: 'apps', label: 'Heatmap', route: '/heatmap', color: C.warning },
      { icon: 'analytics', label: 'Options Flow', route: '/options-flow', color: C.purple },
    ],
  },
  {
    title: 'AI Powered',
    items: [
      { icon: 'chatbubble', label: 'AI Chat', route: '/chat', color: C.accent },
      { icon: 'analytics', label: 'AI Predict', route: '/price-predictor', color: C.info },
      { icon: 'color-wand', label: 'Optimizer', route: '/portfolio-optimizer', color: C.purple },
      { icon: 'bulb', label: 'Insights', route: '/insights', color: C.warning },
      { icon: 'chatbox', label: 'AI Query', route: '/natural-query', color: C.accent },
      { icon: 'trending-up', label: 'Sentiment', route: '/sentiment-trend', color: C.info },
      { icon: 'warning', label: 'Anomalies', route: '/anomaly-detector', color: C.danger },
      { icon: 'mic', label: 'Voice AI', route: '/voice-command', color: C.accent },
      { icon: 'swap-horizontal', label: 'Swipe', route: '/swipe-signals', color: C.warning },
      { icon: 'sunny', label: 'Briefing', route: '/morning-briefing', color: C.info },
      { icon: 'radio', label: 'Radar', route: '/stock-radar', color: C.purple },
    ],
  },
  {
    title: 'Research',
    items: [
      { icon: 'flask', label: 'Backtest', route: '/backtest', color: C.warning },
      { icon: 'calendar', label: 'Earnings', route: '/earnings', color: C.info },
      { icon: 'business', label: 'Economy', route: '/economic-calendar', color: C.purple },
      { icon: 'people', label: 'Insiders', route: '/insider-trades', color: C.accent },
      { icon: 'cash', label: 'Dividends', route: '/dividends', color: C.warning },
      { icon: 'rocket', label: 'IPOs', route: '/ipos', color: C.danger },
      { icon: 'grid', label: 'Correlation', route: '/correlation', color: C.info },
      { icon: 'pie-chart', label: 'Analytics', route: '/analytics', color: C.purple },
      { icon: 'refresh', label: 'Sectors', route: '/sector-rotation', color: C.accent },
    ],
  },
  {
    title: 'Social & Tools',
    items: [
      { icon: 'trophy', label: 'Leaderboard', route: '/leaderboard', color: C.warning },
      { icon: 'people-circle', label: 'Copy Trade', route: '/copy-trading', color: C.accent },
      { icon: 'chatbubbles', label: 'Discussion', route: '/discussion', color: C.info },
      { icon: 'book', label: 'Journal', route: '/trade-journal', color: C.purple },
      { icon: 'share-social', label: 'Share', route: '/share-signal', color: C.accent },
      { icon: 'bar-chart', label: 'Charts', route: '/multi-chart', color: C.warning },
    ],
  },
  {
    title: 'Engage',
    items: [
      { icon: 'game-controller', label: 'Badges', route: '/gamification', color: C.warning },
      { icon: 'happy', label: 'Mood', route: '/market-mood', color: C.accent },
      { icon: 'navigate', label: 'Smart Alerts', route: '/price-alerts-map', color: C.info },
      { icon: 'sparkles', label: 'AI Screen', route: '/ai-screener', color: C.purple },
      { icon: 'cash', label: 'Simulator', route: '/trading-simulator', color: C.accent },
      { icon: 'flame', label: 'Streaks', route: '/streak-tracker', color: C.danger },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'receipt', label: 'Tax Report', route: '/tax-report', color: C.info },
      { icon: 'download', label: 'Export', route: '/data-export', color: C.accent },
      { icon: 'link', label: 'Webhooks', route: '/webhooks', color: C.purple },
      { icon: 'wallet', label: 'Brokers', route: '/connected-accounts', color: C.warning },
      { icon: 'gift', label: 'Referral', route: '/referral', color: C.danger },
      { icon: 'help-circle', label: 'Help', route: '/help-center', color: C.info },
      { icon: 'chatbox-ellipses', label: 'Feedback', route: '/feedback', color: C.accent },
      { icon: 'notifications-circle', label: 'Alerts Log', route: '/notification-center', color: C.warning },
      { icon: 'list', label: 'Activity', route: '/activity-log', color: C.purple },
      { icon: 'language', label: 'Language', route: '/language-settings', color: C.info },
    ],
  },
  {
    title: 'Admin',
    items: [
      { icon: 'shield', label: 'Admin', route: '/admin/', color: C.danger },
      { icon: 'settings', label: 'Settings', route: '/settings', color: C.textMuted },
    ],
  },
];

export default function MoreScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => { logout(); router.replace('/(auth)/login'); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#06060B' }} edges={['bottom']}>
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Profile Card */}
      <TouchableOpacity style={s.profileCard} onPress={() => router.push('/settings')} activeOpacity={0.8}>
        <View style={s.profileLeft}>
          <View style={s.profileAvatar}>
            <Text style={s.profileAvatarText}>{user?.fullName?.charAt(0) ?? 'U'}</Text>
          </View>
          <View>
            <Text style={s.profileName}>{user?.fullName ?? 'User'}</Text>
            <Text style={s.profileEmail}>{user?.email ?? ''}</Text>
          </View>
        </View>
        <View style={s.profileBadge}>
          <Text style={s.profileBadgeText}>Elite</Text>
        </View>
      </TouchableOpacity>

      {/* Menu Sections */}
      {SECTIONS.map((section) => (
        <View key={section.title} style={s.section}>
          <Text style={s.sectionTitle}>{section.title}</Text>
          <View style={s.grid}>
            {section.items.map((item) => (
              <TouchableOpacity key={item.label} style={s.gridItem} onPress={() => router.push(item.route as any)} activeOpacity={0.7}>
                <View style={[s.iconWrap, { backgroundColor: item.color + '12' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={s.itemLabel} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={C.danger} />
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={s.version}>SignalForge v1.0.0</Text>
      <View style={{ height: 100 }} />
    </ScrollView>
    </SafeAreaView>
  );
}

const ITEM_WIDTH = (width - 48 - 24) / 4;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16 },

  profileCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface, borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  profileLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.accent + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.accent + '40' },
  profileAvatarText: { fontSize: 18, fontWeight: '900', color: C.accent },
  profileName: { fontSize: 15, fontWeight: '800', color: C.textPrimary },
  profileEmail: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  profileBadge: { backgroundColor: C.purple + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  profileBadgeText: { fontSize: 10, fontWeight: '800', color: C.purple },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: ITEM_WIDTH, alignItems: 'center', paddingVertical: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  itemLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, textAlign: 'center' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.danger + '10', borderRadius: 14, padding: 14, marginTop: 8, borderWidth: 1, borderColor: C.danger + '20' },
  logoutText: { fontSize: 13, fontWeight: '700', color: C.danger },

  version: { fontSize: 10, color: C.textMuted + '60', textAlign: 'center', marginTop: 16 },
});
