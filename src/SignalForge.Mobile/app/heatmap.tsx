import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

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

const STOCKS = [
  { symbol: 'AAPL', changePercent: 2.3, marketCap: 3e12 },
  { symbol: 'MSFT', changePercent: -0.8, marketCap: 2.8e12 },
  { symbol: 'GOOGL', changePercent: 1.5, marketCap: 2e12 },
  { symbol: 'AMZN', changePercent: -1.2, marketCap: 1.9e12 },
  { symbol: 'NVDA', changePercent: 4.1, marketCap: 1.8e12 },
  { symbol: 'META', changePercent: 0.9, marketCap: 1.2e12 },
  { symbol: 'TSLA', changePercent: -3.5, marketCap: 800e9 },
  { symbol: 'BRK.B', changePercent: 0.4, marketCap: 880e9 },
  { symbol: 'JPM', changePercent: 1.8, marketCap: 520e9 },
  { symbol: 'V', changePercent: -0.5, marketCap: 580e9 },
  { symbol: 'JNJ', changePercent: 0.2, marketCap: 450e9 },
  { symbol: 'WMT', changePercent: 1.1, marketCap: 480e9 },
  { symbol: 'PG', changePercent: -0.3, marketCap: 380e9 },
  { symbol: 'MA', changePercent: 2.0, marketCap: 420e9 },
  { symbol: 'HD', changePercent: -1.4, marketCap: 360e9 },
  { symbol: 'DIS', changePercent: 3.2, marketCap: 220e9 },
  { symbol: 'PYPL', changePercent: -2.1, marketCap: 90e9 },
  { symbol: 'NFLX', changePercent: 1.7, marketCap: 280e9 },
  { symbol: 'ADBE', changePercent: -0.6, marketCap: 240e9 },
  { symbol: 'CRM', changePercent: 0.8, marketCap: 260e9 },
];

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - 48) / 5;
const MIN_SIZE = 44;
const MAX_SIZE = 80;

function getCellSize(marketCap: number) {
  const minCap = 50e9;
  const maxCap = 3e12;
  const ratio = Math.log(marketCap) / Math.log(maxCap);
  return Math.max(MIN_SIZE, Math.min(MAX_SIZE, MIN_SIZE + ratio * (MAX_SIZE - MIN_SIZE)));
}

export default function HeatmapScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.accent }]} />
            <Text style={styles.legendText}>Up</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.legendText}>Down</Text>
          </View>
          <Text style={styles.legendHint}>Size = market cap</Text>
        </View>

        <View style={styles.grid}>
          {STOCKS.map((s) => {
            const isPositive = s.changePercent >= 0;
            const size = getCellSize(s.marketCap);
            return (
              <TouchableOpacity
                key={s.symbol}
                style={[
                  styles.cell,
                  {
                    width: size,
                    height: size,
                    backgroundColor: isPositive
                      ? COLORS.accent + '44'
                      : COLORS.danger + '44',
                    borderColor: isPositive ? COLORS.accent : COLORS.danger,
                  },
                ]}
                onPress={() => router.push(`/stocks/${s.symbol}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.cellSymbol}>{s.symbol}</Text>
                <Text
                  style={[
                    styles.cellPercent,
                    { color: isPositive ? COLORS.accent : COLORS.danger },
                  ]}
                >
                  {s.changePercent >= 0 ? '+' : ''}
                  {s.changePercent.toFixed(1)}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: COLORS.textMuted },
  legendHint: { fontSize: 11, color: COLORS.textMuted, marginLeft: 'auto' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  cell: {
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  cellSymbol: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cellPercent: {
    fontSize: 10,
    fontWeight: '600',
  },
});
