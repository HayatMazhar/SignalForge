import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { marketApi } from '../src/api/stocks';

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
  const [refreshing, setRefreshing] = useState(false);
  const { data: stocks = [], isLoading, refetch } = useQuery({
    queryKey: ['heatmap'],
    queryFn: () => marketApi.getHeatmap(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FF94" />
        }
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

        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 48 }} />
        ) : (
          <View style={styles.grid}>
            {stocks.map((s: any) => {
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
        )}
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
