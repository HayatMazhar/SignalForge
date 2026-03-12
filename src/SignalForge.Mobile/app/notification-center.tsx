import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { signalsApi, alertsApi } from '../src/api/stocks';

const READ_IDS_KEY = 'sf-notifications-read';

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
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: signals, isLoading: signalsLoading } = useQuery({
    queryKey: ['signals-notifications'],
    queryFn: () => signalsApi.getSignals(undefined, 20),
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts-notifications'],
    queryFn: () => alertsApi.get(),
  });

  const isLoading = signalsLoading || alertsLoading;

  useEffect(() => {
    AsyncStorage.getItem(READ_IDS_KEY).then((raw) => {
      if (raw) setReadIds(new Set(JSON.parse(raw)));
    }).catch(() => {});
  }, []);

  const persistReadIds = useCallback(async (ids: Set<string>) => {
    setReadIds(ids);
    await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids]));
  }, []);

  const notifications = useMemo<Notification[]>(() => {
    const items: Notification[] = [];
    if (signals) {
      for (const s of signals) {
        items.push({
          id: `signal-${s.id}`,
          type: 'signal',
          title: `New ${s.type} Signal`,
          message: `New ${s.type} signal for ${s.symbol} with ${Math.round(s.confidenceScore * 100)}% confidence`,
          timestamp: s.generatedAt,
          unread: !readIds.has(`signal-${s.id}`),
        });
      }
    }
    if (alerts) {
      for (const a of alerts as any[]) {
        items.push({
          id: `alert-${a.id}`,
          type: 'alert',
          title: 'Price Alert',
          message: `Alert active: ${a.symbol} ${a.alertType === 0 ? 'above' : 'below'} $${a.targetValue}`,
          timestamp: a.createdAt ?? new Date().toISOString(),
          unread: !readIds.has(`alert-${a.id}`),
        });
      }
    }
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items;
  }, [signals, alerts, readIds]);

  const filtered = notifications.filter((n) =>
    filter === 'all' ? true : n.type === filter,
  );

  const markAllRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    persistReadIds(allIds);
  };

  const clearAll = () => {
    Alert.alert('Clear All', 'Mark all notifications as read?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => markAllRead() },
    ]);
  };

  const markAsRead = (id: string) => {
    const next = new Set(readIds);
    next.add(id);
    persistReadIds(next);
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'signal', label: 'Signals' },
    { key: 'alert', label: 'Alerts' },
    { key: 'news', label: 'News' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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

      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.emptyText}>Loading notifications…</Text>
        </View>
      ) : (
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
      )}
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
