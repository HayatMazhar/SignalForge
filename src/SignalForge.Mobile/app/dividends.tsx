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
        data={data}
        keyExtractor={(item, i) => `${item.symbol}-${i}`}
        renderItem={renderItem}
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
