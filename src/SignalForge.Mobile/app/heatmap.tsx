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
import { stocksApi } from '../src/api/stocks';
import { useAssetModeStore } from '../src/stores/assetModeStore';
import api from '../src/api/client';
import { useTheme } from '../src/constants/config';

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
const MIN_SIZE = 52;
const MAX_SIZE = 72;

function getCellSize(changePct: number) {
  const absChange = Math.abs(changePct);
  const ratio = Math.min(absChange / 5, 1);
  return MIN_SIZE + ratio * (MAX_SIZE - MIN_SIZE);
}

export default function HeatmapScreen() {
  const COLORS = useTheme();
  const { mode: assetMode } = useAssetModeStore();
  const [refreshing, setRefreshing] = useState(false);
  const { data: stocks = [], isLoading, refetch } = useQuery({
    queryKey: ['heatmap', assetMode],
    queryFn: async () => {
      const movers = assetMode === 'crypto'
        ? await api.get('/crypto/top-movers').then(r => Array.isArray(r.data) ? r.data : [])
        : await stocksApi.getTopMovers();
      return movers.slice(0, 20);
    },
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
          <Text style={styles.legendHint}>Size = change magnitude</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 48 }} />
        ) : (
          <View style={styles.grid}>
            {stocks.map((s: any) => {
              const isPositive = (s.changePercent ?? 0) >= 0;
              const size = getCellSize(s.changePercent ?? 0);
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
                    {(s.changePercent ?? 0) >= 0 ? '+' : ''}
                    {(s.changePercent ?? 0).toFixed(1)}%
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
