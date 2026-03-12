import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { stocksApi, signalsApi, insightsApi } from '../../src/api/stocks';
import { formatPrice, formatPercent, formatVolume } from '../../src/utils/format';
import { getSignalLabel } from '../../src/utils/signalType';

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

export default function StockDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: quote,
    isLoading: quoteLoading,
    refetch: refetchQuote,
  } = useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => stocksApi.getQuote(symbol!),
    enabled: !!symbol,
  });

  const {
    data: allSignals = [],
    isLoading: signalsLoading,
    refetch: refetchSignals,
  } = useQuery({
    queryKey: ['signals', 'stockDetail'],
    queryFn: () => signalsApi.getSignals(undefined, 10),
  });

  const signals = allSignals.filter(
    (s) => s.symbol?.toUpperCase() === symbol?.toUpperCase(),
  );

  const generateMutation = useMutation({
    mutationFn: () => signalsApi.generateSignal(symbol!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
    },
    onError: () => Alert.alert('Error', 'Failed to generate signal'),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchQuote(), refetchSignals()]);
    setRefreshing(false);
  }, [refetchQuote, refetchSignals]);

  const getBadgeColor = (type: string) => {
    const label = getSignalLabel(type);
    if (label === 'Buy') return C.accent;
    if (label === 'Sell') return C.danger;
    return C.warning;
  };

  const isPositive = (quote?.change ?? 0) >= 0;

  return (
    <>
      <Stack.Screen options={{ headerTitle: symbol ?? '' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.accent}
          />
        }
      >
        {quoteLoading ? (
          <ActivityIndicator color={C.accent} size="large" style={styles.loader} />
        ) : quote ? (
          <>
            {/* Price Header */}
            <View style={styles.priceHeader}>
              <Text style={styles.symbol}>{quote.symbol}</Text>
              <Text style={styles.price}>{formatPrice(quote.price)}</Text>
              <View style={styles.changeRow}>
                <Ionicons
                  name={isPositive ? 'trending-up' : 'trending-down'}
                  size={18}
                  color={isPositive ? C.accent : C.danger}
                />
                <Text
                  style={[
                    styles.changeText,
                    { color: isPositive ? C.accent : C.danger },
                  ]}
                >
                  {formatPrice(Math.abs(quote.change))}{' '}
                  ({formatPercent(quote.changePercent)})
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>High</Text>
                <Text style={styles.statValue}>{formatPrice(quote.high)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Low</Text>
                <Text style={styles.statValue}>{formatPrice(quote.low)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Open</Text>
                <Text style={styles.statValue}>{formatPrice(quote.open)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Volume</Text>
                <Text style={styles.statValue}>{formatVolume(quote.volume)}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.generateBtn}
                onPress={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                activeOpacity={0.7}
              >
                {generateMutation.isPending ? (
                  <ActivityIndicator color={C.bg} size="small" />
                ) : (
                  <>
                    <Ionicons name="flash" size={18} color={C.bg} />
                    <Text style={styles.generateBtnText}>Generate Signal</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.thesisBtn}
                onPress={() =>
                  router.push(`/chat?symbol=${symbol}`)
                }
                activeOpacity={0.7}
              >
                <Ionicons name="document-text" size={18} color={C.purple} />
                <Text style={styles.thesisBtnText}>Trade Thesis</Text>
              </TouchableOpacity>
            </View>

            {/* AI Signals */}
            <Text style={styles.sectionTitle}>AI Signals</Text>
            {signalsLoading ? (
              <ActivityIndicator color={C.accent} style={styles.loader} />
            ) : signals.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="analytics-outline" size={32} color={C.textMuted} />
                <Text style={styles.emptyText}>
                  No signals for {symbol} yet. Tap "Generate Signal" above.
                </Text>
              </View>
            ) : (
              signals.map((signal) => {
                const color = getBadgeColor(signal.type);
                return (
                  <View key={signal.id} style={styles.signalCard}>
                    <View style={styles.signalHeader}>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: color + '22' },
                        ]}
                      >
                        <Text style={[styles.badgeText, { color }]}>
                          {getSignalLabel(signal.type)}
                        </Text>
                      </View>
                      <Text style={styles.confidence}>
                        {Math.round(signal.confidenceScore * 100)}%
                      </Text>
                    </View>
                    <Text style={styles.reasoning} numberOfLines={3}>
                      {signal.reasoning || '—'}
                    </Text>
                    <View style={styles.scoresRow}>
                      <View style={styles.scoreChip}>
                        <Text style={styles.scoreLabel}>Technical</Text>
                        <Text style={styles.scoreValue}>
                          {Math.round(signal.technicalScore * 100)}
                        </Text>
                      </View>
                      <View style={styles.scoreChip}>
                        <Text style={styles.scoreLabel}>Sentiment</Text>
                        <Text style={styles.scoreValue}>
                          {Math.round(signal.sentimentScore * 100)}
                        </Text>
                      </View>
                      <View style={styles.scoreChip}>
                        <Text style={styles.scoreLabel}>Options</Text>
                        <Text style={styles.scoreValue}>
                          {Math.round(signal.optionsScore * 100)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.signalDate}>
                      {new Date(signal.generatedAt).toLocaleString()}
                    </Text>
                  </View>
                );
              })
            )}
          </>
        ) : (
          <Text style={styles.errorText}>Unable to load quote for {symbol}</Text>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  loader: { marginTop: 40 },
  priceHeader: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  symbol: { fontSize: 14, fontWeight: '600', color: C.textMuted, letterSpacing: 2 },
  price: { fontSize: 40, fontWeight: '700', color: C.textPrimary, marginTop: 4 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  changeText: { fontSize: 16, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 20,
  },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 11, color: C.textMuted, marginBottom: 4, textTransform: 'uppercase' },
  statValue: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  generateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  generateBtnText: { fontSize: 15, fontWeight: '700', color: C.bg },
  thesisBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.purple + '18',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.purple + '44',
  },
  thesisBtnText: { fontSize: 15, fontWeight: '600', color: C.purple },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.textPrimary,
    marginBottom: 12,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyText: { fontSize: 14, color: C.textMuted, marginTop: 12, textAlign: 'center' },
  signalCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  confidence: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  reasoning: { fontSize: 14, color: C.textPrimary, lineHeight: 20, marginBottom: 12 },
  scoresRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  scoreChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: C.bg,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scoreLabel: { fontSize: 10, color: C.textMuted, textTransform: 'uppercase' },
  scoreValue: { fontSize: 14, fontWeight: '700', color: C.info, marginTop: 2 },
  signalDate: { fontSize: 11, color: C.textMuted },
  errorText: { fontSize: 16, color: C.danger, textAlign: 'center', marginTop: 40 },
});
