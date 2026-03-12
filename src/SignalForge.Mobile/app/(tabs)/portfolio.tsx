import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { portfolioApi, stocksApi } from '../../src/api/stocks';
import { formatPrice } from '../../src/utils/format';
import { useAssetModeStore } from '../../src/stores/assetModeStore';
import { useTheme } from '../../src/constants/config';

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
  const COLORS = useTheme();
  const { mode } = useAssetModeStore();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newCost, setNewCost] = useState('');

  const { data: portfolio = {} as Portfolio, refetch, isFetching } = useQuery({
    queryKey: ['portfolio', mode],
    queryFn: () => portfolioApi.get(),
  });

  const positions = portfolio?.positions ?? [];
  const posSymbols = positions.map((p: any) => p.symbol);

  const { data: liveQuotes = {} } = useQuery({
    queryKey: ['port-quotes', posSymbols.join(',')],
    queryFn: async () => {
      const quotes: Record<string, number> = {};
      await Promise.all(posSymbols.map(async (sym: string) => {
        try { const q = await stocksApi.getQuote(sym); quotes[sym] = q.price; } catch {}
      }));
      return quotes;
    },
    enabled: posSymbols.length > 0,
    refetchInterval: 30000,
  });

  const addPositionMutation = useMutation({
    mutationFn: ({ symbol, quantity, averageCost }: { symbol: string; quantity: number; averageCost: number }) =>
      portfolioApi.addPosition(symbol, quantity, averageCost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      setShowAddForm(false);
      setNewSymbol('');
      setNewQty('');
      setNewCost('');
    },
    onError: () => Alert.alert('Error', 'Failed to add position'),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const totalValue = positions.reduce((sum: number, p: any) => {
    const price = liveQuotes[p.symbol] ?? p.averageCost;
    return sum + p.quantity * price;
  }, 0);
  const totalCost = positions.reduce((sum: number, p: any) => sum + p.quantity * p.averageCost, 0);
  const totalPL = totalValue - totalCost;

  const handleAddPosition = () => {
    const sym = newSymbol.trim().toUpperCase();
    const qty = parseFloat(newQty);
    const cost = parseFloat(newCost);
    if (!sym || isNaN(qty) || qty <= 0 || isNaN(cost) || cost <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid symbol, quantity, and cost.');
      return;
    }
    addPositionMutation.mutate({ symbol: sym, quantity: qty, averageCost: cost });
  };

  const renderPosition = ({ item }: { item: Position }) => {
    const currentPrice = liveQuotes[item.symbol] ?? item.currentPrice ?? item.averageCost;
    const value = item.quantity * currentPrice;
    const costBasis = item.quantity * item.averageCost;
    const pl = value - costBasis;
    const plPct = costBasis > 0 ? (pl / costBasis) * 100 : 0;
    const plColor = pl >= 0 ? COLORS.accent : COLORS.danger;

    return (
      <TouchableOpacity
        style={styles.positionCard}
        onPress={() => router.push(`/stocks/${item.symbol}`)}
        activeOpacity={0.7}
      >
        <View style={styles.positionRow}>
          <Text style={styles.positionSymbol}>{item.symbol}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.positionValue}>{formatPrice(value)}</Text>
            <Text style={[styles.positionPL, { color: plColor }]}>
              {pl >= 0 ? '+' : ''}{formatPrice(pl)} ({pl >= 0 ? '+' : ''}{plPct.toFixed(2)}%)
            </Text>
          </View>
        </View>
        <View style={styles.positionDetail}>
          <Text style={styles.positionQty}>{item.quantity} shares</Text>
          <Text style={styles.positionCost}>Avg ${item.averageCost.toFixed(2)}</Text>
          <Text style={[styles.positionCost, { color: COLORS.textPrimary }]}>
            ${currentPrice.toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>{mode === 'crypto' ? 'Crypto Portfolio' : 'Portfolio'}</Text>
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
      {positions.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total P&L</Text>
            <Text style={[styles.summaryValue, { color: totalPL >= 0 ? COLORS.accent : COLORS.danger }]}>
              {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
            </Text>
          </View>
        </View>
      )}
      {showAddForm && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.addInput}
            value={newSymbol}
            onChangeText={setNewSymbol}
            placeholder={mode === 'crypto' ? 'Symbol (e.g. BTC)' : 'Symbol (e.g. AAPL)'}
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="characters"
            autoFocus
          />
          <View style={styles.addFormRow}>
            <TextInput
              style={[styles.addInput, { flex: 1 }]}
              value={newQty}
              onChangeText={setNewQty}
              placeholder="Quantity"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.addInput, { flex: 1 }]}
              value={newCost}
              onChangeText={setNewCost}
              placeholder="Avg Cost"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.addFormRow}>
            <TouchableOpacity
              style={styles.addFormBtn}
              onPress={handleAddPosition}
              disabled={addPositionMutation.isPending}
            >
              {addPositionMutation.isPending ? (
                <ActivityIndicator color={COLORS.bg} size="small" />
              ) : (
                <Text style={styles.addFormBtnText}>Add Position</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addFormCancel}
              onPress={() => { setShowAddForm(false); setNewSymbol(''); setNewQty(''); setNewCost(''); }}
            >
              <Text style={styles.addFormCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddForm(!showAddForm)} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color={COLORS.bg} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  pageTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, paddingHorizontal: 16, paddingTop: 12 },
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
  positionPL: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 32 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  addForm: { paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  addFormRow: { flexDirection: 'row', gap: 8 },
  addInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addFormBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFormBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.bg },
  addFormCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFormCancelText: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted },
});
