import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/api/client';

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

interface DataPoint {
  date: string;
  score: number;
  label: string;
  articlesCount: number;
}

interface SentimentResponse {
  symbol: string;
  averageScore: number;
  trend: string;
  totalArticles: number;
  dataPoints: DataPoint[];
}

export default function SentimentTrendScreen() {
  const [input, setInput] = useState('');
  const [symbol, setSymbol] = useState('');

  const { data, isLoading, isError } = useQuery<SentimentResponse>({
    queryKey: ['sentiment-trend', symbol],
    queryFn: () => api.get(`/ai/sentiment-trend/${symbol}`).then((r) => r.data),
    enabled: symbol.length > 0,
  });

  const handleAnalyze = () => {
    const trimmed = input.trim().toUpperCase();
    if (trimmed) setSymbol(trimmed);
  };

  const scoreColor = (score: number) => (score >= 0 ? C.accent : C.danger);

  const labelColor = (label: string) => {
    const l = label.toLowerCase();
    if (l === 'bullish') return C.accent;
    if (l === 'bearish') return C.danger;
    if (l === 'neutral') return C.warning;
    return C.textMuted;
  };

  const trendIcon = (trend: string): keyof typeof Ionicons.glyphMap => {
    const t = trend.toLowerCase();
    if (t === 'up' || t === 'improving') return 'trending-up';
    if (t === 'down' || t === 'declining') return 'trending-down';
    return 'remove-outline';
  };

  const renderDataPoint = ({ item }: { item: DataPoint }) => (
    <View style={s.pointCard}>
      <View style={s.pointHeader}>
        <Text style={s.pointDate}>{new Date(item.date).toLocaleDateString()}</Text>
        <View style={[s.labelBadge, { backgroundColor: labelColor(item.label) + '20' }]}>
          <Text style={[s.labelText, { color: labelColor(item.label) }]}>{item.label}</Text>
        </View>
      </View>
      <View style={s.pointBody}>
        <Text style={[s.pointScore, { color: scoreColor(item.score) }]}>
          {item.score > 0 ? '+' : ''}{item.score.toFixed(2)}
        </Text>
        <View style={s.articlesChip}>
          <Ionicons name="newspaper-outline" size={12} color={C.textMuted} />
          <Text style={s.articlesChipText}>{item.articlesCount}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={s.searchRow}>
        <Ionicons name="analytics-outline" size={20} color={C.textMuted} />
        <TextInput
          style={s.input}
          placeholder="Enter symbol (e.g. AAPL)"
          placeholderTextColor={C.textMuted}
          value={input}
          onChangeText={setInput}
          autoCapitalize="characters"
          autoCorrect={false}
          onSubmitEditing={handleAnalyze}
        />
        <TouchableOpacity style={s.analyzeBtn} onPress={handleAnalyze}>
          <Text style={s.analyzeBtnText}>Analyze</Text>
        </TouchableOpacity>
      </View>

      {!symbol ? (
        <View style={s.empty}>
          <Ionicons name="pulse-outline" size={52} color={C.border} />
          <Text style={s.emptyText}>Enter a symbol to analyze sentiment</Text>
        </View>
      ) : isLoading ? (
        <View style={s.centered}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : isError || !data ? (
        <View style={s.empty}>
          <Ionicons name="alert-circle-outline" size={48} color={C.danger} />
          <Text style={s.emptyText}>Failed to load sentiment for {symbol}</Text>
        </View>
      ) : (
        <FlatList
          data={data.dataPoints}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderDataPoint}
          contentContainerStyle={s.listContent}
          ListHeaderComponent={
            <View style={s.summaryCard}>
              <Text style={s.summarySymbol}>{data.symbol}</Text>
              <Text style={[s.avgScore, { color: scoreColor(data.averageScore) }]}>
                {data.averageScore > 0 ? '+' : ''}{data.averageScore.toFixed(2)}
              </Text>
              <Text style={s.avgLabel}>Average Sentiment Score</Text>
              <View style={s.summaryRow}>
                <View style={[s.trendBadge, { backgroundColor: scoreColor(data.averageScore) + '18' }]}>
                  <Ionicons name={trendIcon(data.trend)} size={16} color={scoreColor(data.averageScore)} />
                  <Text style={[s.trendText, { color: scoreColor(data.averageScore) }]}>
                    {data.trend}
                  </Text>
                </View>
                <View style={s.articlesChip}>
                  <Ionicons name="newspaper-outline" size={14} color={C.info} />
                  <Text style={s.articlesCount}>{data.totalArticles} articles</Text>
                </View>
              </View>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    margin: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  input: { flex: 1, fontSize: 15, color: C.textPrimary, paddingVertical: 4 },
  analyzeBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  analyzeBtnText: { fontSize: 14, fontWeight: '700', color: C.bg },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  summarySymbol: { fontSize: 14, fontWeight: '700', color: C.info, marginBottom: 8 },
  avgScore: { fontSize: 48, fontWeight: '800' },
  avgLabel: { fontSize: 13, color: C.textMuted, marginTop: 4 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  trendText: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  articlesChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  articlesCount: { fontSize: 13, color: C.info, fontWeight: '600' },
  articlesChipText: { fontSize: 12, color: C.textMuted },
  pointCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
  },
  pointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointDate: { fontSize: 13, color: C.textMuted },
  labelBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  labelText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  pointBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointScore: { fontSize: 20, fontWeight: '800' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 15, color: C.textMuted, marginTop: 12, textAlign: 'center' },
});
