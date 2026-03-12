import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { socialApi } from '../src/api/stocks';
import { formatPercent } from '../src/utils/format';

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

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

interface Trader {
  id?: string;
  rank: number;
  name: string;
  username?: string;
  returnPercent: number;
  winRate: number;
  totalSignals: number;
  avatarUrl?: string;
}

export default function LeaderboardScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: traders = [], isLoading, refetch } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => socialApi.getLeaderboard() as Promise<Trader[]>,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderTrader = ({ item, index }: { item: Trader; index: number }) => {
    const rank = item.rank ?? index + 1;
    const isTop3 = rank <= 3;
    const medalColor = isTop3 ? MEDAL_COLORS[rank - 1] : undefined;
    const isPositiveReturn = item.returnPercent >= 0;

    return (
      <View
        style={[
          styles.card,
          isTop3 && { borderColor: medalColor + '44' },
        ]}
      >
        {/* Rank */}
        <View style={styles.rankCol}>
          {isTop3 ? (
            <View style={[styles.medalCircle, { backgroundColor: medalColor + '22', borderColor: medalColor }]}>
              <Ionicons name="trophy" size={16} color={medalColor} />
            </View>
          ) : (
            <Text style={styles.rankNumber}>{rank}</Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoCol}>
          <Text style={styles.traderName}>{item.name}</Text>
          {item.username && (
            <Text style={styles.username}>@{item.username}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsCol}>
          <Text
            style={[
              styles.returnPct,
              { color: isPositiveReturn ? C.accent : C.danger },
            ]}
          >
            {formatPercent(item.returnPercent)}
          </Text>
          <View style={styles.miniStats}>
            <Text style={styles.miniStat}>
              {Math.round(item.winRate * 100)}% WR
            </Text>
            <Text style={styles.miniDivider}>·</Text>
            <Text style={styles.miniStat}>{item.totalSignals} signals</Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#06060B' }} edges={['bottom']}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.list}
        data={traders}
        keyExtractor={(item, index) => item.id ?? String(index)}
        renderItem={renderTrader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Ionicons name="trophy" size={24} color={C.warning} />
            <Text style={styles.headerTitle}>Top Traders</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="people-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyText}>Leaderboard data unavailable</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },
  rankCol: { width: 44, alignItems: 'center', marginRight: 12 },
  medalCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: { fontSize: 18, fontWeight: '700', color: C.textMuted },
  infoCol: { flex: 1, marginRight: 12 },
  traderName: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  username: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  statsCol: { alignItems: 'flex-end' },
  returnPct: { fontSize: 18, fontWeight: '700' },
  miniStats: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  miniStat: { fontSize: 11, color: C.textMuted },
  miniDivider: { fontSize: 11, color: C.textMuted, marginHorizontal: 4 },
  emptyText: { fontSize: 14, color: C.textMuted, marginTop: 16 },
});
