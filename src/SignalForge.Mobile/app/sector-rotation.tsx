import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

function Bar({ value, max }: { value: number; max: number }) {
  const isPositive = value >= 0;
  const widthPercent = Math.min(100, Math.abs(value) / Math.max(0.01, max) * 100);
  return (
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          {
            width: `${widthPercent}%`,
            backgroundColor: isPositive ? COLORS.accent : COLORS.danger,
          },
        ]}
      />
    </View>
  );
}

export default function SectorRotationScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: sectors = [], isLoading, refetch } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => marketApi.getSectors(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const { rotateInto, rotateOut, maxAbs } = useMemo(() => {
    if (sectors.length === 0) return { rotateInto: [], rotateOut: [], maxAbs: 1 };
    const sorted = [...sectors].sort((a: any, b: any) => b.changePercent - a.changePercent);
    return {
      rotateInto: sorted.slice(0, 2).map((s: any) => s.name),
      rotateOut: sorted.slice(-2).map((s: any) => s.name),
      maxAbs: Math.max(...sectors.map((s: any) => Math.abs(s.changePercent)), 1),
    };
  }, [sectors]);

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
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 48 }} />
        ) : (
          <>
            {/* AI Recommendations */}
            <View style={styles.recommendRow}>
              <View style={[styles.recommendCard, styles.rotateIn]}>
                <Ionicons name="arrow-up-circle" size={24} color={COLORS.accent} />
                <Text style={styles.recommendTitle}>Rotate Into</Text>
                {rotateInto.map((s: string) => (
                  <Text key={s} style={styles.recommendItem}>{s}</Text>
                ))}
              </View>
              <View style={[styles.recommendCard, styles.rotateOut]}>
                <Ionicons name="arrow-down-circle" size={24} color={COLORS.danger} />
                <Text style={styles.recommendTitle}>Rotate Out Of</Text>
                {rotateOut.map((s: string) => (
                  <Text key={s} style={styles.recommendItem}>{s}</Text>
                ))}
              </View>
            </View>

            <Text style={styles.sectionTitle}>Sector Performance</Text>
            {sectors.map((s: any) => {
              const pct = s.changePercent ?? 0;
              return (
                <View key={s.name} style={styles.sectorCard}>
                  <Text style={styles.sectorName}>{s.name}</Text>
                  <View style={styles.barsRow}>
                    <View style={styles.barBlock}>
                      <Text style={styles.barLabel}>Current</Text>
                      <Bar value={pct} max={maxAbs} />
                      <Text
                        style={[
                          styles.barValue,
                          { color: pct >= 0 ? COLORS.accent : COLORS.danger },
                        ]}
                      >
                        {pct >= 0 ? '+' : ''}
                        {pct.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  recommendRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  recommendCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  rotateIn: {
    backgroundColor: COLORS.accent + '12',
    borderColor: COLORS.accent + '44',
  },
  rotateOut: {
    backgroundColor: COLORS.danger + '12',
    borderColor: COLORS.danger + '44',
  },
  recommendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 8,
    marginBottom: 6,
  },
  recommendItem: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  sectorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  sectorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  barsRow: { flexDirection: 'row', gap: 16 },
  barBlock: { flex: 1 },
  barLabel: { fontSize: 10, color: COLORS.textMuted, marginBottom: 4 },
  barTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: { height: '100%', borderRadius: 3 },
  barValue: { fontSize: 12, fontWeight: '600' },
});
