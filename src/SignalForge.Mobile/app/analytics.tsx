import { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
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

interface Signal {
  id: string;
  symbol: string;
  type: string;
  confidence: number;
  createdAt: string;
}

export default function AnalyticsScreen() {
  const { data: signals = [], isLoading } = useQuery<Signal[]>({
    queryKey: ['analytics-signals'],
    queryFn: () => api.get('/signals?limit=200').then((r) => Array.isArray(r.data) ? r.data : []),
  });

  const stats = useMemo(() => {
    const buy = signals.filter((s) => s.type?.toLowerCase() === 'buy');
    const sell = signals.filter((s) => s.type?.toLowerCase() === 'sell');
    const hold = signals.filter((s) => s.type?.toLowerCase() === 'hold');
    const avgConf =
      signals.length > 0
        ? signals.reduce((sum, s) => sum + (s.confidence || 0), 0) / signals.length
        : 0;

    const symbolCounts: Record<string, number> = {};
    buy.forEach((s) => {
      symbolCounts[s.symbol] = (symbolCounts[s.symbol] || 0) + 1;
    });
    const topSymbols = Object.entries(symbolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      total: signals.length,
      buyCount: buy.length,
      sellCount: sell.length,
      holdCount: hold.length,
      avgConfidence: avgConf,
      topSymbols,
    };
  }, [signals]);

  const maxDistribution = Math.max(stats.buyCount, stats.sellCount, stats.holdCount, 1);

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Performance Analytics</Text>

        <View style={s.statsRow}>
          <StatCard icon="pulse" label="Total" value={stats.total} color={C.info} />
          <StatCard icon="trending-up" label="Buy" value={stats.buyCount} color={C.accent} />
          <StatCard icon="trending-down" label="Sell" value={stats.sellCount} color={C.danger} />
          <StatCard icon="remove-outline" label="Hold" value={stats.holdCount} color={C.warning} />
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="speedometer-outline" size={18} color={C.purple} />
            <Text style={s.cardTitle}>Avg Confidence</Text>
          </View>
          <Text style={[s.bigNumber, { color: C.purple }]}>
            {(stats.avgConfidence * 100).toFixed(1)}%
          </Text>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="bar-chart-outline" size={18} color={C.info} />
            <Text style={s.cardTitle}>Signal Distribution</Text>
          </View>
          <DistributionBar label="Buy" count={stats.buyCount} max={maxDistribution} color={C.accent} />
          <DistributionBar label="Sell" count={stats.sellCount} max={maxDistribution} color={C.danger} />
          <DistributionBar label="Hold" count={stats.holdCount} max={maxDistribution} color={C.warning} />
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="trophy-outline" size={18} color={C.accent} />
            <Text style={s.cardTitle}>Top Buy Symbols</Text>
          </View>
          {stats.topSymbols.length === 0 ? (
            <Text style={s.noData}>No buy signals yet</Text>
          ) : (
            stats.topSymbols.map(([sym, count], i) => (
              <View key={sym} style={s.topRow}>
                <Text style={s.topRank}>#{i + 1}</Text>
                <Text style={s.topSymbol}>{sym}</Text>
                <View style={s.topCountBadge}>
                  <Text style={s.topCount}>{count}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={s.statCard}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function DistributionBar({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <View style={s.distRow}>
      <Text style={[s.distLabel, { color }]}>{label}</Text>
      <View style={s.distBarTrack}>
        <View style={[s.distBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.distCount}>{count}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  title: { fontSize: 22, fontWeight: '800', color: C.textPrimary, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  bigNumber: { fontSize: 36, fontWeight: '800', textAlign: 'center' },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  distLabel: { fontSize: 13, fontWeight: '700', width: 36 },
  distBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: C.bg,
    borderRadius: 5,
    overflow: 'hidden',
  },
  distBarFill: { height: 10, borderRadius: 5 },
  distCount: { fontSize: 13, fontWeight: '700', color: C.textPrimary, width: 36, textAlign: 'right' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  topRank: { fontSize: 13, fontWeight: '700', color: C.textMuted, width: 30 },
  topSymbol: { flex: 1, fontSize: 15, fontWeight: '700', color: C.accent },
  topCountBadge: {
    backgroundColor: C.accent + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  topCount: { fontSize: 13, fontWeight: '700', color: C.accent },
  noData: { fontSize: 14, color: C.textMuted, textAlign: 'center', paddingVertical: 20 },
});
