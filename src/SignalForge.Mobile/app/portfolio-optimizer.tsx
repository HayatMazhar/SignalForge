import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
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

type Suggestion = {
  symbol: string;
  action: 'Reduce' | 'Add' | 'Hold';
  currentWeight: number;
  targetWeight: number;
  reason: string;
};

type OptimizationResult = {
  totalValue: number;
  health: string;
  diversification: string;
  suggestions: Suggestion[];
};

const ACTION_COLORS: Record<string, string> = {
  Reduce: C.danger,
  Add: C.accent,
  Hold: C.info,
};

const ACTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Reduce: 'remove-circle-outline',
  Add: 'add-circle-outline',
  Hold: 'pause-circle-outline',
};

export default function PortfolioOptimizerScreen() {
  const { mutate, data, isPending, reset } = useMutation({
    mutationFn: async () => {
      const res = await api.post('/ai/optimize-portfolio');
      return res.data as OptimizationResult;
    },
  });

  const renderSuggestion = ({ item }: { item: Suggestion }) => {
    const color = ACTION_COLORS[item.action] ?? C.textMuted;
    const icon = ACTION_ICONS[item.action] ?? 'ellipse-outline';
    return (
      <View style={styles.sugCard}>
        <View style={styles.sugHeader}>
          <Text style={styles.sugSymbol}>{item.symbol}</Text>
          <View style={[styles.actionBadge, { backgroundColor: color + '22' }]}>
            <Ionicons name={icon} size={14} color={color} />
            <Text style={[styles.actionText, { color }]}>{item.action}</Text>
          </View>
        </View>
        <View style={styles.weightRow}>
          <View style={styles.weightCell}>
            <Text style={styles.weightLabel}>Current</Text>
            <Text style={styles.weightValue}>{item.currentWeight.toFixed(1)}%</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={C.textMuted} />
          <View style={styles.weightCell}>
            <Text style={styles.weightLabel}>Target</Text>
            <Text style={[styles.weightValue, { color: C.accent }]}>
              {item.targetWeight.toFixed(1)}%
            </Text>
          </View>
        </View>
        <Text style={styles.reason}>{item.reason}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={[styles.analyzeBtn, isPending && styles.btnDisabled]}
          onPress={() => mutate()}
          disabled={isPending}
          activeOpacity={0.7}
        >
          {isPending ? (
            <ActivityIndicator color={C.bg} size="small" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color={C.bg} />
              <Text style={styles.analyzeBtnText}>Analyze Portfolio</Text>
            </>
          )}
        </TouchableOpacity>

        {data && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Portfolio Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCell}>
                  <Text style={styles.summaryLabel}>Total Value</Text>
                  <Text style={styles.summaryValue}>
                    ${data.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Text>
                </View>
                <View style={styles.summaryCell}>
                  <Text style={styles.summaryLabel}>Health</Text>
                  <Text style={[styles.summaryValue, { color: C.accent }]}>{data.health}</Text>
                </View>
                <View style={[styles.summaryCell, { width: '100%' }]}>
                  <Text style={styles.summaryLabel}>Diversification</Text>
                  <Text style={[styles.summaryValue, { color: C.info }]}>{data.diversification}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Suggestions</Text>
            {data.suggestions.map((s, i) => (
              <View key={`${s.symbol}-${i}`}>
                {renderSuggestion({ item: s })}
              </View>
            ))}
          </>
        )}

        {!data && !isPending && (
          <View style={styles.placeholder}>
            <Ionicons name="pie-chart-outline" size={64} color={C.border} />
            <Text style={styles.placeholderText}>
              Tap Analyze to get AI-powered portfolio optimization suggestions
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  analyzeBtn: {
    flexDirection: 'row',
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  btnDisabled: { opacity: 0.5 },
  analyzeBtnText: { color: C.bg, fontSize: 16, fontWeight: '700' },
  summaryCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCell: {
    width: '47%',
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 12,
  },
  summaryLabel: { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  sugCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  sugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sugSymbol: { fontSize: 18, fontWeight: '700', color: C.accent },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionText: { fontSize: 12, fontWeight: '700' },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  weightCell: { alignItems: 'center' },
  weightLabel: { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  weightValue: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  reason: { fontSize: 13, color: C.textMuted, lineHeight: 18 },
  placeholder: { alignItems: 'center', paddingTop: 80 },
  placeholderText: { fontSize: 14, color: C.textMuted, marginTop: 16, textAlign: 'center', lineHeight: 20 },
});
