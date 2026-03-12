import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { stocksApi } from '../src/api/stocks';
import api from '../src/api/client';
import { formatPrice, formatPercent } from '../src/utils/format';
import { useTheme } from '../src/constants/config';

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

interface CompareCardProps {
  symbol: string;
  onRemove: () => void;
  batchData?: { quote?: any; indicators?: any };
}

function CompareCard({ symbol, onRemove, batchData }: CompareCardProps) {
  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => stocksApi.getQuote(symbol),
    enabled: !batchData?.quote,
  });

  const { data: indicators, isLoading: indLoading } = useQuery({
    queryKey: ['indicators', symbol],
    queryFn: () => stocksApi.getIndicators(symbol),
    enabled: !batchData?.indicators,
  });

  const effectiveQuote = batchData?.quote ?? quote;
  const effectiveIndicators = batchData?.indicators ?? indicators;

  const isPositive = (effectiveQuote?.changePercent ?? 0) >= 0;
  const loading = !batchData && (quoteLoading || indLoading);

  const rsi = (effectiveIndicators as any)?.rsi ?? (effectiveIndicators as any)?.RSI;
  const macd = (effectiveIndicators as any)?.macd ?? (effectiveIndicators as any)?.MACD;
  const trend = (effectiveIndicators as any)?.trend ?? (effectiveIndicators as any)?.trendDirection;

  return (
    <View style={styles.compareCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardSymbol}>{symbol}</Text>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={20} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={C.accent} style={styles.cardLoader} />
      ) : (
        <>
          {effectiveQuote && (
            <>
              <Text style={styles.cardPrice}>{formatPrice(effectiveQuote.price)}</Text>
              <Text
                style={[
                  styles.cardChange,
                  { color: isPositive ? C.accent : C.danger },
                ]}
              >
                {formatPercent(effectiveQuote.changePercent)}
              </Text>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.indicatorRow}>
            <Text style={styles.indLabel}>RSI</Text>
            <Text
              style={[
                styles.indValue,
                {
                  color:
                    rsi != null
                      ? rsi > 70
                        ? C.danger
                        : rsi < 30
                        ? C.accent
                        : C.textPrimary
                      : C.textMuted,
                },
              ]}
            >
              {rsi != null ? Number(rsi).toFixed(1) : '—'}
            </Text>
          </View>

          <View style={styles.indicatorRow}>
            <Text style={styles.indLabel}>MACD</Text>
            <Text
              style={[
                styles.indValue,
                {
                  color:
                    macd != null
                      ? Number(macd) >= 0
                        ? C.accent
                        : C.danger
                      : C.textMuted,
                },
              ]}
            >
              {macd != null ? Number(macd).toFixed(2) : '—'}
            </Text>
          </View>

          <View style={styles.indicatorRow}>
            <Text style={styles.indLabel}>Trend</Text>
            <Text
              style={[
                styles.indValue,
                {
                  color:
                    trend === 'Bullish' || trend === 'Up'
                      ? C.accent
                      : trend === 'Bearish' || trend === 'Down'
                      ? C.danger
                      : C.warning,
                },
              ]}
            >
              {trend ?? '—'}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

export default function CompareScreen() {
  const C = useTheme();
  const [symbols, setSymbols] = useState<string[]>(['AAPL', 'MSFT']);
  const [newSymbol, setNewSymbol] = useState('');

  const { data: batchCompare } = useQuery({
    queryKey: ['compare-batch', symbols.join(',')],
    queryFn: async () => {
      try {
        const res = await api.get('/compare', {
          params: { symbols: symbols.join(',') },
        });
        return res.data as Record<string, { quote?: any; indicators?: any }>;
      } catch {
        return null;
      }
    },
    enabled: symbols.length >= 2,
  });

  const handleAdd = () => {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym || symbols.includes(sym)) return;
    setSymbols((prev) => [...prev, sym]);
    setNewSymbol('');
  };

  const handleRemove = (sym: string) => {
    setSymbols((prev) => prev.filter((s) => s !== sym));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['bottom']}>
    <View style={styles.container}>
      {/* Add symbol */}
      <View style={styles.addBar}>
        <TextInput
          style={styles.addInput}
          value={newSymbol}
          onChangeText={setNewSymbol}
          placeholder="Add symbol..."
          placeholderTextColor={C.textMuted}
          autoCapitalize="characters"
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Ionicons name="add" size={22} color={C.bg} />
        </TouchableOpacity>
      </View>

      {symbols.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="git-compare-outline" size={48} color={C.textMuted} />
          <Text style={styles.emptyText}>Add symbols to compare</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsScroll}
        >
          {symbols.map((sym) => (
            <CompareCard
              key={sym}
              symbol={sym}
              onRemove={() => handleRemove(sym)}
              batchData={batchCompare?.[sym]}
            />
          ))}
        </ScrollView>
      )}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
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
  cardsScroll: { padding: 16, gap: 14 },
  compareCard: {
    width: 200,
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardSymbol: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  cardLoader: { marginVertical: 30 },
  cardPrice: { fontSize: 24, fontWeight: '700', color: C.textPrimary },
  cardChange: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 14,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  indLabel: { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  indValue: { fontSize: 15, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14, color: C.textMuted, marginTop: 12 },
});
