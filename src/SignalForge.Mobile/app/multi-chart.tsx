import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '../src/api/client';

const COLORS = {
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

type Timeframe = '1W' | '1M' | '3M' | '1Y';

const TF_DAYS: Record<Timeframe, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
};

type PricePoint = {
  date?: string;
  close?: number;
  high?: number;
  low?: number;
};

export default function MultiChartScreen() {
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [querySymbol, setQuerySymbol] = useState<string | null>(null);

  const days = TF_DAYS[timeframe];
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  const {
    data: history = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['history', querySymbol, timeframe],
    queryFn: async () => {
      const from = start.toISOString().split('T')[0];
      const to = end.toISOString().split('T')[0];
      const { data } = await api.get<PricePoint[]>(
        `/stocks/${encodeURIComponent(querySymbol!)}/history`,
        { params: { from, to } }
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: !!querySymbol,
  });

  const handleLoad = () => {
    const s = symbol.trim().toUpperCase();
    if (!s) return;
    setQuerySymbol(s);
  };

  const prices = history
    .map((p) => p.close ?? 0)
    .filter((c) => c > 0);
  const high = prices.length ? Math.max(...prices) : 0;
  const low = prices.length ? Math.min(...prices) : 0;
  const first = prices[0] ?? 0;
  const last = prices[prices.length - 1] ?? 0;
  const changePercent =
    first > 0 ? (((last - first) / first) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Symbol"
          placeholderTextColor={COLORS.textMuted}
          value={symbol}
          onChangeText={setSymbol}
          autoCapitalize="characters"
          onSubmitEditing={handleLoad}
        />
        <TouchableOpacity
          style={styles.loadBtn}
          onPress={handleLoad}
          disabled={isFetching || !symbol.trim()}
          activeOpacity={0.7}
        >
          {isFetching ? (
            <ActivityIndicator color={COLORS.bg} size="small" />
          ) : (
            <Ionicons name="search" size={20} color={COLORS.bg} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tfRow}>
        {(['1W', '1M', '3M', '1Y'] as const).map((tf) => (
          <TouchableOpacity
            key={tf}
            style={[
              styles.tfBtn,
              timeframe === tf && styles.tfBtnActive,
            ]}
            onPress={() => setTimeframe(tf)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tfText,
                { color: timeframe === tf ? COLORS.bg : COLORS.textPrimary },
              ]}
            >
              {tf}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {querySymbol && (
        <>
          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={COLORS.accent} size="large" />
              <Text style={styles.loadingText}>
                Loading {querySymbol}...
              </Text>
            </View>
          ) : history.length > 0 ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>High</Text>
                  <Text style={styles.statValue}>
                    ${high.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Low</Text>
                  <Text style={styles.statValue}>
                    ${low.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Change</Text>
                  <Text
                    style={[
                      styles.statValue,
                      {
                        color:
                          changePercent >= 0
                            ? COLORS.accent
                            : COLORS.danger,
                      },
                    ]}
                  >
                    {changePercent >= 0 ? '+' : ''}
                    {changePercent.toFixed(1)}%
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>
                Price History ({querySymbol})
              </Text>
              <FlatList
                data={history}
                scrollEnabled={false}
                keyExtractor={(item, i) =>
                  (item as PricePoint).date ?? String(i)
                }
                renderItem={({ item }) => {
                  const p = item as PricePoint;
                  const d = p.date
                    ? new Date(p.date).toLocaleDateString()
                    : '—';
                  const c = p.close ?? 0;
                  return (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceDate}>{d}</Text>
                      <Text style={styles.priceClose}>
                        ${c.toFixed(2)}
                      </Text>
                    </View>
                  );
                }}
              />
            </ScrollView>
          ) : (
            <View style={styles.centered}>
              <Ionicons
                name="bar-chart-outline"
                size={48}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyText}>
                No history for {querySymbol}
              </Text>
            </View>
          )}
        </>
      )}

      {!querySymbol && (
        <View style={styles.placeholder}>
          <Ionicons
            name="bar-chart-outline"
            size={64}
            color={COLORS.textMuted}
          />
          <Text style={styles.placeholderText}>
            Enter symbol and load
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  loadBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tfRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tfBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  tfBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  tfText: { fontSize: 14, fontWeight: '600' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textMuted },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
  },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceDate: { fontSize: 14, color: COLORS.textMuted },
  priceClose: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 12 },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 16,
  },
});
