import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'sf-notifications';

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

interface Notification {
  id: string;
  type: 'signal' | 'alert' | 'news';
  title: string;
  message: string;
  timestamp: string;
  unread: boolean;
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'signal', title: 'New Buy Signal', message: 'AAPL hit a strong buy signal with 92% confidence.', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), unread: true },
  { id: '2', type: 'alert', title: 'Price Alert', message: 'TSLA crossed above $250 target.', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), unread: true },
  { id: '3', type: 'news', title: 'Market Update', message: 'Fed signals potential rate cut in Q2.', timestamp: new Date(Date.now() - 60 * 60000).toISOString(), unread: false },
  { id: '4', type: 'signal', title: 'Sell Signal', message: 'NVDA triggered a sell signal based on RSI.', timestamp: new Date(Date.now() - 120 * 60000).toISOString(), unread: true },
  { id: '5', type: 'news', title: 'Earnings Report', message: 'MSFT reported strong cloud revenue growth.', timestamp: new Date(Date.now() - 180 * 60000).toISOString(), unread: false },
];

type FilterType = 'all' | 'signal' | 'alert' | 'news';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

function getIconForType(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'signal': return 'trending-up-outline';
    case 'alert': return 'notifications-outline';
    case 'news': return 'newspaper-outline';
    default: return 'notifications-outline';
  }
}

function getColorForType(type: string): string {
  switch (type) {
    case 'signal': return COLORS.accent;
    case 'alert': return COLORS.warning;
    case 'news': return COLORS.info;
    default: return COLORS.textMuted;
  }
}

export default function NotificationCenterScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');

  const loadNotifications = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Notification[];
        setNotifications(parsed);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_NOTIFICATIONS));
        setNotifications(SAMPLE_NOTIFICATIONS);
      }
    } catch {
      setNotifications(SAMPLE_NOTIFICATIONS);
    }
  }, []);

  const saveNotifications = useCallback(async (data: Notification[]) => {
    setNotifications(data);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filtered = (notifications ?? []).filter((n) =>
    filter === 'all' ? true : n.type === filter,
  );

  const markAllRead = () => {
    const updated = (notifications ?? []).map((n) => ({ ...n, unread: false }));
    saveNotifications(updated);
  };

  const clearAll = () => {
    Alert.alert('Clear All', 'Remove all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => saveNotifications([]) },
    ]);
  };

  const markAsRead = (id: string) => {
    const updated = (notifications ?? []).map((n) =>
      n.id === id ? { ...n, unread: false } : n,
    );
    saveNotifications(updated);
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'signal', label: 'Signals' },
    { key: 'alert', label: 'Alerts' },
    { key: 'news', label: 'News' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={markAllRead} style={styles.actionBtn}>
            <Ionicons name="checkmark-done-outline" size={18} color={COLORS.accent} />
            <Text style={styles.actionText}>Mark all read</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAll} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text style={[styles.actionText, { color: COLORS.danger }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, item.unread && styles.cardUnread]}
            onPress={() => markAsRead(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.iconWrap, { backgroundColor: getColorForType(item.type) + '22' }]}>
                <Ionicons name={getIconForType(item.type)} size={22} color={getColorForType(item.type)} />
              </View>
              {item.unread && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
              <Text style={styles.cardTime}>{formatTime(item.timestamp)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: COLORS.border },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 8, padding: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.accent + '22', borderColor: COLORS.accent },
  filterText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  filterTextActive: { color: COLORS.accent },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  cardUnread: { borderColor: COLORS.accent + '44', backgroundColor: COLORS.accent + '08' },
  cardLeft: { marginRight: 12, alignItems: 'center' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent, marginTop: 4 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  cardMessage: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  cardTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 6 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 12 },
});
