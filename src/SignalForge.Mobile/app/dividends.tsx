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

type DividendItem = {
  symbol: string;
  yield: number;
  annualDividend: number;
  exDate: string;
  payDate: string;
  payoutRatio: number;
  consecutiveYears: number;
};

export default function DividendsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'yield' | 'years' | 'symbol'>('yield');

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['dividends'],
    queryFn: async () => {
      const res = await api.get('/calendar/dividends');
      const raw = res.data;
      if (Array.isArray(raw)) return raw as DividendItem[];
      return Object.entries(raw).map(([symbol, val]: [string, any]) => ({
        symbol,
        ...val,
      })) as DividendItem[];
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const sortedData = useMemo(() => {
    const items = Array.isArray(data) ? [...data] : [];
    return items.sort((a: any, b: any) => {
      if (sortBy === 'yield') return (b.yield ?? 0) - (a.yield ?? 0);
      if (sortBy === 'years') return (b.consecutiveYears ?? 0) - (a.consecutiveYears ?? 0);
      return (a.symbol ?? '').localeCompare(b.symbol ?? '');
    });
  }, [data, sortBy]);

  const avgYield = sortedData.length > 0 ? (sortedData.reduce((sum: number, d: any) => sum + (d.yield ?? 0), 0) / sortedData.length).toFixed(1) : '0';
  const topYieldSymbol = sortedData.length > 0 ? sortedData.reduce((best: any, d: any) => (d.yield ?? 0) > (best.yield ?? 0) ? d : best, sortedData[0]).symbol ?? '—' : '—';

  const renderItem = ({ item }: { item: DividendItem }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/stocks/${item.symbol}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.symbol}>{item.symbol}</Text>
        <View style={styles.yieldBadge}>
          <Text style={styles.yieldText}>{item.yield.toFixed(2)}%</Text>
        </View>
      </View>
      <View style={styles.grid}>
        <View style={styles.gridCell}>
          <Text style={styles.gridLabel}>Annual Dividend</Text>
          <Text style={styles.gridValue}>${item.annualDividend.toFixed(2)}</Text>
        </View>
        <View style={styles.gridCell}>
          <Text style={styles.gridLabel}>Payout Ratio</Text>
          <Text style={styles.gridValue}>{item.payoutRatio.toFixed(0)}%</Text>
        </View>
        <View style={styles.gridCell}>
          <Text style={styles.gridLabel}>Ex-Date</Text>
          <Text style={styles.gridValue}>{item.exDate}</Text>
        </View>
        <View style={styles.gridCell}>
          <Text style={styles.gridLabel}>Pay Date</Text>
          <Text style={styles.gridValue}>{item.payDate}</Text>
        </View>
      </View>
      <View style={styles.streakRow}>
        <Ionicons name="trophy-outline" size={14} color={C.warning} />
        <Text style={styles.streakText}>
          {item.consecutiveYears} consecutive year{item.consecutiveYears !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
        data={sortedData}
        keyExtractor={(item, i) => `${item.symbol}-${i}`}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            {sortedData.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 }}>
                <View style={{ flex: 1, backgroundColor: '#0C0F1A', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1A1F35' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#F0F4F8' }}>{sortedData.length}</Text>
                  <Text style={{ fontSize: 9, color: '#5B6378', textTransform: 'uppercase' }}>Stocks</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#0C0F1A', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1A1F35' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#00FF94' }}>{avgYield}%</Text>
                  <Text style={{ fontSize: 9, color: '#5B6378', textTransform: 'uppercase' }}>Avg Yield</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#0C0F1A', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1A1F35' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFB020' }}>{topYieldSymbol}</Text>
                  <Text style={{ fontSize: 9, color: '#5B6378', textTransform: 'uppercase' }}>Top Yield</Text>
                </View>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
              {(['yield', 'years', 'symbol'] as const).map(s => (
                <TouchableOpacity key={s} onPress={() => setSortBy(s)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: sortBy === s ? '#00FF9420' : '#0C0F1A', borderWidth: 1, borderColor: sortBy === s ? '#00FF94' : '#1A1F35' }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: sortBy === s ? '#00FF94' : '#5B6378' }}>
                    {s === 'yield' ? 'By Yield' : s === 'years' ? 'By Streak' : 'By Symbol'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="wallet-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyText}>No dividend data</Text>
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
  symbol: { fontSize: 18, fontWeight: '700', color: C.accent },
  yieldBadge: {
    backgroundColor: C.accent + '22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  yieldText: { fontSize: 13, fontWeight: '700', color: C.accent },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
    marginBottom: 12,
  },
  gridCell: {
    width: '48%',
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  gridLabel: { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  gridValue: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakText: { fontSize: 12, color: C.warning, fontWeight: '500' },
  emptyText: { fontSize: 14, color: C.textMuted, marginTop: 12 },
});
