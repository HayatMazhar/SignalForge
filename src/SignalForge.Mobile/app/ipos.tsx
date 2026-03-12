import React, { useCallback, useMemo, useState } from 'react';
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

type IPOItem = {
  id: string;
  company: string;
  symbol: string;
  date: string;
  exchange: string;
  priceRange: string;
  valuation: string;
  status: 'Upcoming' | 'Filed' | 'Expected';
};

const STATUS_COLORS: Record<string, string> = {
  Upcoming: C.accent,
  Filed: C.info,
  Expected: C.warning,
};

function formatValuation(v: string | number): string {
  if (typeof v === 'string') return v;
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
}

export default function IPOsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['ipos'],
    queryFn: async () => {
      const res = await api.get('/calendar/ipos');
      return res.data as IPOItem[];
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredIpos = useMemo(() => {
    const items = Array.isArray(data) ? data : [];
    if (statusFilter === 'All') return items;
    return items.filter((ipo: any) => (ipo.status ?? '').toLowerCase() === statusFilter.toLowerCase());
  }, [data, statusFilter]);

  const renderItem = ({ item }: { item: IPOItem }) => {
    const statusColor = STATUS_COLORS[item.status] ?? C.textMuted;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.company} numberOfLines={1}>{item.company}</Text>
            <Text style={styles.symbol}>{item.symbol}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoCell}>
            <Ionicons name="calendar-outline" size={13} color={C.textMuted} />
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{item.date}</Text>
          </View>
          <View style={styles.infoCell}>
            <Ionicons name="business-outline" size={13} color={C.textMuted} />
            <Text style={styles.infoLabel}>Exchange</Text>
            <Text style={styles.infoValue}>{item.exchange}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoCell}>
            <Ionicons name="pricetag-outline" size={13} color={C.textMuted} />
            <Text style={styles.infoLabel}>Price Range</Text>
            <Text style={styles.infoValue}>{item.priceRange}</Text>
          </View>
          <View style={styles.infoCell}>
            <Ionicons name="trending-up-outline" size={13} color={C.textMuted} />
            <Text style={styles.infoLabel}>Valuation</Text>
            <Text style={styles.infoValue}>{formatValuation(item.valuation)}</Text>
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
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        data={filteredIpos}
        keyExtractor={(item, i) => item.id ?? `${item.symbol}-${i}`}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
              {['All', 'Upcoming', 'Filed', 'Expected'].map(f => (
                <TouchableOpacity key={f} onPress={() => setStatusFilter(f)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: statusFilter === f ? '#00FF9420' : '#0C0F1A', borderWidth: 1, borderColor: statusFilter === f ? '#00FF94' : '#1A1F35' }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: statusFilter === f ? '#00FF94' : '#5B6378' }}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ fontSize: 12, color: '#5B6378', paddingHorizontal: 16, marginBottom: 8 }}>
              {filteredIpos.length} IPO{filteredIpos.length !== 1 ? 's' : ''} {statusFilter !== 'All' ? `(${statusFilter})` : ''}
            </Text>
          </>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="rocket-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyText}>No upcoming IPOs</Text>
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
    marginBottom: 12,
  },
  company: { fontSize: 16, fontWeight: '600', color: C.textPrimary, marginBottom: 2 },
  symbol: { fontSize: 14, fontWeight: '700', color: C.accent },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  infoCell: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  infoLabel: { fontSize: 11, color: C.textMuted },
  infoValue: { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  emptyText: { fontSize: 14, color: C.textMuted, marginTop: 12 },
});
