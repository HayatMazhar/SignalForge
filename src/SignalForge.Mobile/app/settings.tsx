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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/authStore';

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile */}
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={C.accent} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.fullName ?? 'User'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email ?? '—'}</Text>
          </View>
        </View>
      </View>

      {/* Subscription */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="diamond-outline" size={18} color={C.purple} />
          <Text style={styles.sectionLabel}>Subscription</Text>
        </View>
        <View style={styles.tierRow}>
          <View style={[styles.tierBadge, { backgroundColor: C.purple + '18' }]}>
            <Text style={[styles.tierText, { color: C.purple }]}>Pro</Text>
          </View>
          <Text style={styles.tierDesc}>
            Unlimited signals, AI chat, and backtesting
          </Text>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications-outline" size={18} color={C.info} />
          <Text style={styles.sectionLabel}>Notifications</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Signal Alerts</Text>
            <Text style={styles.toggleDesc}>New AI signals for watchlist</Text>
          </View>
          <Switch
            value={pushSignals}
            onValueChange={setPushSignals}
            trackColor={{ false: C.border, true: C.accent + '55' }}
            thumbColor={pushSignals ? C.accent : C.textMuted}
          />
        </View>

        <View style={styles.separator} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Price Alerts</Text>
            <Text style={styles.toggleDesc}>Price target notifications</Text>
          </View>
          <Switch
            value={pushAlerts}
            onValueChange={setPushAlerts}
            trackColor={{ false: C.border, true: C.accent + '55' }}
            thumbColor={pushAlerts ? C.accent : C.textMuted}
          />
        </View>

        <View style={styles.separator} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Market News</Text>
            <Text style={styles.toggleDesc}>Breaking news and sentiment</Text>
          </View>
          <Switch
            value={pushNews}
            onValueChange={setPushNews}
            trackColor={{ false: C.border, true: C.accent + '55' }}
            thumbColor={pushNews ? C.accent : C.textMuted}
          />
        </View>

        <View style={styles.separator} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Portfolio Updates</Text>
            <Text style={styles.toggleDesc}>Daily portfolio summary</Text>
          </View>
          <Switch
            value={pushPortfolio}
            onValueChange={setPushPortfolio}
            trackColor={{ false: C.border, true: C.accent + '55' }}
            thumbColor={pushPortfolio ? C.accent : C.textMuted}
          />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color={C.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={styles.version}>SignalForge v{APP_VERSION}</Text>
    </ScrollView>
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
