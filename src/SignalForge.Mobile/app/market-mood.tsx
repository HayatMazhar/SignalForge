import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import api from '../src/api/client';

const C = {
  bg: '#06060B', surface: '#0C0F1A', accent: '#00FF94', danger: '#FF3B5C',
  textPrimary: '#F0F4F8', textMuted: '#5B6378', border: '#1A1F35',
  warning: '#FFB020', info: '#38BDF8', purple: '#A78BFA',
};

const W = Dimensions.get('window').width;

function MoodGauge({ score }: { score: number }) {
  const size = W - 80;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 20;
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  const angle = startAngle + ((score / 100) * (endAngle - startAngle));
  const needleX = cx + (r - 10) * Math.cos(angle);
  const needleY = cy + (r - 10) * Math.sin(angle);
  const color = score >= 75 ? C.accent : score >= 55 ? '#84CC16' : score >= 45 ? C.warning : score >= 25 ? '#F97316' : C.danger;

  return (
    <Svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={12} strokeLinecap="round"
        strokeDasharray={`${Math.PI * r * 1.5} ${Math.PI * r * 0.5}`}
        rotation={135} origin={`${cx}, ${cy}`} />
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
        strokeDasharray={`${(score / 100) * Math.PI * r * 1.5} ${Math.PI * r * 2}`}
        rotation={135} origin={`${cx}, ${cy}`} opacity={0.8} />
      <Line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={cx} cy={cy} r={6} fill={color} />
    </Svg>
  );
}

export default function MarketMoodScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: fearGreed, isLoading: fgLoading, refetch: refetchFg } = useQuery({
    queryKey: ['market-mood-fg'],
    queryFn: () => api.get('/insights/fear-greed').then(r => r.data),
  });

  const { data: smartMoney, isLoading: smLoading, refetch: refetchSm } = useQuery({
    queryKey: ['market-mood-sm'],
    queryFn: () => api.get('/insights/smart-money').then(r => r.data),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFg(), refetchSm()]);
    setRefreshing(false);
  }, [refetchFg, refetchSm]);

  const score = fearGreed?.score ?? 50;
  const label = fearGreed?.label ?? 'Neutral';
  const color = score >= 75 ? C.accent : score >= 55 ? '#84CC16' : score >= 45 ? C.warning : score >= 25 ? '#F97316' : C.danger;

  const indicators = [
    { name: 'Momentum', value: fearGreed?.momentum ?? 50, icon: 'trending-up' as const },
    { name: 'Breadth', value: fearGreed?.breadth ?? 50, icon: 'analytics' as const },
    { name: 'Put/Call', value: fearGreed?.putCallRatio ?? 50, icon: 'swap-horizontal' as const },
    { name: 'Volatility', value: fearGreed?.volatility ?? 50, icon: 'pulse' as const },
    { name: 'Safe Haven', value: fearGreed?.safeHaven ?? 50, icon: 'shield-checkmark' as const },
    { name: 'Junk Bond', value: fearGreed?.junkBondDemand ?? 50, icon: 'cash' as const },
  ];

  const flows = Array.isArray(smartMoney) ? smartMoney.slice(0, 8) : [];
  const isLoading = fgLoading || smLoading;

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={s.container} edges={['bottom']}>
        <View style={s.centered}><ActivityIndicator color={C.accent} size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}>

        <View style={s.gaugeCard}>
          <View style={{ alignItems: 'center' }}>
            <MoodGauge score={score} />
            <Text style={[s.scoreText, { color }]}>{score}</Text>
            <Text style={[s.labelText, { color }]}>{label}</Text>
          </View>
          <View style={s.scaleRow}>
            <Text style={[s.scaleLabel, { color: C.danger }]}>Extreme Fear</Text>
            <Text style={[s.scaleLabel, { color: C.accent }]}>Extreme Greed</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Sentiment Indicators</Text>
        <View style={s.indicatorGrid}>
          {indicators.map(ind => {
            const c = (ind.value ?? 0) >= 60 ? C.accent : (ind.value ?? 0) <= 40 ? C.danger : C.warning;
            return (
              <View key={ind.name} style={s.indicatorCard}>
                <View style={s.indicatorHeader}>
                  <Ionicons name={ind.icon} size={16} color={c} />
                  <Text style={s.indicatorName}>{ind.name}</Text>
                </View>
                <Text style={[s.indicatorValue, { color: c }]}>{ind.value}</Text>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${ind.value}%`, backgroundColor: c }]} />
                </View>
              </View>
            );
          })}
        </View>

        <Text style={s.sectionTitle}>Smart Money Flow</Text>
        {flows.map((f: any) => {
          const positive = (f.netFlow ?? 0) > 0;
          return (
            <View key={f.symbol} style={s.flowCard}>
              <View style={s.flowHeader}>
                <Text style={s.flowSymbol}>{f.symbol}</Text>
                <Text style={[s.flowSignal, { color: positive ? C.accent : C.danger }]}>
                  {f.signal}
                </Text>
              </View>
              <View style={s.flowRow}>
                <View style={{ flex: 1 }}>
                  <View style={s.flowBarBg}>
                    <View style={[s.flowBarFill, {
                      width: `${Math.min(Math.abs(f.netFlow ?? 0) / 50000000 * 100, 100)}%`,
                      backgroundColor: positive ? C.accent : C.danger,
                    }]} />
                  </View>
                </View>
                <Text style={[s.flowValue, { color: positive ? C.accent : C.danger }]}>
                  {positive ? '+' : ''}{((f.netFlow ?? 0) / 1000000).toFixed(1)}M
                </Text>
              </View>
              <Text style={s.flowDetail}>DP: {f.darkPoolPercent ?? 0}%</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gaugeCard: { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 20, marginBottom: 16, alignItems: 'center' },
  scoreText: { fontSize: 56, fontWeight: '900', marginTop: -20 },
  labelText: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 16 },
  scaleLabel: { fontSize: 11, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 12, marginTop: 8 },
  indicatorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  indicatorCard: { width: '48%', backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14 },
  indicatorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  indicatorName: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  indicatorValue: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  barBg: { height: 4, backgroundColor: C.border, borderRadius: 2 },
  barFill: { height: 4, borderRadius: 2 },
  flowCard: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 8 },
  flowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  flowSymbol: { fontSize: 16, fontWeight: '700', color: C.accent },
  flowSignal: { fontSize: 11, fontWeight: '700' },
  flowRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  flowBarBg: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  flowBarFill: { height: 6, borderRadius: 3 },
  flowValue: { fontSize: 14, fontWeight: '700', width: 65, textAlign: 'right' },
  flowDetail: { fontSize: 11, color: C.textMuted },
});
