import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { watchlistApi } from '../src/api/stocks';
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

interface WatchlistItem {
  symbol: string;
  addedAt?: string;
}

interface WatchlistSignal {
  symbol: string;
  type: 'Buy' | 'Sell' | 'Hold';
  confidence: number;
  reasoning?: string;
}

export default function WatchlistScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'stocks' | 'signals'>('stocks');
  const [showAdd, setShowAdd] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: rawData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistApi.get(),
  });

  const items: WatchlistItem[] = Array.isArray(rawData)
    ? rawData.map((w: any) =>
        typeof w === 'string' ? { symbol: w } : { symbol: w.symbol, addedAt: w.addedAt },
      )
    : (rawData as any)?.symbols?.map((s: string) => ({ symbol: s })) ?? [];

  const {
    data: signals = [],
    isLoading: signalsLoading,
    refetch: refetchSignals,
  } = useQuery<WatchlistSignal[]>({
    queryKey: ['watchlist-signals'],
    queryFn: () => api.get('/signals/watchlist').then((r) => (Array.isArray(r.data) ? r.data : [])),
    enabled: tab === 'signals',
  });

  const addMutation = useMutation({
    mutationFn: (symbol: string) => watchlistApi.add(symbol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      setNewSymbol('');
      setShowAdd(false);
    },
    onError: () => Alert.alert('Error', 'Failed to add symbol'),
  });

  const removeMutation = useMutation({
    mutationFn: (symbol: string) => watchlistApi.remove(symbol),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
    onError: () => Alert.alert('Error', 'Failed to remove symbol'),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await (tab === 'signals' ? refetchSignals() : refetch());
    setRefreshing(false);
  }, [refetch, refetchSignals, tab]);

  const handleAdd = () => {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym) return;
    addMutation.mutate(sym);
  };

  const renderItem = ({ item }: { item: WatchlistItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/stocks/${item.symbol}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.symbol}>{item.symbol}</Text>
        {item.addedAt && (
          <Text style={styles.addedDate}>
            Added {new Date(item.addedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() =>
          Alert.alert('Remove', `Remove ${item.symbol} from watchlist?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeMutation.mutate(item.symbol) },
          ])
        }
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color={C.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const signalColor = (type: string) =>
    type === 'Buy' ? C.accent : type === 'Sell' ? C.danger : C.warning;

  const renderSignalItem = ({ item }: { item: WatchlistSignal }) => (
    <View style={styles.signalCard}>
      <View style={styles.signalHeader}>
        <Text style={styles.symbol}>{item.symbol}</Text>
        <View style={[styles.signalBadge, { backgroundColor: signalColor(item.type) + '22' }]}>
          <Text style={[styles.signalBadgeText, { color: signalColor(item.type) }]}>
            {item.type}
          </Text>
        </View>
      </View>
      <View style={styles.confidenceRow}>
        <Text style={styles.confidenceLabel}>Confidence</Text>
        <Text style={[styles.confidenceValue, { color: signalColor(item.type) }]}>
          {Math.round(item.confidence * 100)}%
        </Text>
      </View>
      {item.reasoning ? (
        <Text style={styles.reasoning} numberOfLines={2}>
          {item.reasoning}
        </Text>
      ) : null}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'stocks' && styles.tabBtnActive]}
          onPress={() => setTab('stocks')}
        >
          <Text style={[styles.tabBtnText, tab === 'stocks' && styles.tabBtnTextActive]}>
            Stocks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'signals' && styles.tabBtnActive]}
          onPress={() => setTab('signals')}
        >
          <Text style={[styles.tabBtnText, tab === 'signals' && styles.tabBtnTextActive]}>
            Signals
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'stocks' ? (
        <>
          {/* Add bar */}
          <View style={styles.topBar}>
            {showAdd ? (
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  value={newSymbol}
                  onChangeText={setNewSymbol}
                  placeholder="Symbol (e.g. AAPL)"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="characters"
                  autoFocus
                  onSubmitEditing={handleAdd}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={addMutation.isPending}>
                  {addMutation.isPending ? (
                    <ActivityIndicator color={C.bg} size="small" />
                  ) : (
                    <Ionicons name="checkmark" size={20} color={C.bg} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAdd(false); setNewSymbol(''); }}>
                  <Ionicons name="close" size={20} color={C.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addToggle} onPress={() => setShowAdd(true)}>
                <Ionicons name="add-circle" size={22} color={C.accent} />
                <Text style={styles.addToggleText}>Add Symbol</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={items}
            keyExtractor={(item) => item.symbol}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
            }
            ListEmptyComponent={
              <View style={styles.centered}>
                <Ionicons name="eye-outline" size={48} color={C.textMuted} />
                <Text style={styles.emptyText}>Your watchlist is empty</Text>
                <Text style={styles.emptyHint}>Tap "Add Symbol" to start tracking stocks</Text>
              </View>
            }
          />
        </>
      ) : signalsLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={signals}
          keyExtractor={(item) => item.symbol}
          renderItem={renderSignalItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="pulse-outline" size={48} color={C.textMuted} />
              <Text style={styles.emptyText}>No signals for your watchlist</Text>
              <Text style={styles.emptyHint}>Add stocks to your watchlist to receive signals</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  topBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addInput: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: C.textPrimary,
    borderWidth: 1,
    borderColor: C.border,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  addToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  addToggleText: { fontSize: 15, fontWeight: '600', color: C.accent },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 10,
  },
  cardLeft: { flex: 1 },
  symbol: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  addedDate: { fontSize: 12, color: C.textMuted, marginTop: 4 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.danger + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: 16, color: C.textMuted, marginTop: 16 },
  emptyHint: { fontSize: 13, color: C.textMuted, marginTop: 4 },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: C.accent + '18',
    borderColor: C.accent,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textMuted,
  },
  tabBtnTextActive: {
    color: C.accent,
  },
  signalCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 10,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  signalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  signalBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 13,
    color: C.textMuted,
  },
  confidenceValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  reasoning: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 18,
  },
});
