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

export default function WatchlistScreen() {
  const queryClient = useQueryClient();
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
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
});
