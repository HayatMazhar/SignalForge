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

type EarningsItem = {
  symbol: string;
  company: string;
  date: string;
  time: string;
  epsEstimate: number | null;
  epsActual?: number | null;
  surprise?: number | null;
};

export default function EarningsScreen() {
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['earnings'],
    queryFn: async () => {
      const res = await api.get('/calendar/earnings');
      return res.data as EarningsItem[];
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const now = new Date();
  const filtered = data.filter((e) => {
    const d = new Date(e.date);
    return filter === 'upcoming' ? d >= now : d < now;
  });

  const isPast = (item: EarningsItem) => new Date(item.date) < now;

  const renderItem = ({ item }: { item: EarningsItem }) => {
    const past = isPast(item);
    const beat = past && item.epsActual != null && item.epsEstimate != null
      ? item.epsActual >= item.epsEstimate
      : null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/stocks/${item.symbol}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          {past && beat !== null && (
            <View style={[styles.badge, { backgroundColor: (beat ? C.accent : C.danger) + '22' }]}>
              <Text style={[styles.badgeText, { color: beat ? C.accent : C.danger }]}>
                {beat ? 'Beat' : 'Missed'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.company} numberOfLines={1}>{item.company}</Text>
        <View style={styles.row}>
          <View style={styles.detail}>
            <Ionicons name="calendar-outline" size={13} color={C.textMuted} />
            <Text style={styles.detailText}>{item.date}</Text>
          </View>
          <View style={styles.detail}>
            <Ionicons name="time-outline" size={13} color={C.textMuted} />
            <Text style={styles.detailText}>{item.time}</Text>
          </View>
        </View>
        <View style={styles.epsRow}>
          <Text style={styles.label}>EPS Est.</Text>
          <Text style={styles.value}>
            {item.epsEstimate != null ? `$${item.epsEstimate.toFixed(2)}` : '—'}
          </Text>
          {past && item.epsActual != null && (
            <>
              <Text style={styles.label}>Actual</Text>
              <Text style={[styles.value, { color: beat ? C.accent : C.danger }]}>
                ${item.epsActual.toFixed(2)}
              </Text>
            </>
          )}
          {past && item.surprise != null && (
            <>
              <Text style={styles.label}>Surprise</Text>
              <Text style={[styles.value, { color: item.surprise >= 0 ? C.accent : C.danger }]}>
                {item.surprise >= 0 ? '+' : ''}{item.surprise.toFixed(1)}%
              </Text>
            </>
          )}
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
      <View style={styles.filterRow}>
        {(['upcoming', 'past'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'upcoming' ? 'Upcoming' : 'Past'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        data={filtered}
        keyExtractor={(item, i) => `${item.symbol}-${item.date}-${i}`}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="bar-chart-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyText}>No earnings data</Text>
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
  filterRow: { flexDirection: 'row', padding: 16, paddingBottom: 0, gap: 10 },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  filterActive: { borderColor: C.accent, backgroundColor: C.accent + '15' },
  filterText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  filterTextActive: { color: C.accent },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  symbol: { fontSize: 18, fontWeight: '700', color: C.accent },
  company: { fontSize: 13, color: C.textMuted, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: C.textMuted },
  epsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  label: { fontSize: 11, color: C.textMuted },
  value: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  emptyText: { fontSize: 14, color: C.textMuted, marginTop: 12 },
});
