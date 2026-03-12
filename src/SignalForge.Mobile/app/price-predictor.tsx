import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/api/client';
import { useAssetModeStore } from '../src/stores/assetModeStore';
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

type Prediction = {
  period: string;
  days: number;
  predictedPrice: number;
  changePercent: number;
  confidence: number;
  direction: string;
};

type PredictionResult = {
  symbol: string;
  currentPrice: number;
  predictions: Prediction[];
  factors: any[];
  summary?: string;
};

const DIRECTION_CONFIG = {
  up: { icon: 'trending-up' as const, color: C.accent },
  down: { icon: 'trending-down' as const, color: C.danger },
  neutral: { icon: 'remove-outline' as const, color: C.warning },
};

export default function PricePredictorScreen() {
  const C = useTheme();
  const [symbol, setSymbol] = useState('');
  const { mode } = useAssetModeStore();

  const { mutate, data, isPending, reset } = useMutation({
    mutationFn: async (sym: string): Promise<PredictionResult> => {
      const upper = sym.toUpperCase().trim();
      const endpoint = mode === 'crypto' ? `/crypto/predict/${upper}` : `/ai/predict/${upper}`;
      const res = await api.get(endpoint);
      const raw = res.data;
      const predictions = (raw.predictions ?? []).map((p: any) => ({
        period: p.period ?? p.horizon ?? '',
        days: p.days ?? (parseInt(p.horizon) || 0),
        predictedPrice: p.predictedPrice ?? p.price ?? 0,
        changePercent: p.changePercent ?? p.change ?? 0,
        confidence: p.confidence ?? 50,
        direction: (p.direction ?? 'neutral').toLowerCase().includes('bull') || (p.direction ?? '').toLowerCase() === 'up' ? 'up' : (p.direction ?? 'neutral').toLowerCase().includes('bear') || (p.direction ?? '').toLowerCase() === 'down' ? 'down' : 'neutral',
      }));
      const factors = Array.isArray(raw.factors) ? raw.factors.map((f: any) => typeof f === 'string' ? f : f.name ?? JSON.stringify(f)) : [];
      return { symbol: raw.symbol ?? upper, currentPrice: raw.currentPrice ?? 0, predictions, factors, summary: raw.summary } as PredictionResult;
    },
  });

  const handlePredict = () => {
    if (!symbol.trim()) return;
    mutate(symbol);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Ionicons name="search-outline" size={18} color={C.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Enter symbol (e.g. AAPL)"
              placeholderTextColor={C.textMuted}
              value={symbol}
              onChangeText={(t) => { setSymbol(t); reset(); }}
              autoCapitalize="characters"
              returnKeyType="go"
              onSubmitEditing={handlePredict}
            />
          </View>
          <TouchableOpacity
            style={[styles.predictBtn, (!symbol.trim() || isPending) && styles.btnDisabled]}
            onPress={handlePredict}
            disabled={!symbol.trim() || isPending}
          >
            {isPending ? (
              <ActivityIndicator color={C.bg} size="small" />
            ) : (
              <Text style={styles.predictBtnText}>Predict</Text>
            )}
          </TouchableOpacity>
        </View>

        {data && (
          <>
            <View style={styles.headerCard}>
              <Text style={styles.headerSymbol}>{data.symbol}</Text>
              <Text style={styles.headerPrice}>${(data.currentPrice ?? 0).toFixed(2)}</Text>
              <Text style={styles.headerLabel}>Current Price</Text>
            </View>

            {(data.predictions ?? []).map((p) => {
              const dir = DIRECTION_CONFIG[p.direction] ?? DIRECTION_CONFIG.neutral;
              const isPositive = (p.changePercent ?? 0) >= 0;
              return (
                <View key={p.period ?? p.days} style={styles.predCard}>
                  <View style={styles.predHeader}>
                    <Text style={styles.predPeriod}>{p.period || `${p.days} Days`}</Text>
                    <View style={[styles.dirBadge, { backgroundColor: dir.color + '22' }]}>
                      <Ionicons name={dir.icon} size={14} color={dir.color} />
                      <Text style={[styles.dirText, { color: dir.color }]}>
                        {(p.direction ?? 'neutral').charAt(0).toUpperCase() + (p.direction ?? 'neutral').slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.predBody}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.predLabel}>Predicted Price</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons
                          name={isPositive ? 'trending-up' : 'trending-down'}
                          size={20}
                          color={isPositive ? C.accent : C.danger}
                        />
                        <Text style={[styles.predPrice, { color: isPositive ? C.accent : C.danger }]}>
                          ${(p.predictedPrice ?? 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.predLabel}>Change</Text>
                      <Text style={[styles.predChange, { color: isPositive ? C.accent : C.danger }]}>
                        {isPositive ? '+' : ''}{(p.changePercent ?? 0).toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.confRow}>
                    <Text style={styles.confLabel}>Confidence</Text>
                    <View style={styles.confBarBg}>
                      <View
                        style={[
                          styles.confBarFill,
                          {
                            width: `${Math.min(p.confidence ?? 0, 100)}%`,
                            backgroundColor: (p.confidence ?? 0) >= 70 ? C.accent : (p.confidence ?? 0) >= 40 ? C.warning : C.danger,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.confValue}>{p.confidence ?? 0}%</Text>
                  </View>
                </View>
              );
            })}

            {data.factors && data.factors.length > 0 && (
              <View style={styles.factorsCard}>
                <Text style={styles.factorsTitle}>Key Factors</Text>
                {(data.factors ?? []).map((f, i) => (
                  <View key={i} style={styles.factorRow}>
                    <Ionicons name="ellipse" size={6} color={C.purple} />
                    <Text style={styles.factorText}>{f}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {!data && !isPending && (
          <View style={styles.placeholder}>
            <Ionicons name="analytics-outline" size={64} color={C.border} />
            <Text style={styles.placeholderText}>
              {mode === 'crypto'
                ? 'Enter a crypto symbol to get AI price predictions'
                : 'Enter a stock symbol to get AI price predictions'}
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
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: { flex: 1, height: 48, color: C.textPrimary, fontSize: 15, fontWeight: '600' },
  predictBtn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  predictBtnText: { color: C.bg, fontSize: 15, fontWeight: '700' },
  headerCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  headerSymbol: { fontSize: 20, fontWeight: '700', color: C.accent, marginBottom: 4 },
  headerPrice: { fontSize: 28, fontWeight: '700', color: C.textPrimary },
  headerLabel: { fontSize: 12, color: C.textMuted, marginTop: 4 },
  predCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  predHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  predPeriod: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  dirBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dirText: { fontSize: 12, fontWeight: '700' },
  predBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  predLabel: { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  predPrice: { fontSize: 22, fontWeight: '700', color: C.textPrimary },
  predChange: { fontSize: 18, fontWeight: '700' },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confLabel: { fontSize: 11, color: C.textMuted, width: 70 },
  confBarBg: { flex: 1, height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  confBarFill: { height: 6, borderRadius: 3 },
  confValue: { fontSize: 12, fontWeight: '600', color: C.textPrimary, width: 36, textAlign: 'right' },
  factorsCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginTop: 4,
  },
  factorsTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  factorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  factorText: { fontSize: 13, color: C.textMuted, flex: 1, lineHeight: 18 },
  placeholder: { alignItems: 'center', paddingTop: 80 },
  placeholderText: { fontSize: 14, color: C.textMuted, marginTop: 16, textAlign: 'center' },
});
