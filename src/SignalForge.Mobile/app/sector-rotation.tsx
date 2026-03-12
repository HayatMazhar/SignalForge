import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

const SECTORS = [
  { name: 'Technology', w1: 2.1, m1: 5.2, m3: 12.4 },
  { name: 'Healthcare', w1: -0.5, m1: 1.8, m3: 4.2 },
  { name: 'Financials', w1: 1.2, m1: 3.1, m3: 8.9 },
  { name: 'Consumer Disc', w1: -1.4, m1: 0.3, m3: 2.1 },
  { name: 'Industrials', w1: 0.8, m1: 2.5, m3: 6.7 },
  { name: 'Energy', w1: 3.2, m1: 6.8, m3: 15.2 },
  { name: 'Utilities', w1: -0.2, m1: 1.1, m3: 3.5 },
];

const ROTATE_INTO = ['Energy', 'Technology'];
const ROTATE_OUT = ['Consumer Disc'];

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
  const maxAbs = Math.max(
    ...SECTORS.flatMap((s) => [Math.abs(s.w1), Math.abs(s.m1), Math.abs(s.m3)]),
    1
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Recommendations */}
        <View style={styles.recommendRow}>
          <View style={[styles.recommendCard, styles.rotateIn]}>
            <Ionicons name="arrow-up-circle" size={24} color={COLORS.accent} />
            <Text style={styles.recommendTitle}>Rotate Into</Text>
            {ROTATE_INTO.map((s) => (
              <Text key={s} style={styles.recommendItem}>{s}</Text>
            ))}
          </View>
          <View style={[styles.recommendCard, styles.rotateOut]}>
            <Ionicons name="arrow-down-circle" size={24} color={COLORS.danger} />
            <Text style={styles.recommendTitle}>Rotate Out Of</Text>
            {ROTATE_OUT.map((s) => (
              <Text key={s} style={styles.recommendItem}>{s}</Text>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Sector Performance</Text>
        {SECTORS.map((s) => (
          <View key={s.name} style={styles.sectorCard}>
            <Text style={styles.sectorName}>{s.name}</Text>
            <View style={styles.barsRow}>
              <View style={styles.barBlock}>
                <Text style={styles.barLabel}>1W</Text>
                <Bar value={s.w1} max={maxAbs} />
                <Text
                  style={[
                    styles.barValue,
                    { color: s.w1 >= 0 ? COLORS.accent : COLORS.danger },
                  ]}
                >
                  {s.w1 >= 0 ? '+' : ''}
                  {s.w1.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.barBlock}>
                <Text style={styles.barLabel}>1M</Text>
                <Bar value={s.m1} max={maxAbs} />
                <Text
                  style={[
                    styles.barValue,
                    { color: s.m1 >= 0 ? COLORS.accent : COLORS.danger },
                  ]}
                >
                  {s.m1 >= 0 ? '+' : ''}
                  {s.m1.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.barBlock}>
                <Text style={styles.barLabel}>3M</Text>
                <Bar value={s.m3} max={maxAbs} />
                <Text
                  style={[
                    styles.barValue,
                    { color: s.m3 >= 0 ? COLORS.accent : COLORS.danger },
                  ]}
                >
                  {s.m3 >= 0 ? '+' : ''}
                  {s.m3.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        ))}
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
