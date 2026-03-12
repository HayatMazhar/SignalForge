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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { stocksApi, signalsApi, insightsApi, newsApi, watchlistApi } from '../../src/api/stocks';
import { formatPrice, formatPercent, formatVolume } from '../../src/utils/format';
import { getSignalLabel } from '../../src/utils/signalType';
import { useTheme } from '../../src/constants/config';

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
  const C = useTheme();
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

  const { data: technicals } = useQuery({
    queryKey: ['technicals', symbol],
    queryFn: () => stocksApi.getIndicators(symbol!),
    enabled: !!symbol,
  });

  const { data: newsItems = [] } = useQuery({
    queryKey: ['stockNews', symbol],
    queryFn: () => newsApi.getNews(symbol!, 5),
    enabled: !!symbol,
  });

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistApi.get(),
  });
  const isWatched = (Array.isArray(watchlist) ? watchlist : []).some(
    (w: any) => (typeof w === 'string' ? w : w?.symbol) === symbol?.toUpperCase()
  );
  const watchlistMutation = useMutation({
    mutationFn: () => isWatched ? watchlistApi.remove(symbol!) : watchlistApi.add(symbol!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });

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

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getRsiColor = (rsi: number) => {
    if (rsi < 30) return C.accent;
    if (rsi > 70) return C.danger;
    return C.warning;
  };

  return (
    <>
      <Stack.Screen options={{ headerTitle: symbol ?? '' }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['bottom']}>
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
              <TouchableOpacity
                onPress={() => watchlistMutation.mutate()}
                style={styles.watchlistBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isWatched ? 'star' : 'star-outline'}
                  size={24}
                  color={isWatched ? C.warning : C.textMuted}
                />
              </TouchableOpacity>
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

            {/* Technical Indicators */}
            {technicals && (
              <View style={styles.techCard}>
                <Text style={styles.sectionTitle}>Technical Indicators</Text>
                <View style={styles.techRow}>
                  <View style={styles.techItem}>
                    <Text style={styles.techLabel}>RSI (14)</Text>
                    <Text style={[styles.techValue, { color: getRsiColor(technicals.rsi) }]}>
                      {technicals.rsi?.toFixed(1)}
                    </Text>
                    <Text style={[styles.techSubLabel, { color: getRsiColor(technicals.rsi) }]}>
                      {technicals.rsi < 30 ? 'Oversold' : technicals.rsi > 70 ? 'Overbought' : 'Neutral'}
                    </Text>
                  </View>
                  <View style={styles.techItem}>
                    <Text style={styles.techLabel}>MACD</Text>
                    <Text style={[styles.techValue, { color: technicals.macd >= 0 ? C.accent : C.danger }]}>
                      {technicals.macd?.toFixed(2)}
                    </Text>
                    <Text style={[styles.techSubLabel, { color: technicals.macd >= 0 ? C.accent : C.danger }]}>
                      {technicals.macd >= 0 ? 'Bullish' : 'Bearish'}
                    </Text>
                  </View>
                  <View style={styles.techItem}>
                    <Text style={styles.techLabel}>Trend</Text>
                    <View style={[
                      styles.trendBadge,
                      { backgroundColor: (technicals.trend === 'Bullish' ? C.accent : C.danger) + '22' },
                    ]}>
                      <Text style={[
                        styles.trendBadgeText,
                        { color: technicals.trend === 'Bullish' ? C.accent : C.danger },
                      ]}>
                        {technicals.trend}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.smaRow}>
                  <View style={styles.smaItem}>
                    <Text style={styles.smaLabel}>SMA 20</Text>
                    <Text style={styles.smaValue}>{formatPrice(technicals.sma20)}</Text>
                  </View>
                  <View style={styles.smaItem}>
                    <Text style={styles.smaLabel}>SMA 50</Text>
                    <Text style={styles.smaValue}>{formatPrice(technicals.sma50)}</Text>
                  </View>
                  <View style={styles.smaItem}>
                    <Text style={styles.smaLabel}>SMA 200</Text>
                    <Text style={styles.smaValue}>{formatPrice(technicals.sma200)}</Text>
                  </View>
                </View>
              </View>
            )}

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

            {/* Latest News */}
            {newsItems.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Latest News</Text>
                {newsItems.slice(0, 3).map((article: any, idx: number) => (
                  <TouchableOpacity
                    key={article.id ?? idx}
                    style={styles.newsCard}
                    onPress={() => article.url && Linking.openURL(article.url)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.newsHeader}>
                      <Text style={styles.newsSource}>{article.source}</Text>
                      <Text style={styles.newsTime}>{timeAgo(article.publishedAt)}</Text>
                    </View>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                      {article.title}
                    </Text>
                    {article.sentiment && (
                      <View style={[
                        styles.sentimentBadge,
                        {
                          backgroundColor:
                            (article.sentiment === 'Positive' ? C.accent
                              : article.sentiment === 'Negative' ? C.danger
                              : C.warning) + '22',
                        },
                      ]}>
                        <Text style={[
                          styles.sentimentText,
                          {
                            color:
                              article.sentiment === 'Positive' ? C.accent
                                : article.sentiment === 'Negative' ? C.danger
                                : C.warning,
                          },
                        ]}>
                          {article.sentiment}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Last Updated */}
            {quote.timestamp && (
              <Text style={styles.lastUpdated}>
                Last updated {timeAgo(quote.timestamp)}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.errorText}>Unable to load quote for {symbol}</Text>
        )}
        </ScrollView>
      </SafeAreaView>
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
  watchlistBtn: { marginTop: 12, padding: 8 },
  techCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 20,
  },
  techRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  techItem: { alignItems: 'center', flex: 1 },
  techLabel: { fontSize: 11, color: C.textMuted, textTransform: 'uppercase', marginBottom: 6 },
  techValue: { fontSize: 18, fontWeight: '700' },
  techSubLabel: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  trendBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 4 },
  trendBadgeText: { fontSize: 13, fontWeight: '700' },
  smaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 12,
  },
  smaItem: { alignItems: 'center', flex: 1 },
  smaLabel: { fontSize: 10, color: C.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  smaValue: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  newsCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  newsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  newsSource: { fontSize: 12, fontWeight: '600', color: C.info },
  newsTime: { fontSize: 11, color: C.textMuted },
  newsTitle: { fontSize: 14, fontWeight: '600', color: C.textPrimary, lineHeight: 20, marginBottom: 8 },
  sentimentBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  sentimentText: { fontSize: 11, fontWeight: '700' },
  lastUpdated: { fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 16 },
});
