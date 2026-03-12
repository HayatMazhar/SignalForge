import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { portfolioApi } from '../../src/api/stocks';
import { formatPrice } from '../../src/utils/format';

const COLORS = {
  bg: '#06060B',
  surface: '#0C0F1A',
  accent: '#00FF94',
  danger: '#FF3B5C',
  textPrimary: '#F0F4F8',
  textMuted: '#5B6378',
  border: '#1A1F35',
};

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  totalValue?: number;
  currentPrice?: number;
}

interface Portfolio {
  totalValue?: number;
  positions?: Position[];
}

export default function PortfolioScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: portfolio = {} as Portfolio, refetch, isFetching } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => portfolioApi.get(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const positions = portfolio?.positions ?? [];
  const totalValue = portfolio?.totalValue ?? positions.reduce((sum: number, p: any) => sum + (p.totalValue ?? p.averageCost * p.quantity), 0);

  const onFabPress = () => {
    Alert.alert('Add Position', 'Navigate to add form (to be implemented)', [
      { text: 'OK' },
      { text: 'Navigate', onPress: () => router.push('/(tabs)/portfolio' as any) },
    ]);
  };

  const renderPosition = ({ item }: { item: Position }) => {
    const value = item.totalValue ?? item.averageCost * item.quantity;
    return (
      <TouchableOpacity
        style={styles.positionCard}
        onPress={() => router.push(`/stocks/${item.symbol}`)}
        activeOpacity={0.7}
      >
        <View style={styles.positionRow}>
          <Text style={styles.positionSymbol}>{item.symbol}</Text>
          <Text style={styles.positionValue}>{formatPrice(value)}</Text>
        </View>
        <View style={styles.positionDetail}>
          <Text style={styles.positionQty}>{item.quantity} shares</Text>
          <Text style={styles.positionCost}>Avg ${item.averageCost.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={styles.summaryValue}>{formatPrice(totalValue)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Positions</Text>
          <Text style={styles.summaryValue}>{positions.length}</Text>
        </View>
      </View>
      <FlatList
        data={positions}
        keyExtractor={(item) => item.id}
        renderItem={renderPosition}
        contentContainerStyle={[styles.listContent, positions.length === 0 && styles.listContentEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing || isFetching} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No positions yet. Add your first position to get started.</Text>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={onFabPress} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color={COLORS.bg} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  summary: { flexDirection: 'row', padding: 16, gap: 12 },
  summaryCard: { flex: 1, padding: 16, backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  summaryLabel: { fontSize: 12, color: COLORS.textMuted },
  summaryValue: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginTop: 4 },
  listContent: { padding: 16, paddingBottom: 80 },
  listContentEmpty: { flexGrow: 1 },
  positionCard: { padding: 16, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  positionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  positionSymbol: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  positionValue: { fontSize: 16, fontWeight: '600', color: COLORS.accent },
  positionDetail: { flexDirection: 'row', gap: 16, marginTop: 8 },
  positionQty: { fontSize: 13, color: COLORS.textMuted },
  positionCost: { fontSize: 13, color: COLORS.textMuted },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 32 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
});
