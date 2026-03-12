import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const TAX_RATE = 0.25;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

interface Trade {
  id: string;
  symbol: string;
  buyDate: string;
  sellDate: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
}

interface TaxEvent {
  trade: Trade;
  gain: number;
  isLongTerm: boolean;
}

export default function TaxReportScreen() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('sf-trades').then((raw) => {
      if (raw) {
        try { setTrades(JSON.parse(raw)); } catch {}
      }
      setLoading(false);
    });
  }, []);

  const taxEvents = useMemo<TaxEvent[]>(() => {
    return trades
      .filter((t) => t.sellDate)
      .map((t) => {
        const gain = (t.sellPrice - t.buyPrice) * t.quantity;
        const holdMs = new Date(t.sellDate).getTime() - new Date(t.buyDate).getTime();
        return { trade: t, gain, isLongTerm: holdMs >= ONE_YEAR_MS };
      });
  }, [trades]);

  const summary = useMemo(() => {
    const shortTerm = taxEvents.filter((e) => !e.isLongTerm).reduce((s, e) => s + e.gain, 0);
    const longTerm = taxEvents.filter((e) => e.isLongTerm).reduce((s, e) => s + e.gain, 0);
    const total = shortTerm + longTerm;
    const taxEstimate = Math.max(0, total * TAX_RATE);
    return { shortTerm, longTerm, total, taxEstimate };
  }, [taxEvents]);

  const handleDownload = () => {
    Alert.alert(
      'Tax Report Summary',
      `Short-term Gains: $${summary.shortTerm.toFixed(2)}\n` +
        `Long-term Gains: $${summary.longTerm.toFixed(2)}\n` +
        `Total Gains: $${summary.total.toFixed(2)}\n` +
        `Estimated Tax (25%): $${summary.taxEstimate.toFixed(2)}\n\n` +
        `Total taxable events: ${taxEvents.length}`,
      [{ text: 'OK' }],
    );
  };

  const renderEvent = ({ item }: { item: TaxEvent }) => (
    <View style={s.eventCard}>
      <View style={s.eventHeader}>
        <Text style={s.eventSymbol}>{item.trade.symbol}</Text>
        <View style={[s.termBadge, { backgroundColor: item.isLongTerm ? C.accent + '18' : C.warning + '18' }]}>
          <Text style={[s.termText, { color: item.isLongTerm ? C.accent : C.warning }]}>
            {item.isLongTerm ? 'Long-term' : 'Short-term'}
          </Text>
        </View>
      </View>
      <View style={s.eventDetails}>
        <View style={s.eventCol}>
          <Text style={s.detailLabel}>Buy</Text>
          <Text style={s.detailValue}>${item.trade.buyPrice.toFixed(2)}</Text>
          <Text style={s.detailDate}>{new Date(item.trade.buyDate).toLocaleDateString()}</Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color={C.textMuted} />
        <View style={s.eventCol}>
          <Text style={s.detailLabel}>Sell</Text>
          <Text style={s.detailValue}>${item.trade.sellPrice.toFixed(2)}</Text>
          <Text style={s.detailDate}>{new Date(item.trade.sellDate).toLocaleDateString()}</Text>
        </View>
        <View style={[s.eventCol, { alignItems: 'flex-end' }]}>
          <Text style={s.detailLabel}>Gain</Text>
          <Text style={[s.gainValue, { color: item.gain >= 0 ? C.accent : C.danger }]}>
            {item.gain >= 0 ? '+' : ''}${item.gain.toFixed(2)}
          </Text>
          <Text style={s.qtyText}>x{item.trade.quantity}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <FlatList
        data={taxEvents}
        keyExtractor={(item) => item.trade.id}
        renderItem={renderEvent}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <View>
            <View style={s.titleRow}>
              <Text style={s.title}>Tax Report</Text>
              <TouchableOpacity style={s.downloadBtn} onPress={handleDownload}>
                <Ionicons name="download-outline" size={18} color={C.bg} />
                <Text style={s.downloadText}>Download</Text>
              </TouchableOpacity>
            </View>

            <View style={s.summaryGrid}>
              <View style={s.summaryItem}>
                <Text style={s.summaryLabel}>Short-term</Text>
                <Text style={[s.summaryValue, { color: summary.shortTerm >= 0 ? C.accent : C.danger }]}>
                  ${summary.shortTerm.toFixed(2)}
                </Text>
              </View>
              <View style={s.summaryItem}>
                <Text style={s.summaryLabel}>Long-term</Text>
                <Text style={[s.summaryValue, { color: summary.longTerm >= 0 ? C.accent : C.danger }]}>
                  ${summary.longTerm.toFixed(2)}
                </Text>
              </View>
              <View style={s.summaryItem}>
                <Text style={s.summaryLabel}>Total Gains</Text>
                <Text style={[s.summaryValue, { color: summary.total >= 0 ? C.accent : C.danger }]}>
                  ${summary.total.toFixed(2)}
                </Text>
              </View>
              <View style={s.summaryItem}>
                <Text style={s.summaryLabel}>Tax Est. (25%)</Text>
                <Text style={[s.summaryValue, { color: C.warning }]}>
                  ${summary.taxEstimate.toFixed(2)}
                </Text>
              </View>
            </View>

            <Text style={s.sectionTitle}>Taxable Events ({taxEvents.length})</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.emptyBlock}>
            <Ionicons name="receipt-outline" size={48} color={C.textMuted} />
            <Text style={s.emptyText}>No completed trades found</Text>
            <Text style={s.emptyHint}>Trades are read from local storage</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  listContent: { padding: 16, paddingBottom: 40 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: C.textPrimary },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  downloadText: { fontSize: 13, fontWeight: '700', color: C.bg },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  summaryItem: {
    width: '48%' as any,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  summaryLabel: { fontSize: 12, color: C.textMuted, fontWeight: '600', marginBottom: 6 },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  eventCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventSymbol: { fontSize: 16, fontWeight: '800', color: C.info },
  termBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  termText: { fontSize: 11, fontWeight: '700' },
  eventDetails: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventCol: { flex: 1 },
  detailLabel: { fontSize: 11, color: C.textMuted, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  detailDate: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  gainValue: { fontSize: 16, fontWeight: '800' },
  qtyText: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  emptyBlock: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 16, color: C.textMuted, marginTop: 16 },
  emptyHint: { fontSize: 13, color: C.textMuted, marginTop: 4 },
});
