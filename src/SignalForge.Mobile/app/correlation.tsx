import { ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketApi } from '../src/api/stocks';
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

function getCellColor(val: number): string {
  if (val === 1.0) return C.purple + '40';
  if (val >= 0.7) return C.accent + '35';
  if (val >= 0.4) return C.accent + '18';
  if (val >= 0.0) return C.surface;
  if (val >= -0.3) return C.danger + '18';
  return C.danger + '35';
}

function getTextColor(val: number): string {
  if (val === 1.0) return C.purple;
  if (val >= 0.7) return C.accent;
  if (val >= 0.4) return C.textPrimary;
  if (val >= 0.0) return C.textMuted;
  return C.danger;
}

export default function CorrelationScreen() {
  const C = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['correlation'],
    queryFn: () => marketApi.getCorrelation(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const symbols: string[] = data?.symbols ?? [];
  const correlation: number[][] = data?.matrix ?? [];

  const cellSize = 52;
  const labelWidth = 56;

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FF94" />
        }
      >
        <View style={s.header}>
          <Ionicons name="grid-outline" size={22} color={C.purple} />
          <Text style={s.title}>Correlation Matrix</Text>
        </View>
        <Text style={s.subtitle}>
          30-day price correlation between major tech stocks
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFB02018', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FFB02040' }}>
          <Ionicons name="information-circle" size={16} color="#FFB020" />
          <Text style={{ fontSize: 12, color: '#FFB020', fontWeight: '600', flex: 1 }}>Demo Data — Illustrative only, not real market data</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={C.purple} style={{ marginTop: 48 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Column headers */}
              <View style={{ flexDirection: 'row', marginLeft: labelWidth }}>
                {symbols.map((sym) => (
                  <View key={sym} style={[s.colHeader, { width: cellSize }]}>
                    <Text style={s.headerText}>{sym}</Text>
                  </View>
                ))}
              </View>

              {/* Matrix rows */}
              {symbols.map((rowSym, ri) => (
                <View key={rowSym} style={{ flexDirection: 'row' }}>
                  <View style={[s.rowLabel, { width: labelWidth }]}>
                    <Text style={s.rowLabelText}>{rowSym}</Text>
                  </View>
                  {(correlation[ri] ?? []).map((val: number, ci: number) => (
                    <View
                      key={`${ri}-${ci}`}
                      style={[
                        s.cell,
                        {
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: getCellColor(val),
                        },
                      ]}
                    >
                      <Text style={[s.cellText, { color: getTextColor(val) }]}>
                        {val.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Legend */}
        <View style={s.legendCard}>
          <Text style={s.legendTitle}>Legend</Text>
          <View style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: C.accent }]} />
            <Text style={s.legendText}>Strong positive (&ge; 0.7)</Text>
          </View>
          <View style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: C.accent + '60' }]} />
            <Text style={s.legendText}>Moderate positive (0.4 - 0.7)</Text>
          </View>
          <View style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: C.textMuted }]} />
            <Text style={s.legendText}>Weak (0 - 0.4)</Text>
          </View>
          <View style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: C.danger }]} />
            <Text style={s.legendText}>Negative (&lt; 0)</Text>
          </View>
          <View style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: C.purple }]} />
            <Text style={s.legendText}>Self-correlation (1.0)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: C.textPrimary },
  subtitle: { fontSize: 13, color: C.textMuted, marginBottom: 20 },
  colHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  headerText: { fontSize: 10, fontWeight: '700', color: C.info },
  rowLabel: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  rowLabelText: { fontSize: 10, fontWeight: '700', color: C.info },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 4,
    margin: 1,
  },
  cellText: { fontSize: 11, fontWeight: '700' },
  legendCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginTop: 20,
    gap: 10,
  },
  legendTitle: { fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 14, height: 14, borderRadius: 4 },
  legendText: { fontSize: 13, color: C.textMuted },
});
