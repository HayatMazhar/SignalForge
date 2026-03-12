import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/api/client';

const C = {
  bg: '#06060B', surface: '#0C0F1A', accent: '#00FF94', danger: '#FF3B5C',
  textPrimary: '#F0F4F8', textMuted: '#5B6378', border: '#1A1F35',
  warning: '#FFB020', info: '#38BDF8', purple: '#A78BFA',
};

type OptionsFlow = {
  symbol: string; type: string; strike: number; expiration: string;
  premium: number; volume: number; openInterest: number; isUnusual: boolean;
};

export default function OptionsFlowScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'calls' | 'puts'>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['options-unusual'],
    queryFn: () => api.get('/options/unusual').then(r => Array.isArray(r.data) ? r.data as OptionsFlow[] : []),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filtered = (data ?? []).filter(o => {
    if (filter === 'calls') return o.type === 'Call';
    if (filter === 'puts') return o.type === 'Put';
    return true;
  });

  const totalCalls = (data ?? []).filter(o => o.type === 'Call').length;
  const totalPuts = (data ?? []).filter(o => o.type === 'Put').length;
  const unusualCount = (data ?? []).filter(o => o.isUnusual).length;

  const renderItem = ({ item }: { item: OptionsFlow }) => {
    const isCall = item.type === 'Call';
    return (
      <TouchableOpacity style={s.card} onPress={() => router.push(`/stocks/${item.symbol}`)} activeOpacity={0.7}>
        <View style={s.cardHeader}>
          <Text style={s.cardSymbol}>{item.symbol}</Text>
          <View style={[s.typeBadge, { backgroundColor: isCall ? C.accent + '20' : C.danger + '20' }]}>
            <Ionicons name={isCall ? 'arrow-up' : 'arrow-down'} size={12} color={isCall ? C.accent : C.danger} />
            <Text style={[s.typeText, { color: isCall ? C.accent : C.danger }]}>{item.type}</Text>
          </View>
        </View>
        <View style={s.cardRow}>
          <View style={s.metric}>
            <Text style={s.metricLabel}>Strike</Text>
            <Text style={s.metricValue}>${(item.strike ?? 0).toFixed(0)}</Text>
          </View>
          <View style={s.metric}>
            <Text style={s.metricLabel}>Premium</Text>
            <Text style={s.metricValue}>${((item.premium ?? 0) / 1000).toFixed(0)}K</Text>
          </View>
          <View style={s.metric}>
            <Text style={s.metricLabel}>Volume</Text>
            <Text style={s.metricValue}>{(item.volume ?? 0).toLocaleString()}</Text>
          </View>
          <View style={s.metric}>
            <Text style={s.metricLabel}>OI</Text>
            <Text style={s.metricValue}>{(item.openInterest ?? 0).toLocaleString()}</Text>
          </View>
        </View>
        {item.isUnusual && (
          <View style={s.unusualBadge}>
            <Ionicons name="flame" size={12} color={C.warning} />
            <Text style={s.unusualText}>Unusual Activity</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statValue}>{totalCalls}</Text>
          <Text style={[s.statLabel, { color: C.accent }]}>Calls</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statValue}>{totalPuts}</Text>
          <Text style={[s.statLabel, { color: C.danger }]}>Puts</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statValue}>{unusualCount}</Text>
          <Text style={[s.statLabel, { color: C.warning }]}>Unusual</Text>
        </View>
      </View>

      <View style={s.filterRow}>
        {(['all', 'calls', 'puts'] as const).map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && s.filterActiveText]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={s.centered}><ActivityIndicator color={C.accent} size="large" /></View>
      ) : (
        <FlatList data={filtered} keyExtractor={(_, i) => i.toString()} renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
          ListEmptyComponent={
            <View style={s.centered}>
              <Ionicons name="analytics-outline" size={48} color={C.textMuted} />
              <Text style={s.emptyText}>No options flow data</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: C.textMuted, marginTop: 12 },
  statsRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 },
  statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: C.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  filterActive: { backgroundColor: C.accent + '15', borderColor: C.accent + '40' },
  filterText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  filterActiveText: { color: C.accent },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardSymbol: { fontSize: 18, fontWeight: '700', color: C.accent },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 12, fontWeight: '700' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { alignItems: 'center' },
  metricLabel: { fontSize: 10, color: C.textMuted, marginBottom: 2 },
  metricValue: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  unusualBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: C.warning + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  unusualText: { fontSize: 11, fontWeight: '700', color: C.warning },
});
