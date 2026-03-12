import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { portfolioApi, signalsApi, watchlistApi, alertsApi } from '../src/api/stocks';

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

const EXPORT_CARDS = [
  { id: 'portfolio', name: 'Portfolio', icon: 'wallet-outline' as const, fetcher: () => portfolioApi.get() },
  { id: 'signals', name: 'Signals', icon: 'trending-up-outline' as const, fetcher: () => signalsApi.getSignals(undefined, 100) },
  { id: 'watchlist', name: 'Watchlist', icon: 'eye-outline' as const, fetcher: () => watchlistApi.get() },
  { id: 'alerts', name: 'Alerts', icon: 'notifications-outline' as const, fetcher: () => alertsApi.get() },
];

function normalizeForExport(data: any): Record<string, any>[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Record<string, any>[];
  if (data.positions) return data.positions;
  if (data.symbols) return data.symbols.map((s: string) => ({ symbol: s }));
  return [data as Record<string, any>];
}

function toCSV(data: any, name: string): string {
  const raw = normalizeForExport(data);
  if (raw.length === 0) {
    return `${name}\n(no data)\nExported from SignalForge`;
  }

  const keys = [...new Set(raw.flatMap((r) => Object.keys(r)))];
  const header = keys.join(',');
  const rows = raw.map((r) =>
    keys.map((k) => {
      const v = r[k];
      if (v == null) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','),
  );
  return `${name}\n${header}\n${rows.join('\n')}\n\nExported from SignalForge`;
}

export default function DataExportScreen() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (card: typeof EXPORT_CARDS[0]) => {
    setExporting(card.id);
    try {
      const data = await card.fetcher();
      const csv = toCSV(data, card.name);
      await Share.share({
        message: csv,
        title: `SignalForge ${card.name} Export`,
      });
    } catch (e) {
      Alert.alert('Export Failed', (e as Error).message ?? 'Could not export data');
    } finally {
      setExporting(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.subtitle}>Export your data as CSV and share</Text>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {EXPORT_CARDS.map((card) => (
          <View key={card.id} style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name={card.icon} size={28} color={COLORS.accent} />
            </View>
            <Text style={styles.cardName}>{card.name}</Text>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => handleExport(card)}
              disabled={!!exporting}
              activeOpacity={0.7}
            >
              {exporting === card.id ? (
                <ActivityIndicator size="small" color={COLORS.bg} />
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color={COLORS.bg} />
                  <Text style={styles.exportBtnText}>Export</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  subtitle: { fontSize: 14, color: COLORS.textMuted, paddingHorizontal: 16, paddingVertical: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.accent + '22', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardName: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 100,
    justifyContent: 'center',
  },
  exportBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.bg },
});
