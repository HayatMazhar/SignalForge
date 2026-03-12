import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { insightsApi } from '../src/api/stocks';
import api from '../src/api/client';
import { useAssetModeStore } from '../src/stores/assetModeStore';
import { useState, useCallback } from 'react';
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

interface FearGreedData {
  score: number;
  label: string;
  previousClose: number;
  indicators: {
    name: string;
    value: number;
    rating: string;
  }[];
}

function getScoreColor(score: number): string {
  if (score <= 25) return C.danger;
  if (score <= 45) return C.warning;
  if (score <= 55) return C.textMuted;
  if (score <= 75) return C.info;
  return C.accent;
}

function getScoreIcon(score: number): keyof typeof Ionicons.glyphMap {
  if (score <= 25) return 'skull-outline';
  if (score <= 45) return 'warning-outline';
  if (score <= 55) return 'remove-outline';
  if (score <= 75) return 'trending-up';
  return 'rocket-outline';
}

const DEFAULT_INDICATORS = [
  { name: 'Market Momentum', key: 'momentum' },
  { name: 'Market Breadth', key: 'breadth' },
  { name: 'Put/Call Ratio', key: 'putcall' },
  { name: 'Volatility (VIX)', key: 'volatility' },
  { name: 'Safe Haven Demand', key: 'safehaven' },
  { name: 'Junk Bond Demand', key: 'junkbond' },
];

export default function InsightsScreen() {
  const C = useTheme();
  const { mode } = useAssetModeStore();
  const isCrypto = mode === 'crypto';
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['fearGreed', mode],
    queryFn: () =>
      isCrypto
        ? api.get('/crypto/fear-greed').then(r => r.data) as Promise<FearGreedData>
        : insightsApi.getFearGreed() as Promise<FearGreedData>,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  const score = data?.score ?? 50;
  const label = data?.label ?? 'Neutral';
  const color = getScoreColor(score);
  const indicators = data?.indicators ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['bottom']}>
      <Stack.Screen options={{ headerTitle: isCrypto ? 'Crypto Insights' : 'AI Insights' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
      >
      {/* Fear & Greed Gauge */}
      <View style={styles.gaugeCard}>
        <Text style={styles.gaugeTitle}>{isCrypto ? 'Crypto Fear & Greed Index' : 'Fear & Greed Index'}</Text>
        <View style={[styles.scoreCircle, { borderColor: color }]}>
          <Ionicons name={getScoreIcon(score)} size={28} color={color} />
          <Text style={[styles.scoreNumber, { color }]}>{Math.round(score)}</Text>
        </View>
        <Text style={[styles.scoreLabel, { color }]}>{label}</Text>

        {/* Gauge bar */}
        <View style={styles.gaugeBar}>
          <View style={styles.gaugeTrack}>
            <View
              style={[
                styles.gaugeFill,
                { width: `${score}%`, backgroundColor: color },
              ]}
            />
            <View
              style={[
                styles.gaugeIndicator,
                { left: `${score}%`, backgroundColor: color },
              ]}
            />
          </View>
          <View style={styles.gaugeLabels}>
            <Text style={[styles.gaugeEndLabel, { color: C.danger }]}>Extreme Fear</Text>
            <Text style={[styles.gaugeEndLabel, { color: C.accent }]}>Extreme Greed</Text>
          </View>
        </View>

        {data?.previousClose != null && (
          <Text style={styles.prevClose}>
            Previous close: {Math.round(data.previousClose)}
          </Text>
        )}
      </View>

      {/* Sub-indicators */}
      <Text style={styles.sectionTitle}>Sub-Indicators</Text>
      {indicators.length > 0
        ? indicators.map((ind, i) => {
            const indColor = getScoreColor(ind.value);
            return (
              <View key={i} style={styles.indicatorCard}>
                <View style={styles.indicatorHeader}>
                  <Text style={styles.indicatorName}>{ind.name}</Text>
                  <Text style={[styles.indicatorRating, { color: indColor }]}>
                    {ind.rating}
                  </Text>
                </View>
                <View style={styles.indicatorBar}>
                  <View style={styles.indicatorTrack}>
                    <View
                      style={[
                        styles.indicatorFill,
                        { width: `${ind.value}%`, backgroundColor: indColor },
                      ]}
                    />
                  </View>
                  <Text style={[styles.indicatorValue, { color: indColor }]}>
                    {Math.round(ind.value)}
                  </Text>
                </View>
              </View>
            );
          })
        : DEFAULT_INDICATORS.map((ind) => (
            <View key={ind.key} style={styles.indicatorCard}>
              <View style={styles.indicatorHeader}>
                <Text style={styles.indicatorName}>{ind.name}</Text>
                <Text style={[styles.indicatorRating, { color: C.textMuted }]}>—</Text>
              </View>
              <View style={styles.indicatorBar}>
                <View style={styles.indicatorTrack}>
                  <View
                    style={[styles.indicatorFill, { width: '0%', backgroundColor: C.textMuted }]}
                  />
                </View>
                <Text style={[styles.indicatorValue, { color: C.textMuted }]}>—</Text>
              </View>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gaugeCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  gaugeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    marginBottom: 12,
  },
  scoreNumber: { fontSize: 36, fontWeight: '800', marginTop: 4 },
  scoreLabel: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  gaugeBar: { width: '100%' },
  gaugeTrack: {
    height: 8,
    backgroundColor: C.bg,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  gaugeFill: { height: '100%', borderRadius: 4 },
  gaugeIndicator: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: C.bg,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  gaugeEndLabel: { fontSize: 10, fontWeight: '600' },
  prevClose: { fontSize: 12, color: C.textMuted, marginTop: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.textPrimary,
    marginBottom: 12,
  },
  indicatorCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 10,
  },
  indicatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  indicatorName: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  indicatorRating: { fontSize: 13, fontWeight: '700' },
  indicatorBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  indicatorTrack: {
    flex: 1,
    height: 6,
    backgroundColor: C.bg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  indicatorFill: { height: '100%', borderRadius: 3 },
  indicatorValue: { fontSize: 14, fontWeight: '700', width: 30, textAlign: 'right' },
});
