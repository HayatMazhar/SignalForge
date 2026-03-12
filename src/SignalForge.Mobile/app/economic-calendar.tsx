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

type EconomicEvent = {
  id: string;
  date: string;
  time: string;
  event: string;
  impact: 'High' | 'Medium' | 'Low';
  forecast: string | null;
  previous: string | null;
  actual: string | null;
};

const IMPACT_COLORS: Record<string, string> = {
  High: C.danger,
  Medium: C.warning,
  Low: C.accent,
};

const FILTERS = ['All', 'High', 'Medium'] as const;
type Filter = (typeof FILTERS)[number];

export default function EconomicCalendarScreen() {
  const [filter, setFilter] = useState<Filter>('All');
  const [refreshing, setRefreshing] = useState(false);

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['economicCalendar'],
    queryFn: async () => {
      const res = await api.get('/calendar/economic');
      return res.data as EconomicEvent[];
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filtered = filter === 'All' ? data : data.filter((e) => e.impact === filter);

  const renderItem = ({ item }: { item: EconomicEvent }) => {
    const dotColor = IMPACT_COLORS[item.impact] ?? C.textMuted;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={13} color={C.textMuted} />
            <Text style={styles.dateText}>{item.date}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          <View style={styles.impactRow}>
            <View style={[styles.impactDot, { backgroundColor: dotColor }]} />
            <Text style={[styles.impactLabel, { color: dotColor }]}>{item.impact}</Text>
          </View>
        </View>
        <Text style={styles.eventName} numberOfLines={2}>{item.event}</Text>
        <View style={styles.dataRow}>
          <View style={styles.dataCell}>
            <Text style={styles.dataLabel}>Forecast</Text>
            <Text style={styles.dataValue}>{item.forecast ?? '—'}</Text>
          </View>
          <View style={styles.dataCell}>
            <Text style={styles.dataLabel}>Previous</Text>
            <Text style={styles.dataValue}>{item.previous ?? '—'}</Text>
          </View>
          <View style={styles.dataCell}>
            <Text style={styles.dataLabel}>Actual</Text>
            <Text style={[styles.dataValue, item.actual ? { color: C.accent } : null]}>
              {item.actual ?? '—'}
            </Text>
          </View>
        </View>
      </View>
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
        keyExtractor={(item, i) => item.id ?? `${item.event}-${i}`}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="globe-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyText}>No economic events</Text>
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
    marginBottom: 8,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, color: C.textMuted },
  timeText: { fontSize: 12, color: C.textMuted, marginLeft: 4 },
  impactRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  impactDot: { width: 8, height: 8, borderRadius: 4 },
  impactLabel: { fontSize: 11, fontWeight: '700' },
  eventName: { fontSize: 15, fontWeight: '600', color: C.textPrimary, marginBottom: 12 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dataCell: { alignItems: 'center', flex: 1 },
  dataLabel: { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  dataValue: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  emptyText: { fontSize: 14, color: C.textMuted, marginTop: 12 },
});
