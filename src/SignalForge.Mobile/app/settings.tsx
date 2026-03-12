import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeStore, THEME_LIST, type ThemeMode } from '../src/stores/themeStore';

const C = {
  bg: '#06060B',
  surface: '#0C0F1A',
  accent: '#00FF94',
  danger: '#FF3B5C',
  textPrimary: '#F0F4F8',
  textMuted: '#5B6378',
  border: '#1A1F35',
  warning: '#FFB020',
  info: '#38BDF8',
  purple: '#A78BFA',
};

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { mode: themeMode, setMode: setThemeMode, colors } = useThemeStore();

  const [pushSignals, setPushSignals] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [pushNews, setPushNews] = useState(false);
  const [pushPortfolio, setPushPortfolio] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* Profile */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.accent + '14' }]}>
            <Ionicons name="person" size={28} color={colors.accent} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              {user?.fullName ?? 'User'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{user?.email ?? '—'}</Text>
          </View>
        </View>
      </View>

      {/* Appearance */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette-outline" size={18} color={colors.accent} />
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Appearance</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {THEME_LIST.map((t) => {
            const active = themeMode === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setThemeMode(t.id)}
                activeOpacity={0.7}
                style={{
                  width: '30.5%',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 6,
                  borderRadius: 14,
                  backgroundColor: active ? colors.accent + '14' : colors.bg,
                  borderWidth: 1.5,
                  borderColor: active ? colors.accent : colors.border,
                }}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 12, marginBottom: 8,
                  backgroundColor: t.preview[0], borderWidth: 1, borderColor: t.preview[2] + '40',
                  alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 14, backgroundColor: t.preview[1] }} />
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: t.preview[2], zIndex: 1 }} />
                </View>
                <Ionicons
                  name={t.icon as any}
                  size={16}
                  color={active ? colors.accent : colors.textMuted}
                />
                <Text style={{
                  fontSize: 10, fontWeight: '700', marginTop: 4, letterSpacing: 0.3,
                  color: active ? colors.accent : colors.textMuted,
                }}>
                  {t.label}
                </Text>
                {active && (
                  <View style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 16, height: 16, borderRadius: 8,
                    backgroundColor: colors.accent,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="checkmark" size={10} color={colors.bg} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Subscription */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="diamond-outline" size={18} color={colors.purple} />
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Subscription</Text>
        </View>
        <View style={styles.tierRow}>
          <View style={[styles.tierBadge, { backgroundColor: colors.purple + '18' }]}>
            <Text style={[styles.tierText, { color: colors.purple }]}>Pro</Text>
          </View>
          <Text style={[styles.tierDesc, { color: colors.textMuted }]}>
            Unlimited signals, AI chat, and backtesting
          </Text>
        </View>
      </View>

      {/* Notifications */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications-outline" size={18} color={colors.info} />
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Notifications</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Signal Alerts</Text>
            <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>New AI signals for watchlist</Text>
          </View>
          <Switch
            value={pushSignals}
            onValueChange={setPushSignals}
            trackColor={{ false: colors.border, true: colors.accent + '55' }}
            thumbColor={pushSignals ? colors.accent : colors.textMuted}
          />
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Price Alerts</Text>
            <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>Price target notifications</Text>
          </View>
          <Switch
            value={pushAlerts}
            onValueChange={setPushAlerts}
            trackColor={{ false: colors.border, true: colors.accent + '55' }}
            thumbColor={pushAlerts ? colors.accent : colors.textMuted}
          />
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Market News</Text>
            <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>Breaking news and sentiment</Text>
          </View>
          <Switch
            value={pushNews}
            onValueChange={setPushNews}
            trackColor={{ false: colors.border, true: colors.accent + '55' }}
            thumbColor={pushNews ? colors.accent : colors.textMuted}
          />
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Portfolio Updates</Text>
            <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>Daily portfolio summary</Text>
          </View>
          <Switch
            value={pushPortfolio}
            onValueChange={setPushPortfolio}
            trackColor={{ false: colors.border, true: colors.accent + '55' }}
            thumbColor={pushPortfolio ? colors.accent : colors.textMuted}
          />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.danger + '14', borderColor: colors.danger + '33' }]} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={[styles.version, { color: colors.textMuted }]}>SignalForge v{APP_VERSION}</Text>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 16,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.accent + '14',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  profileEmail: { fontSize: 14, color: C.textMuted, marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  tierText: { fontSize: 14, fontWeight: '700' },
  tierDesc: { fontSize: 13, color: C.textMuted, flex: 1 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  toggleDesc: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  separator: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.danger + '14',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.danger + '33',
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: C.danger },
  version: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});
