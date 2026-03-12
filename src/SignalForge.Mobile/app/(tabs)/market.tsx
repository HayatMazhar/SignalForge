import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { stocksApi } from '../../src/api/stocks';
import api from '../../src/api/client';
import { formatPrice, formatPercent } from '../../src/utils/format';
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

export default function MarketScreen() {
  const COLORS = useTheme();
  const { mode } = useAssetModeStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: movers = [], refetch, isFetching } = useQuery({
    queryKey: ['topMovers', mode],
    queryFn: () =>
      mode === 'crypto'
        ? api.get('/crypto/top-movers').then(r => Array.isArray(r.data) ? r.data : [])
        : stocksApi.getTopMovers(),
  });

  const { data: losers } = useQuery({
    queryKey: ['top-losers', mode],
    queryFn: () =>
      mode === 'crypto'
        ? api.get('/crypto/movers/losers').then(r => Array.isArray(r.data) ? r.data : [])
        : api.get('/stocks/movers/losers').then(r => Array.isArray(r.data) ? r.data : []),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const totalFetched = movers.length + (losers ?? []).length;
  const bestGainerPct = movers.length > 0 ? Math.max(...movers.map((m: any) => m.changePercent ?? 0)) : 0;
  const allLosersRaw = [...movers.filter((m: any) => (m.changePercent ?? 0) < 0), ...(losers ?? [])];
  const worstLoserPct = allLosersRaw.length > 0 ? Math.min(...allLosersRaw.map((m: any) => m.changePercent ?? 0)) : 0;

  const sq = searchQuery.toLowerCase();
  const filteredMovers = searchQuery
    ? movers.filter((m: any) => m.symbol?.toLowerCase().includes(sq) || m.name?.toLowerCase().includes(sq))
    : movers;
  const gainers = filteredMovers.filter((m: any) => (m.changePercent ?? 0) > 0);
  const moversLosers = filteredMovers.filter((m: any) => (m.changePercent ?? 0) < 0);
  const filteredLosers = searchQuery
    ? (losers ?? []).filter((m: any) => m.symbol?.toLowerCase().includes(sq) || m.name?.toLowerCase().includes(sq))
    : (losers ?? []);

  const MoverRow = ({ item }: { item: typeof movers[0] }) => (
    <TouchableOpacity
      style={styles.moverRow}
      onPress={() => router.push(`/stocks/${item.symbol}`)}
      activeOpacity={0.7}
    >
      <View>
        <Text style={styles.moverSymbol}>{item.symbol}</Text>
        <Text style={styles.moverName} numberOfLines={1}>{item.name || item.symbol}</Text>
      </View>
      <View style={styles.moverRight}>
        <Text style={styles.moverPrice}>{formatPrice(item.price)}</Text>
        <Text style={[styles.moverChange, { color: (item.changePercent ?? 0) >= 0 ? COLORS.accent : COLORS.danger }]}>
          {formatPercent(item.changePercent ?? 0)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing || isFetching} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.textPrimary }}>{totalFetched}</Text>
            <Text style={{ fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Total</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.accent }}>{formatPercent(bestGainerPct)}</Text>
            <Text style={{ fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Best</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.danger }}>{formatPercent(worstLoserPct)}</Text>
            <Text style={{ fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Worst</Text>
          </View>
        </View>

        <TextInput
          style={{ backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, fontSize: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 }}
          placeholder="Search by symbol or name..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.sectionTitle}>{mode === 'crypto' ? 'Crypto Movers' : 'Top Movers'}</Text>

        <Text style={styles.subsectionTitle}>Gainers</Text>
        {gainers.length === 0 ? (
          <Text style={styles.emptyText}>No gainers</Text>
        ) : (
          gainers.map((item) => <MoverRow key={item.symbol} item={item} />)
        )}

        <Text style={styles.subsectionTitle}>Losers</Text>
        {moversLosers.length === 0 ? (
          <Text style={styles.emptyText}>No losers</Text>
        ) : (
          moversLosers.map((item) => <MoverRow key={item.symbol} item={item} />)
        )}

        <Text style={styles.sectionTitle}>{mode === 'crypto' ? 'Crypto Losers' : 'Top Losers'}</Text>
        {filteredLosers.length === 0 ? (
          <Text style={styles.emptyText}>No losers</Text>
        ) : (
          filteredLosers.map((item: any) => (
            <TouchableOpacity
              key={item.symbol}
              style={styles.moverRow}
              onPress={() => router.push(`/stocks/${item.symbol}`)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.moverSymbol}>{item.symbol}</Text>
                <Text style={styles.moverName} numberOfLines={1}>{item.name || item.symbol}</Text>
              </View>
              <View style={styles.moverRight}>
                <Text style={styles.moverPrice}>{formatPrice(item.price)}</Text>
                <Text style={[styles.moverChange, { color: COLORS.danger }]}>
                  {formatPercent(item.changePercent ?? 0)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 20 },
  subsectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12, marginTop: 8 },
  moverRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  moverSymbol: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  moverName: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  moverRight: { alignItems: 'flex-end' },
  moverPrice: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  moverChange: { fontSize: 13, marginTop: 2 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
});
