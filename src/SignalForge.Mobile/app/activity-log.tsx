import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

const ACTIVITIES: ActivityEntry[] = [
  { id: '1', type: 'login', action: 'Logged in', timestamp: '2025-03-03T14:32:00Z' },
  { id: '2', type: 'signal', action: 'Generated signal for AAPL', timestamp: '2025-03-03T14:15:00Z' },
  { id: '3', type: 'watchlist', action: 'Added NVDA to watchlist', timestamp: '2025-03-03T13:50:00Z' },
  { id: '4', type: 'alert', action: 'Created price alert for TSLA above $250', timestamp: '2025-03-03T13:20:00Z' },
  { id: '5', type: 'settings', action: 'Updated notification preferences', timestamp: '2025-03-03T12:00:00Z' },
  { id: '6', type: 'login', action: 'Logged in', timestamp: '2025-03-02T09:10:00Z' },
  { id: '7', type: 'signal', action: 'Generated signal for MSFT', timestamp: '2025-03-02T09:05:00Z' },
  { id: '8', type: 'watchlist', action: 'Removed META from watchlist', timestamp: '2025-03-02T08:45:00Z' },
  { id: '9', type: 'alert', action: 'Deleted alert for GOOGL', timestamp: '2025-03-01T16:30:00Z' },
  { id: '10', type: 'settings', action: 'Enabled push notifications', timestamp: '2025-03-01T10:00:00Z' },
];

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

  const filtered = ACTIVITIES.filter((a) =>
    filter === 'all' ? true : a.type === filter,
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
