import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

type Anomaly = {
  id?: string;
  symbol?: string;
  severity?: string;
  description?: string;
  riskLevel?: string;
};

type AnomaliesResponse = {
  symbol?: string;
  riskLevel?: string;
  anomalies?: Anomaly[];
};

export default function AnomalyDetectorScreen() {
  const COLORS = useTheme();
  const [symbol, setSymbol] = useState('');
  const [scanSymbol, setScanSymbol] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [scanTime, setScanTime] = useState<Date | null>(null);
  const HISTORY_KEY = 'sf-anomaly-history';

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then(raw => {
      if (raw) setScanHistory(JSON.parse(raw));
    }).catch(() => {});
  }, []);

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['ai', 'anomalies', scanSymbol],
    queryFn: async () => {
      const { data: res } = await api.get<AnomaliesResponse>(
        `/ai/anomalies/${encodeURIComponent(scanSymbol!)}`
      );
      return res;
    },
    enabled: !!scanSymbol,
  });

  const handleScan = () => {
    const s = symbol.trim().toUpperCase();
    if (!s) {
      Alert.alert('Enter Symbol', 'Please enter a stock symbol to scan.');
      return;
    }
    setScanSymbol(s);
    setScanTime(new Date());
    const newHistory = [s, ...scanHistory.filter(h => h !== s)].slice(0, 5);
    setScanHistory(newHistory);
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory)).catch(() => {});
  };

  const anomalies = data?.anomalies ?? [];
  const riskLevel = data?.riskLevel ?? 'unknown';

  const getRiskColor = (level: string) => {
    const l = level?.toLowerCase() ?? '';
    if (l.includes('high') || l.includes('critical')) return COLORS.danger;
    if (l.includes('medium')) return COLORS.warning;
    return COLORS.accent;
  };

  const getSeverityColor = (sev: string) => {
    const s = sev?.toLowerCase() ?? '';
    if (s.includes('high') || s.includes('critical')) return COLORS.danger;
    if (s.includes('medium')) return COLORS.warning;
    return COLORS.info;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Symbol (e.g. AAPL)"
          placeholderTextColor={COLORS.textMuted}
          value={symbol}
          onChangeText={setSymbol}
          autoCapitalize="characters"
          onSubmitEditing={handleScan}
        />
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={handleScan}
          disabled={isFetching || !symbol.trim()}
          activeOpacity={0.7}
        >
          {isFetching ? (
            <ActivityIndicator color={COLORS.bg} size="small" />
          ) : (
            <>
              <Ionicons name="search" size={18} color={COLORS.bg} />
              <Text style={styles.scanBtnText}>Scan</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {scanHistory.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>Recent Scans</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {scanHistory.map(h => (
              <TouchableOpacity key={h} onPress={() => setSymbol(h)}
                style={{ backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border }}>
                <Text style={{ fontSize: 12, color: COLORS.textPrimary, fontWeight: '600' }}>{h}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {scanSymbol && !isLoading && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} tintColor={COLORS.accent} />
          }
        >
          {data && (
            <>
              {scanTime && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
                  <Text style={{ fontSize: 11, color: COLORS.textMuted }}>
                    Scanned at {scanTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </Text>
                </View>
              )}
              <View style={styles.riskCard}>
                <Text style={styles.riskLabel}>Overall Risk</Text>
                <View
                  style={[
                    styles.riskBadge,
                    { backgroundColor: getRiskColor(riskLevel) + '22' },
                  ]}
                >
                  <Text
                    style={[styles.riskBadgeText, { color: getRiskColor(riskLevel) }]}
                  >
                    {riskLevel}
                  </Text>
                </View>
                <Text style={styles.symbolLabel}>{scanSymbol}</Text>
              </View>

              <Text style={styles.sectionTitle}>Anomalies</Text>
              {anomalies.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="checkmark-circle" size={40} color={COLORS.accent} />
                  <Text style={styles.emptyText}>No anomalies detected</Text>
                </View>
              ) : (
                anomalies.map((a, i) => (
                  <View key={a.id ?? i} style={styles.anomalyCard}>
                    <View style={styles.anomalyHeader}>
                      <View
                        style={[
                          styles.severityBadge,
                          {
                            backgroundColor:
                              getSeverityColor(a.severity ?? '') + '22',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.severityText,
                            { color: getSeverityColor(a.severity ?? '') },
                          ]}
                        >
                          {a.severity ?? 'Info'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.anomalyDesc}>
                      {a.description ?? 'No description'}
                    </Text>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      )}

      {scanSymbol && isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.accent} size="large" />
          <Text style={styles.loadingText}>Scanning {scanSymbol}...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 90,
  },
  scanBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  riskCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  riskLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8 },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  riskBadgeText: { fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  symbolLabel: { fontSize: 14, color: COLORS.textMuted },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 12 },
  anomalyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  anomalyHeader: { flexDirection: 'row', marginBottom: 8 },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  severityText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  anomalyDesc: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textMuted },
});
