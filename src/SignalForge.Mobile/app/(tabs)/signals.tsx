import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { signalsApi } from '../../src/api/stocks';
import { getSignalLabel } from '../../src/utils/signalType';

const COLORS = {
  bg: '#06060B',
  surface: '#0C0F1A',
  accent: '#00FF94',
  danger: '#FF3B5C',
  textPrimary: '#F0F4F8',
  textMuted: '#5B6378',
  border: '#1A1F35',
  warning: '#FFB020',
};

type FilterType = 'Buy' | 'Sell' | 'Hold' | undefined;

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: undefined },
  { label: 'Buy', value: 'Buy' },
  { label: 'Sell', value: 'Sell' },
  { label: 'Hold', value: 'Hold' },
];

export default function SignalsScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const { data: signals = [], refetch, isFetching } = useQuery({
    queryKey: ['signals', activeFilter],
    queryFn: () => signalsApi.getSignals(activeFilter, 50),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getBadgeColor = (type: string) => {
    const label = getSignalLabel(type);
    if (label === 'Buy') return COLORS.accent;
    if (label === 'Sell') return COLORS.danger;
    return COLORS.warning;
  };

  const renderSignalCard = ({ item: signal }: { item: typeof signals[0] }) => {
    const badgeColor = getBadgeColor(signal.type);
    const confidencePct = Math.round(signal.confidenceScore * 100);
    const scores = [
      { label: 'Technical', value: signal.technicalScore },
      { label: 'Sentiment', value: signal.sentimentScore },
      { label: 'Options', value: signal.optionsScore },
    ];

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.symbol}>{signal.symbol}</Text>
          <View style={[styles.badge, { backgroundColor: badgeColor + '33' }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{getSignalLabel(signal.type)}</Text>
          </View>
        </View>
        <View style={styles.confidenceRow}>
          <Text style={styles.confidenceLabel}>{confidencePct}% confidence</Text>
          <View style={styles.confidenceBar}>
            <View style={[styles.confidenceFill, { width: `${confidencePct}%`, backgroundColor: badgeColor }]} />
          </View>
        </View>
        <View style={styles.scoreRow}>
          {scores.map((s) => (
            <View key={s.label} style={styles.scoreBarWrap}>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreFill, { width: `${Math.min(100, s.value * 100)}%`, backgroundColor: COLORS.accent }]} />
              </View>
              <Text style={styles.scoreLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.reasoning} numberOfLines={2}>{signal.reasoning || '—'}</Text>
        <TouchableOpacity style={styles.viewStockBtn} onPress={() => router.push(`/stocks/${signal.symbol}`)}>
          <Text style={styles.viewStockText}>View Stock</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
        style={styles.filterContainer}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.filterChip, activeFilter === f.value && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.value)}
          >
            <Text style={[styles.filterText, activeFilter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={signals}
        keyExtractor={(item) => item.id}
        renderItem={renderSignalCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing || isFetching} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No signals found</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  filterContainer: { maxHeight: 44 },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  filterChipActive: { backgroundColor: COLORS.accent + '22', borderColor: COLORS.accent },
  filterText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  filterTextActive: { color: COLORS.accent, fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 32 },
  card: { padding: 16, backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  symbol: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  confidenceRow: { marginBottom: 12 },
  confidenceLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 6 },
  confidenceBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  confidenceFill: { height: '100%', borderRadius: 3 },
  scoreRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  scoreBarWrap: { flex: 1 },
  scoreBar: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  scoreFill: { height: '100%', borderRadius: 2 },
  scoreLabel: { fontSize: 10, color: COLORS.textMuted },
  reasoning: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 12 },
  viewStockBtn: { paddingVertical: 10, alignItems: 'center', backgroundColor: COLORS.accent + '22', borderRadius: 10, borderWidth: 1, borderColor: COLORS.accent },
  viewStockText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 32 },
});
