import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/api/client';

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

type InsiderTrade = {
  id: string;
  date: string;
  symbol: string;
  insiderName: string;
  title: string;
  type: 'Buy' | 'Sell';
  shares: number;
  value: number;
};

const FILTERS = ['All', 'Purchases', 'Sales'] as const;
type Filter = (typeof FILTERS)[number];

function formatValue(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

export default function InsiderTradesScreen() {
  const [filter, setFilter] = useState<Filter>('All');
  const [refreshing, setRefreshing] = useState(false);

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['insiderTrades'],
    queryFn: async () => {
      const res = await api.get('/calendar/insider-trades');
      return res.data as InsiderTrade[];
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filtered = data.filter((t) => {
    if (filter === 'Purchases') return t.type === 'Buy';
    if (filter === 'Sales') return t.type === 'Sell';
    return true;
  });

  const renderItem = ({ item }: { item: InsiderTrade }) => {
    const isBuy = item.type === 'Buy';
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/stocks/${item.symbol}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          <View style={[styles.badge, { backgroundColor: (isBuy ? C.accent : C.danger) + '22' }]}>
            <Text style={[styles.badgeText, { color: isBuy ? C.accent : C.danger }]}>
              {item.type}
            </Text>
          </View>
        </View>
        <Text style={styles.insiderName} numberOfLines={1}>{item.insiderName}</Text>
        <Text style={styles.insiderTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.row}>
          <View style={styles.detail}>
            <Ionicons name="calendar-outline" size={13} color={C.textMuted} />
            <Text style={styles.detailText}>{item.date}</Text>
          </View>
          <View style={styles.detail}>
            <Ionicons name="layers-outline" size={13} color={C.textMuted} />
            <Text style={styles.detailText}>{item.shares.toLocaleString()} shares</Text>
          </View>
          <View style={styles.detail}>
            <Ionicons name="cash-outline" size={13} color={C.textMuted} />
            <Text style={[styles.detailText, { color: isBuy ? C.accent : C.danger, fontWeight: '600' }]}>
              {formatValue(item.value)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        data={filtered}
        keyExtractor={(item, i) => item.id ?? `${item.symbol}-${i}`}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="people-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyText}>No insider trades</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  chipRow: { flexDirection: 'row', padding: 16, paddingBottom: 0, gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: { borderColor: C.accent, backgroundColor: C.accent + '15' },
  chipText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  chipTextActive: { color: C.accent },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  symbol: { fontSize: 18, fontWeight: '700', color: C.accent },
  insiderName: { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 2 },
  insiderTitle: { fontSize: 12, color: C.textMuted, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: C.textMuted },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  emptyText: { fontSize: 14, color: C.textMuted, marginTop: 12 },
});
