import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { backtestApi } from '../src/api/stocks';
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

const DEFAULT_STRATEGIES = ['SMA Crossover', 'RSI Mean Reversion', 'MACD Momentum', 'Bollinger Bands'];

interface BacktestResult {
  returnPercent: number;
  winRate: number;
  totalTrades: number;
  sharpeRatio: number;
  maxDrawdown?: number;
  trades?: {
    id?: string;
    symbol: string;
    side: string;
    entryPrice: number;
    exitPrice: number;
    returnPercent: number;
    entryDate?: string;
    exitDate?: string;
  }[];
}

export default function BacktestScreen() {
  const C = useTheme();
  const [symbol, setSymbol] = useState('AAPL');
  const [strategy, setStrategy] = useState('SMA Crossover');
  const [capital, setCapital] = useState('10000');
  const [days, setDays] = useState('90');

  const { data: strategies } = useQuery({
    queryKey: ['backtestStrategies'],
    queryFn: () => backtestApi.getStrategies() as Promise<string[]>,
  });

  const strategyList = strategies?.length ? strategies : DEFAULT_STRATEGIES;

  const runMutation = useMutation({
    mutationFn: () =>
      backtestApi.run({
        symbol: symbol.toUpperCase(),
        strategy,
        capital: parseFloat(capital),
        days: parseInt(days, 10),
      }) as Promise<BacktestResult>,
  });

  const result = runMutation.data;
  const isPositiveReturn = (result?.returnPercent ?? 0) >= 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['bottom']}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Configure Backtest</Text>

        <Text style={styles.label}>Symbol</Text>
        <TextInput
          style={styles.input}
          value={symbol}
          onChangeText={setSymbol}
          placeholder="e.g. AAPL"
          placeholderTextColor={C.textMuted}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Strategy</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strategyRow}
        >
          {strategyList.map((s: any) => {
            const name = typeof s === 'string' ? s : s.name ?? s;
            return (
              <TouchableOpacity
                key={name}
                style={[
                  styles.strategyChip,
                  strategy === name && styles.strategyChipActive,
                ]}
                onPress={() => setStrategy(name)}
              >
                <Text
                  style={[
                    styles.strategyChipText,
                    strategy === name && styles.strategyChipTextActive,
                  ]}
                >
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Capital ($)</Text>
            <TextInput
              style={styles.input}
              value={capital}
              onChangeText={setCapital}
              keyboardType="numeric"
              placeholderTextColor={C.textMuted}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Days</Text>
            <TextInput
              style={styles.input}
              value={days}
              onChangeText={setDays}
              keyboardType="numeric"
              placeholderTextColor={C.textMuted}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.runBtn}
          onPress={() => runMutation.mutate()}
          disabled={runMutation.isPending || !symbol.trim()}
          activeOpacity={0.7}
        >
          {runMutation.isPending ? (
            <ActivityIndicator color={C.bg} size="small" />
          ) : (
            <>
              <Ionicons name="play" size={18} color={C.bg} />
              <Text style={styles.runBtnText}>Run Backtest</Text>
            </>
          )}
        </TouchableOpacity>

        {runMutation.isError && (
          <Text style={styles.errorText}>
            Backtest failed. Check your inputs and try again.
          </Text>
        )}
      </View>

      {/* Results */}
      {result && (
        <>
          <Text style={styles.sectionTitle}>Results</Text>
          <View style={styles.resultGrid}>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Return</Text>
              <Text
                style={[
                  styles.resultValue,
                  { color: isPositiveReturn ? C.accent : C.danger },
                ]}
              >
                {formatPercent(result.returnPercent)}
              </Text>
            </View>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Win Rate</Text>
              <Text style={styles.resultValue}>
                {Math.round(result.winRate * 100)}%
              </Text>
            </View>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Total Trades</Text>
              <Text style={styles.resultValue}>{result.totalTrades}</Text>
            </View>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Sharpe Ratio</Text>
              <Text
                style={[
                  styles.resultValue,
                  {
                    color:
                      result.sharpeRatio >= 1
                        ? C.accent
                        : result.sharpeRatio >= 0
                        ? C.warning
                        : C.danger,
                  },
                ]}
              >
                {result.sharpeRatio.toFixed(2)}
              </Text>
            </View>
          </View>

          {result.maxDrawdown != null && (
            <View style={styles.drawdownCard}>
              <Text style={styles.resultLabel}>Max Drawdown</Text>
              <Text style={[styles.resultValue, { color: C.danger }]}>
                {formatPercent(result.maxDrawdown)}
              </Text>
            </View>
          )}

          {result && result.winRate != null && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: '#00FF94' }}>Wins {Math.round(result.winRate * 100)}%</Text>
                <Text style={{ fontSize: 12, color: '#FF3B5C' }}>Losses {Math.round((1 - result.winRate) * 100)}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: '#1A1F35', borderRadius: 4, overflow: 'hidden', flexDirection: 'row' }}>
                <View style={{ width: `${Math.round(result.winRate * 100)}%`, backgroundColor: '#00FF94', borderRadius: 4 }} />
                <View style={{ flex: 1, backgroundColor: '#FF3B5C33' }} />
              </View>
            </View>
          )}

          {/* Trade list */}
          {result.trades && result.trades.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Trades</Text>
              {result.trades.map((trade, i) => {
                const isWin = trade.returnPercent >= 0;
                return (
                  <View key={trade.id ?? i} style={styles.tradeCard}>
                    <View style={styles.tradeHeader}>
                      <View style={styles.tradeSymbolRow}>
                        <Text style={styles.tradeSymbol}>{trade.symbol}</Text>
                        <View
                          style={[
                            styles.sideBadge,
                            {
                              backgroundColor:
                                trade.side === 'Buy' ? C.accent + '18' : C.danger + '18',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.sideText,
                              {
                                color: trade.side === 'Buy' ? C.accent : C.danger,
                              },
                            ]}
                          >
                            {trade.side}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.tradeReturn,
                          { color: isWin ? C.accent : C.danger },
                        ]}
                      >
                        {formatPercent(trade.returnPercent)}
                      </Text>
                    </View>
                    <View style={styles.tradePrices}>
                      <Text style={styles.tradePrice}>
                        Entry: {formatPrice(trade.entryPrice)}
                      </Text>
                      <Text style={styles.tradePrice}>
                        Exit: {formatPrice(trade.exitPrice)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  formCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 24,
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary, marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: C.textPrimary,
    borderWidth: 1,
    borderColor: C.border,
  },
  strategyRow: { gap: 8, paddingVertical: 4 },
  strategyChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  strategyChipActive: {
    backgroundColor: C.purple + '18',
    borderColor: C.purple,
  },
  strategyChipText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  strategyChipTextActive: { color: C.purple },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.accent,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
  },
  runBtnText: { fontSize: 16, fontWeight: '700', color: C.bg },
  errorText: { fontSize: 13, color: C.danger, textAlign: 'center', marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: C.textPrimary, marginBottom: 12 },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  resultBox: {
    width: '48%',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    alignItems: 'center',
  },
  resultLabel: { fontSize: 12, color: C.textMuted, textTransform: 'uppercase', marginBottom: 6 },
  resultValue: { fontSize: 22, fontWeight: '700', color: C.textPrimary },
  drawdownCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  tradeCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tradeSymbolRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tradeSymbol: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  sideBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sideText: { fontSize: 11, fontWeight: '700' },
  tradeReturn: { fontSize: 16, fontWeight: '700' },
  tradePrices: { flexDirection: 'row', gap: 16 },
  tradePrice: { fontSize: 13, color: C.textMuted },
});
