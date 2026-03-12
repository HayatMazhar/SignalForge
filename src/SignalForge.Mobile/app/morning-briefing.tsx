import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/api/client';
import { format } from 'date-fns';

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

type FearGreed = { score?: number; value?: number; label?: string; classification?: string };
type TopMover = { symbol: string; name?: string; price?: number; changePercent?: number };
type Signal = { id: string; symbol: string; type: string; confidenceScore?: number };
type PulseEvent = { title?: string; description?: string; impact?: string };

export default function MorningBriefingScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fearGreed, setFearGreed] = useState<FearGreed | null>(null);
  const [topMovers, setTopMovers] = useState<TopMover[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [marketPulse, setMarketPulse] = useState<PulseEvent[]>([]);
  const [aiInsight, setAiInsight] = useState('');

  const loadData = useCallback(() => {
    return Promise.all([
      api.get<FearGreed>('/insights/fear-greed').then((r) => r.data).catch(() => null),
      api.get<TopMover[]>('/stocks/top-movers').then((r) => r.data).catch(() => []),
      api.get<Signal[]>('/signals', { params: { limit: 5 } }).then((r) => r.data).catch(() => []),
      api.get<{ events?: PulseEvent[] }>('/insights/market-pulse').then((r) => Array.isArray(r.data) ? r.data : r.data?.events ?? []).catch(() => []),
    ])
      .then(([fg, movers, sig, pulse]) => {
        setFearGreed(fg);
        setTopMovers(Array.isArray(movers) ? movers : []);
        setSignals(Array.isArray(sig) ? sig : []);
        setMarketPulse(Array.isArray(pulse) ? pulse : []);

        const insightParts: string[] = [];
        if (fg) {
          const s = fg.score ?? fg.value ?? 50;
          insightParts.push(`Market sentiment is ${s > 60 ? 'greedy' : s < 40 ? 'fearful' : 'neutral'} at ${s}/100.`);
        }
        if (Array.isArray(movers) && movers.length > 0) {
          const topG = movers.filter((m: any) => (m.changePercent ?? 0) > 0).slice(0, 2);
          if (topG.length > 0) insightParts.push(`Top gainers: ${topG.map((m: any) => `${m.symbol} +${(m.changePercent ?? 0).toFixed(1)}%`).join(', ')}.`);
        }
        if (Array.isArray(sig) && sig.length > 0) {
          const buyCount = sig.filter((s: any) => s.type === 'Buy' || s.type === '0').length;
          insightParts.push(`${buyCount} of ${sig.length} AI signals are bullish today.`);
        }
        setAiInsight(insightParts.join(' ') || 'Loading market insight...');

        api.post('/chat', { message: `Give a 2-sentence morning market insight based on: ${insightParts.join(' ')}` })
          .then(r => {
            const msg = r.data?.response ?? r.data?.message;
            if (msg) setAiInsight(msg);
          })
          .catch(() => {});
      });
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const today = format(new Date(), 'EEEE, MMMM d');
  const score = fearGreed?.score ?? fearGreed?.value ?? 50;
  const status = score < 30 ? 'Fear' : score > 70 ? 'Greed' : 'Neutral';

  const handleShare = async () => {
    const summary = `SignalForge Morning Briefing • ${today}\nMarket: ${status} (${score}/100)\nTop signals: ${signals.slice(0, 3).map((s) => s.symbol).join(', ') || 'None'}`;
    try {
      await Share.share({ message: summary, title: 'Morning Briefing' });
    } catch {}
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading briefing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const gainers = topMovers.filter((m) => (m.changePercent ?? 0) >= 0).slice(0, 3);
  const losers = topMovers.filter((m) => (m.changePercent ?? 0) < 0).slice(0, 3);
  const pulseEvents = marketPulse.slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Morning Briefing</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FF94" />
        }
      >
        <View style={styles.card}>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.date}>{today}</Text>
          <View style={[styles.statusBadge, status === 'Fear' && styles.badgeFear, status === 'Greed' && styles.badgeGreed]}>
            <Text style={styles.statusText}>Market: {status}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fear & Greed Index</Text>
          <Text style={styles.scoreNumber}>{score}</Text>
          <Text style={styles.scoreLabel}>{fearGreed?.label ?? fearGreed?.classification ?? 'Neutral'}</Text>
          <View style={styles.scoreBar}>
            <View
              style={[
                styles.scoreFill,
                {
                  width: `${score}%`,
                  backgroundColor: score < 30 ? COLORS.danger : score > 70 ? COLORS.accent : COLORS.warning,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Top Signals</Text>
          {signals.slice(0, 3).length === 0 ? (
            <Text style={styles.emptyCard}>No signals yet</Text>
          ) : (
            signals.slice(0, 3).map((s) => (
              <View key={s.id} style={styles.signalRow}>
                <View style={[styles.signalBadge, { backgroundColor: (s.type === 'Buy' || s.type === '0' ? COLORS.accent : s.type === 'Sell' || s.type === '1' ? COLORS.danger : COLORS.warning) + '33' }]}>
                  <Text style={styles.signalBadgeText}>{s.symbol}</Text>
                </View>
                <Text style={styles.signalType}>{s.type === 'Buy' || s.type === '0' ? 'Buy' : s.type === 'Sell' || s.type === '1' ? 'Sell' : 'Hold'}</Text>
                {s.confidenceScore != null && (
                  <Text style={styles.confidenceText}>{Math.round(s.confidenceScore * 100)}%</Text>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Market Movers</Text>
          <View style={styles.moversRow}>
            <View style={styles.moversCol}>
              <Text style={styles.moversLabel}>Gainers</Text>
              {gainers.length === 0 ? <Text style={styles.emptyMover}>—</Text> : gainers.map((m) => (
                <Text key={m.symbol} style={styles.moverText}>
                  {m.symbol} {m.changePercent != null ? `+${m.changePercent.toFixed(1)}%` : ''}
                </Text>
              ))}
            </View>
            <View style={styles.moversCol}>
              <Text style={styles.moversLabel}>Losers</Text>
              {losers.length === 0 ? <Text style={styles.emptyMover}>—</Text> : losers.map((m) => (
                <Text key={m.symbol} style={[styles.moverText, styles.loserText]}>
                  {m.symbol} {m.changePercent != null ? `${m.changePercent.toFixed(1)}%` : ''}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Market Events</Text>
          {pulseEvents.length === 0 ? (
            <Text style={styles.emptyCard}>No events</Text>
          ) : (
            pulseEvents.map((e, i) => (
              <View key={i} style={styles.eventRow}>
                <Ionicons name="radio-button-on" size={10} color={COLORS.info} />
                <Text style={styles.eventText}>{e.title || e.description || 'Event'}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>AI Insight</Text>
          <Text style={styles.insightText}>{aiInsight}</Text>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={COLORS.bg} />
          <Text style={styles.shareBtnText}>Share Briefing</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 16, color: COLORS.textMuted },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  date: { fontSize: 15, color: COLORS.textMuted, marginTop: 4, marginBottom: 12 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.warning + '33',
  },
  badgeFear: { backgroundColor: COLORS.danger + '33' },
  badgeGreed: { backgroundColor: COLORS.accent + '33' },
  statusText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  scoreNumber: { fontSize: 42, fontWeight: '800', color: COLORS.accent },
  scoreLabel: { fontSize: 14, color: COLORS.textMuted, marginBottom: 10 },
  scoreBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 4 },
  signalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  signalBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  signalBadgeText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  signalType: { fontSize: 14, color: COLORS.textMuted },
  confidenceText: { fontSize: 13, color: COLORS.accent, marginLeft: 'auto' },
  emptyCard: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic' },
  moversRow: { flexDirection: 'row', gap: 24 },
  moversCol: { flex: 1 },
  moversLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8 },
  moverText: { fontSize: 14, color: COLORS.accent, marginBottom: 4 },
  loserText: { color: COLORS.danger },
  emptyMover: { fontSize: 14, color: COLORS.textMuted },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  eventText: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },
  insightText: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 24 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    marginTop: 8,
  },
  shareBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.bg },
});
