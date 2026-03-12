import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { signalsApi, watchlistApi, alertsApi } from '../src/api/stocks';

const COLORS = {
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

type ActivityType = 'login' | 'signal' | 'watchlist' | 'alert' | 'settings' | 'all';

interface ActivityEntry {
  id: string;
  type: ActivityType;
  action: string;
  timestamp: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getIconForType(type: ActivityType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'login': return 'log-in-outline';
    case 'signal': return 'trending-up-outline';
    case 'watchlist': return 'eye-outline';
    case 'alert': return 'notifications-outline';
    case 'settings': return 'settings-outline';
    default: return 'ellipse-outline';
  }
}

function getColorForType(type: ActivityType): string {
  switch (type) {
    case 'login': return COLORS.info;
    case 'signal': return COLORS.accent;
    case 'watchlist': return COLORS.purple;
    case 'alert': return COLORS.warning;
    case 'settings': return COLORS.textMuted;
    default: return COLORS.textMuted;
  }
}

const FILTERS: { key: ActivityType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'login', label: 'Login' },
  { key: 'signal', label: 'Signals' },
  { key: 'watchlist', label: 'Watchlist' },
  { key: 'alert', label: 'Alerts' },
  { key: 'settings', label: 'Settings' },
];

export default function ActivityLogScreen() {
  const [filter, setFilter] = useState<ActivityType>('all');

  const { data: signals = [], isLoading: sigLoading } = useQuery({ queryKey: ['act-signals'], queryFn: () => signalsApi.getSignals(undefined, 20) });
  const { data: watchlist = [], isLoading: wlLoading } = useQuery({ queryKey: ['act-wl'], queryFn: () => watchlistApi.get() });
  const { data: alerts = [], isLoading: alLoading } = useQuery({ queryKey: ['act-alerts'], queryFn: () => alertsApi.get() });

  const activities: ActivityEntry[] = useMemo(() => {
    const items: ActivityEntry[] = [];
    (signals as any[]).forEach((s: any, i: number) => {
      items.push({ id: `sig-${i}`, type: 'signal', action: `Generated ${s.type ?? 'Hold'} signal for ${s.symbol} (${Math.round(s.confidenceScore ?? 0)}%)`, timestamp: s.generatedAt ?? new Date().toISOString() });
    });
    const wlArr = Array.isArray(watchlist) ? watchlist : [];
    wlArr.forEach((w: any, i: number) => {
      const sym = typeof w === 'string' ? w : w?.symbol ?? '';
      items.push({ id: `wl-${i}`, type: 'watchlist', action: `${sym} on watchlist`, timestamp: w?.createdAt ?? new Date().toISOString() });
    });
    (alerts as any[]).forEach((a: any, i: number) => {
      items.push({ id: `al-${i}`, type: 'alert', action: `Alert: ${a.symbol ?? ''} ${a.alertType === 0 ? 'above' : a.alertType === 1 ? 'below' : 'change'} ${a.targetValue ?? ''}`, timestamp: a.createdAt ?? new Date().toISOString() });
    });
    items.push({ id: 'login-now', type: 'login', action: 'Current session', timestamp: new Date().toISOString() });
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [signals, watchlist, alerts]);

  const isLoading = sigLoading || wlLoading || alLoading;
  const filtered = activities.filter((a) =>
    filter === 'all' ? true : a.type === filter,
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFB02018', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FFB02040' }}>
          <Ionicons name="information-circle" size={16} color="#FFB020" />
          <Text style={{ fontSize: 12, color: '#FFB020', fontWeight: '600', flex: 1 }}>Demo Data — Illustrative only, not real market data</Text>
        </View>
        {isLoading && <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 32 }} />}
        {!isLoading && filtered.length === 0 && <Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: 32, fontSize: 14 }}>No activity yet</Text>}
        {filtered.map((entry, index) => (
          <View key={entry.id} style={styles.row}>
            <View style={styles.timeline}>
              <View style={[styles.dot, { backgroundColor: getColorForType(entry.type) }]} />
              {index < filtered.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.content}>
              <Text style={styles.action}>{entry.action}</Text>
              <Text style={styles.timestamp}>{formatTime(entry.timestamp)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.accent + '22',
    borderColor: COLORS.accent,
  },
  filterText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  filterTextActive: { color: COLORS.accent },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  row: { flexDirection: 'row', marginBottom: 4 },
  timeline: { alignItems: 'center', marginRight: 14, width: 24 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  line: { flex: 1, width: 2, backgroundColor: COLORS.border, minHeight: 40, marginTop: 4 },
  content: { flex: 1, paddingBottom: 20 },
  action: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  timestamp: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
});
