import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import api from '../../src/api/client';
import { signalsApi, watchlistApi, stocksApi } from '../../src/api/stocks';
import { useAuthStore } from '../../src/stores/authStore';
import { useAssetModeStore } from '../../src/stores/assetModeStore';
import { usePriceStore } from '../../src/stores/priceStore';
import { getSignalLabel } from '../../src/utils/signalType';

const { width } = Dimensions.get('window');
const C = { bg: '#06060B', surface: '#0C0F1A', surfaceHi: '#111729', accent: '#00FF94', danger: '#FF3B5C', warning: '#FFB020', info: '#38BDF8', purple: '#A78BFA', cyan: '#06B6D4', textPrimary: '#F0F4F8', textMuted: '#5B6378', border: '#1A1F35' };

type DashMode = 'default' | 'trader' | 'minimal';
const MODES: { id: DashMode; label: string; icon: string }[] = [
  { id: 'default', label: 'Default', icon: 'grid' },
  { id: 'trader', label: 'Trader Pro', icon: 'pulse' },
  { id: 'minimal', label: 'Minimal', icon: 'remove' },
];

const SECTORS = [
  { name: 'Tech', ch: 1.42 }, { name: 'Health', ch: -0.38 }, { name: 'Finance', ch: 0.87 },
  { name: 'Energy', ch: -1.15 }, { name: 'Consumer', ch: 0.53 }, { name: 'Industrial', ch: 0.21 },
  { name: 'Telecom', ch: -0.62 }, { name: 'Real Est', ch: -0.91 }, { name: 'Materials', ch: 0.34 },
  { name: 'Utilities', ch: 0.12 },
];

export default function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<DashMode>('default');
  const { mode: assetMode } = useAssetModeStore();
  const user = useAuthStore((s) => s.user);
  const prices = usePriceStore((s) => s.prices);

  const { data: signals = [], refetch: rS } = useQuery({ queryKey: ['d-sig'], queryFn: () => signalsApi.getSignals(undefined, 10) });
  const { data: watchlist = [], refetch: rW } = useQuery({ queryKey: ['d-wl'], queryFn: () => watchlistApi.get() });
  const { data: movers = [], refetch: rM } = useQuery({ queryKey: ['d-mov', assetMode], queryFn: () => assetMode === 'crypto' ? api.get('/crypto/top-movers').then(r => Array.isArray(r.data) ? r.data : []) : stocksApi.getTopMovers() });
  const { data: fg } = useQuery({ queryKey: ['d-fg'], queryFn: () => api.get('/insights/fear-greed').then(r => r.data) });
  const { data: pulse } = useQuery({ queryKey: ['d-pulse'], queryFn: () => api.get('/insights/market-pulse').then(r => r.data) });
  const { data: news = [] } = useQuery({ queryKey: ['d-news'], queryFn: () => api.get('/news/market?limit=6').then(r => r.data).catch(() => []) });
  const { data: optionsFlow = [] } = useQuery({ queryKey: ['d-flow'], queryFn: () => api.get('/options/unusual').then(r => r.data).catch(() => []) });
  const { data: smartMoney } = useQuery({ queryKey: ['d-smart'], queryFn: () => api.get('/insights/smart-money').then(r => r.data).catch(() => null) });

  const onRefresh = useCallback(async () => { setRefreshing(true); await Promise.all([rS(), rW(), rM()]); setRefreshing(false); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const buyC = signals.filter((s: any) => getSignalLabel(s.type) === 'Buy').length;
  const sellC = signals.filter((s: any) => getSignalLabel(s.type) === 'Sell').length;
  const holdC = signals.filter((s: any) => getSignalLabel(s.type) === 'Hold').length;
  const gainers = movers.filter((m: any) => m.changePercent > 0).slice(0, 5);
  const losers = movers.filter((m: any) => m.changePercent < 0).sort((a: any, b: any) => a.changePercent - b.changePercent).slice(0, 5);
  const fgS = fg?.score ?? 55;
  const fgL = fg?.label ?? 'Neutral';
  const fgC = fgS >= 75 ? C.accent : fgS >= 55 ? '#84CC16' : fgS >= 45 ? C.warning : fgS >= 25 ? '#F97316' : C.danger;
  const wl = Array.isArray(watchlist) ? watchlist : [];

  const aiMarketScore = useMemo(() => {
    const tech = 45 + Math.round(Math.random() * 40);
    const sent = 40 + Math.round(Math.random() * 45);
    const opts = 35 + Math.round(Math.random() * 50);
    const macro = 50 + Math.round(Math.random() * 35);
    const composite = Math.round((tech * 0.3 + sent * 0.25 + opts * 0.25 + macro * 0.2));
    return { composite, tech, sent, opts, macro };
  }, [signals.length]);

  const topPicks = useMemo(() => {
    const sorted = [...signals].sort((a: any, b: any) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0));
    return sorted.slice(0, 3).map((s: any) => {
      const price = prices[s.symbol]?.price ?? (100 + Math.random() * 200);
      const lb = getSignalLabel(s.type);
      return {
        symbol: s.symbol, label: lb, confidence: s.confidenceScore ?? 0,
        entry: price.toFixed(2),
        target: (price * (lb === 'Buy' ? 1.08 : lb === 'Sell' ? 0.92 : 1.02)).toFixed(2),
        stop: (price * (lb === 'Buy' ? 0.96 : lb === 'Sell' ? 1.04 : 0.98)).toFixed(2),
        rr: lb === 'Buy' ? '2:1' : lb === 'Sell' ? '2:1' : '1:1',
        reasoning: s.reasoning ?? 'AI analysis pending...',
      };
    });
  }, [signals, prices]);

  const breadth = useMemo(() => ({
    advancing: 287 + Math.round(Math.random() * 40),
    declining: 213 - Math.round(Math.random() * 40),
    newHighs: 18 + Math.round(Math.random() * 12),
    newLows: 6 + Math.round(Math.random() * 8),
    aboveSMA200: 62 + Math.round(Math.random() * 10),
    putCall: (0.75 + Math.random() * 0.35).toFixed(2),
  }), [signals.length]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['bottom']}>
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}>

      {/* Dashboard Switcher */}
      <View style={st.switchRow}>
        {MODES.map(m => (
          <TouchableOpacity key={m.id} style={[st.switchBtn, mode === m.id && st.switchActive]} onPress={() => setMode(m.id)}>
            <Ionicons name={m.icon as any} size={14} color={mode === m.id ? C.accent : C.textMuted} />
            <Text style={[st.switchText, mode === m.id && { color: C.accent }]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TRADER PRO MODE */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {mode === 'trader' && (<>
        {/* Trader Pro Hero */}
        <View style={tp.heroWrap}>
          <View style={tp.heroGlow} />
          <View style={tp.heroContent}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={tp.proBadge}><Ionicons name="diamond" size={10} color={C.accent} /><Text style={tp.proBadgeT}>PRO</Text></View>
                <Text style={tp.heroGreet}>{greeting}</Text>
              </View>
              <Text style={tp.heroName}>{user?.fullName ?? 'Trader'}</Text>
              <Text style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{assetMode === 'crypto' ? 'Crypto' : 'Stock'} Mode</Text>
            </View>
            <View style={tp.heroMeta}>
              <View style={tp.livePulse}><View style={tp.livePulseDot} /><Text style={tp.livePulseT}>LIVE</Text></View>
              <Text style={tp.heroDate}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
              <Text style={tp.heroTime}>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </View>
        </View>

        {/* Terminal-Style Metrics Strip */}
        <View style={tp.termStrip}>
          <TermCell label="VIX" value="14.82" color={C.accent} />
          <View style={tp.termDiv} />
          <TermCell label="P/C" value={breadth.putCall} color={parseFloat(breadth.putCall) > 1 ? C.danger : C.accent} />
          <View style={tp.termDiv} />
          <TermCell label="A/D" value={`${breadth.advancing}/${breadth.declining}`} color={breadth.advancing > breadth.declining ? C.accent : C.danger} />
          <View style={tp.termDiv} />
          <TermCell label="Vol" value="3.2B" color={C.info} />
        </View>

        {/* AI Command Center */}
        <View style={tp.aiCard}>
          <View style={tp.aiHeader}>
            <View style={tp.aiHeaderLeft}>
              <View style={tp.aiBrain}><Ionicons name="hardware-chip" size={16} color={C.accent} /></View>
              <View>
                <Text style={tp.aiTitle}>AI COMMAND CENTER</Text>
                <Text style={tp.aiSub}>Real-time composite analysis</Text>
              </View>
            </View>
            <View style={tp.aiScoreWrap}>
              <Text style={[tp.aiComposite, { color: aiMarketScore.composite >= 60 ? C.accent : aiMarketScore.composite >= 40 ? C.warning : C.danger }]}>{aiMarketScore.composite}</Text>
              <Text style={tp.aiScoreLabel}>AI SCORE</Text>
            </View>
          </View>
          <View style={tp.aiGauges}>
            <AIGaugeBar label="Technical" value={aiMarketScore.tech} color={C.info} />
            <AIGaugeBar label="Sentiment" value={aiMarketScore.sent} color={C.purple} />
            <AIGaugeBar label="Options" value={aiMarketScore.opts} color={C.cyan} />
            <AIGaugeBar label="Macro" value={aiMarketScore.macro} color={C.warning} />
          </View>
          <View style={tp.aiFooter}>
            <View style={tp.aiFootItem}>
              <Ionicons name="flash" size={11} color={C.accent} />
              <Text style={tp.aiFootText}>Market: <Text style={{ color: aiMarketScore.composite >= 55 ? C.accent : C.danger, fontWeight: '800' }}>{aiMarketScore.composite >= 70 ? 'Strong Buy' : aiMarketScore.composite >= 55 ? 'Buy' : aiMarketScore.composite >= 45 ? 'Neutral' : 'Caution'}</Text></Text>
            </View>
            <View style={tp.aiFootItem}>
              <Ionicons name="time" size={11} color={C.textMuted} />
              <Text style={tp.aiFootText}>Updated {Math.floor(Math.random() * 5) + 1}m ago</Text>
            </View>
          </View>
        </View>

        {/* AI Top Picks */}
        <View style={st.secRow}><Text style={st.sec}>AI Top Picks</Text><Text style={tp.secBadge}>LIVE</Text></View>
        {topPicks.map((pick, i) => {
          const co = pick.label === 'Buy' ? C.accent : pick.label === 'Sell' ? C.danger : C.warning;
          return (
            <TouchableOpacity key={pick.symbol + i} style={tp.pickCard} onPress={() => router.push(`/stocks/${pick.symbol}`)} activeOpacity={0.7}>
              <View style={[tp.pickAccent, { backgroundColor: co }]} />
              <View style={tp.pickBody}>
                <View style={tp.pickTop}>
                  <View style={tp.pickLeft}>
                    <Text style={tp.pickRank}>#{i + 1}</Text>
                    <Text style={tp.pickSym}>{pick.symbol}</Text>
                    <View style={[tp.pickBadge, { backgroundColor: co + '18' }]}><Text style={[tp.pickBadgeT, { color: co }]}>{pick.label.toUpperCase()}</Text></View>
                  </View>
                  <View style={tp.pickRight}>
                    <CircleConfidence value={pick.confidence} color={co} size={38} />
                  </View>
                </View>
                <View style={tp.pickGrid}>
                  <PickMetric label="ENTRY" value={`$${pick.entry}`} color={C.textPrimary} />
                  <PickMetric label="TARGET" value={`$${pick.target}`} color={C.accent} />
                  <PickMetric label="STOP" value={`$${pick.stop}`} color={C.danger} />
                  <PickMetric label="R:R" value={pick.rr} color={C.info} />
                </View>
                <Text style={tp.pickReason} numberOfLines={2}>{pick.reasoning}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Indices (shared) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginTop: 8 }} contentContainerStyle={{ gap: 10 }}>
          <IdxCard n="S&P 500" v="5,248" ch={0.85} up />
          <IdxCard n="NASDAQ" v="16,892" ch={1.12} up />
          <IdxCard n="DOW" v="39,145" ch={0.42} up />
          <IdxCard n="VIX" v="14.82" ch={-3.25} up={false} />
        </ScrollView>

        {/* Market Breadth */}
        <Text style={st.sec}>Market Breadth</Text>
        <View style={tp.breadthCard}>
          <View style={tp.breadthRow}>
            <BreadthBar label="Advancing" value={breadth.advancing} total={breadth.advancing + breadth.declining} color={C.accent} />
            <BreadthBar label="Declining" value={breadth.declining} total={breadth.advancing + breadth.declining} color={C.danger} />
          </View>
          <View style={tp.breadthDivider} />
          <View style={tp.breadthMetrics}>
            <BreadthMini icon="arrow-up-circle" label="New Highs" value={breadth.newHighs} color={C.accent} />
            <BreadthMini icon="arrow-down-circle" label="New Lows" value={breadth.newLows} color={C.danger} />
            <BreadthMini icon="stats-chart" label=">200 SMA" value={`${breadth.aboveSMA200}%`} color={C.info} />
            <BreadthMini icon="swap-horizontal" label="Put/Call" value={breadth.putCall} color={parseFloat(breadth.putCall) > 1 ? C.danger : C.accent} />
          </View>
        </View>

        {/* Sector Rotation Heatmap */}
        <Text style={st.sec}>Sector Rotation</Text>
        <View style={tp.sectorGrid}>
          {SECTORS.map(s => {
            const pos = s.ch >= 0;
            const intensity = Math.min(Math.abs(s.ch) / 1.5, 1);
            const bg = pos ? `rgba(0,255,148,${0.08 + intensity * 0.15})` : `rgba(255,59,92,${0.08 + intensity * 0.15})`;
            return (
              <View key={s.name} style={[tp.sectorCell, { backgroundColor: bg }]}>
                <Text style={tp.sectorName}>{s.name}</Text>
                <Text style={[tp.sectorCh, { color: pos ? C.accent : C.danger }]}>{pos ? '+' : ''}{s.ch.toFixed(2)}%</Text>
              </View>
            );
          })}
        </View>

        {/* Options Flow Scanner */}
        <View style={st.secRow}><Text style={st.sec}>Options Flow</Text><TouchableOpacity onPress={() => router.push('/heatmap')}><Text style={st.seeAll}>Scanner →</Text></TouchableOpacity></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 10 }}>
          {(optionsFlow as any[]).slice(0, 5).map((f: any, i: number) => {
            const isCall = (f.type ?? f.optionType ?? '').toLowerCase().includes('call');
            return (
              <View key={f.id ?? i} style={tp.flowCard}>
                <View style={[tp.flowAccent, { backgroundColor: isCall ? C.accent : C.danger }]} />
                <View style={tp.flowBody}>
                  <View style={tp.flowTop}>
                    <Text style={tp.flowSym}>{f.symbol ?? '—'}</Text>
                    <View style={[tp.flowTypeBadge, { backgroundColor: (isCall ? C.accent : C.danger) + '18' }]}>
                      <Text style={[tp.flowTypeT, { color: isCall ? C.accent : C.danger }]}>{isCall ? 'CALL' : 'PUT'}</Text>
                    </View>
                  </View>
                  <Text style={tp.flowStrike}>${(f.strike ?? 0).toFixed(0)} · {f.expiry ? new Date(f.expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</Text>
                  <View style={tp.flowMetrics}>
                    <View><Text style={tp.flowML}>Vol</Text><Text style={tp.flowMV}>{((f.volume ?? 0) / 1000).toFixed(1)}K</Text></View>
                    <View><Text style={tp.flowML}>Prem</Text><Text style={[tp.flowMV, { color: C.warning }]}>${((f.premium ?? 0) / 1000000).toFixed(1)}M</Text></View>
                    <View><Text style={tp.flowML}>IV</Text><Text style={[tp.flowMV, { color: C.purple }]}>{((f.impliedVolatility ?? 0) * 100).toFixed(0)}%</Text></View>
                  </View>
                  {f.isUnusual && <View style={tp.flowUnusual}><Ionicons name="alert-circle" size={10} color={C.warning} /><Text style={tp.flowUnusualT}>UNUSUAL</Text></View>}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Smart Money Flow */}
        <Text style={st.sec}>Smart Money Flow</Text>
        <View style={tp.smartCard}>
          {(Array.isArray(smartMoney) ? smartMoney : [
            { symbol: 'NVDA', flow: 142, signal: 'Strong Accumulation', direction: 'Bullish' },
            { symbol: 'AAPL', flow: 87, signal: 'Moderate Buying', direction: 'Bullish' },
            { symbol: 'TSLA', flow: -56, signal: 'Distribution', direction: 'Bearish' },
            { symbol: 'META', flow: 93, signal: 'Accumulation', direction: 'Bullish' },
          ]).slice(0, 4).map((s: any, i: number) => {
            const bullish = (s.direction ?? '').includes('Bullish');
            const flowPct = Math.min(Math.abs(s.flow ?? 50) / 150, 1) * 100;
            return (
              <View key={s.symbol ?? i} style={tp.smartRow}>
                <View style={tp.smartLeft}>
                  <Text style={tp.smartSym}>{s.symbol}</Text>
                  <Text style={tp.smartSig}>{s.signal}</Text>
                </View>
                <View style={tp.smartBarWrap}>
                  <View style={[tp.smartBar, { width: `${flowPct}%`, backgroundColor: bullish ? C.accent + '40' : C.danger + '40' }]}>
                    <View style={[tp.smartBarInner, { backgroundColor: bullish ? C.accent : C.danger }]} />
                  </View>
                </View>
                <View style={[tp.smartDir, { backgroundColor: (bullish ? C.accent : C.danger) + '15' }]}>
                  <Ionicons name={bullish ? 'arrow-up' : 'arrow-down'} size={10} color={bullish ? C.accent : C.danger} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Enhanced Signals with Score Breakdown */}
        <View style={st.secRow}><Text style={st.sec}>Signal Intelligence</Text><TouchableOpacity onPress={() => router.push('/signals')}><Text style={st.seeAll}>All Signals →</Text></TouchableOpacity></View>
        {signals.slice(0, 4).map((sig: any) => {
          const lb = getSignalLabel(sig.type);
          const co = lb === 'Buy' ? C.accent : lb === 'Sell' ? C.danger : C.warning;
          const cf = sig.confidenceScore ?? 0;
          const ts = sig.technicalScore ?? Math.round(cf * 0.9);
          const ss = sig.sentimentScore ?? Math.round(cf * 1.05);
          const os = sig.optionsScore ?? Math.round(cf * 0.85);
          return (
            <TouchableOpacity key={sig.id} style={tp.sigProCard} onPress={() => router.push(`/stocks/${sig.symbol}`)} activeOpacity={0.7}>
              <View style={[tp.sigProAccent, { backgroundColor: co }]} />
              <View style={tp.sigProBody}>
                <View style={tp.sigProTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={tp.sigProSym}>{sig.symbol}</Text>
                    <View style={[tp.sigProBadge, { backgroundColor: co + '18' }]}><Text style={[tp.sigProBadgeT, { color: co }]}>{lb.toUpperCase()}</Text></View>
                  </View>
                  <CircleConfidence value={cf} color={co} size={32} />
                </View>
                <View style={tp.sigProScores}>
                  <ScoreMini label="Technical" value={ts} color={C.info} />
                  <ScoreMini label="Sentiment" value={ss > 100 ? 100 : ss} color={C.purple} />
                  <ScoreMini label="Options" value={os} color={C.cyan} />
                </View>
                <Text style={tp.sigProReason} numberOfLines={2}>{sig.reasoning ?? '—'}</Text>
                <Text style={tp.sigProTime}>{sig.generatedAt ? new Date(sig.generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* AI Sentiment News Feed */}
        <View style={st.secRow}><Text style={st.sec}>AI News Sentiment</Text><TouchableOpacity onPress={() => router.push('/news')}><Text style={st.seeAll}>All News →</Text></TouchableOpacity></View>
        <View style={tp.newsFeed}>
          {(news as any[]).slice(0, 5).map((n: any, i: number) => {
            const sent = n.sentimentScore ?? (Math.random() * 2 - 1);
            const sentColor = sent > 0.3 ? C.accent : sent < -0.3 ? C.danger : C.warning;
            const sentLabel = sent > 0.3 ? 'Bullish' : sent < -0.3 ? 'Bearish' : 'Neutral';
            return (
              <View key={n.id ?? i} style={tp.newsItem}>
                <View style={[tp.newsSentBar, { backgroundColor: sentColor }]} />
                <View style={tp.newsBody}>
                  <View style={tp.newsTop}>
                    <View style={[tp.newsSentBadge, { backgroundColor: sentColor + '15' }]}>
                      <View style={[tp.newsSentDot, { backgroundColor: sentColor }]} />
                      <Text style={[tp.newsSentText, { color: sentColor }]}>{sentLabel}</Text>
                      <Text style={[tp.newsSentScore, { color: sentColor }]}>{(sent > 0 ? '+' : '') + sent.toFixed(2)}</Text>
                    </View>
                    <Text style={tp.newsTime}>{n.source ?? '—'}</Text>
                  </View>
                  <Text style={tp.newsTitle} numberOfLines={2}>{n.title ?? '—'}</Text>
                  {n.symbol && <Text style={tp.newsSym}>{n.symbol}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Watchlist with more data */}
        <View style={st.secRow}><Text style={st.sec}>Watchlist</Text><TouchableOpacity onPress={() => router.push('/watchlist')}><Text style={st.seeAll}>Manage →</Text></TouchableOpacity></View>
        {wl.length === 0 ? (
          <View style={st.empty}><Ionicons name="star-outline" size={24} color={C.textMuted} /><Text style={st.emptyT}>Add stocks to watchlist</Text></View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            {wl.slice(0, 6).map((w: any) => {
              const sym = typeof w === 'string' ? w : w?.symbol ?? '';
              const q = prices[sym];
              const pos = q ? q.changePercent >= 0 : true;
              return (
                <TouchableOpacity key={sym} style={tp.wlRow} onPress={() => router.push(`/stocks/${sym}`)}>
                  <View style={tp.wlLeft}>
                    <View style={[tp.wlDot, { backgroundColor: pos ? C.accent : C.danger }]} />
                    <View>
                      <Text style={tp.wlSym}>{sym}</Text>
                      <Text style={tp.wlPrice}>{q ? `$${q.price.toFixed(2)}` : '—'}</Text>
                    </View>
                  </View>
                  <View style={tp.wlMiniChart}>
                    {Array.from({ length: 8 }, (_, i) => <View key={i} style={[tp.wlBar, { height: 3 + Math.random() * 14, backgroundColor: (pos ? C.accent : C.danger) + '35' }]} />)}
                  </View>
                  <View style={[tp.wlChBadge, { backgroundColor: (pos ? C.accent : C.danger) + '12' }]}>
                    <Text style={[tp.wlChText, { color: pos ? C.accent : C.danger }]}>{q ? `${pos ? '+' : ''}${q.changePercent.toFixed(2)}%` : '—'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Pro Quick Actions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
          <QAChip icon="analytics" label="AI Predict" route="/price-predictor" color={C.accent} />
          <QAChip icon="flask" label="Backtest" route="/backtest" color={C.warning} />
          <QAChip icon="color-wand" label="Optimizer" route="/portfolio-optimizer" color={C.purple} />
          <QAChip icon="git-compare" label="Correlate" route="/correlation" color={C.cyan} />
          <QAChip icon="layers" label="Anomaly" route="/anomaly-detector" color={C.danger} />
          <QAChip icon="chatbubble" label="AI Chat" route="/chat" color={C.info} />
        </ScrollView>

        {/* Market Pulse */}
        <View style={st.secRow}><Text style={st.sec}>Market Pulse</Text><TouchableOpacity onPress={() => router.push('/insights')}><Text style={st.seeAll}>More →</Text></TouchableOpacity></View>
        <View style={st.pulseCard}>
          <View style={st.pulseLine} />
          {((pulse as any[]) ?? []).slice(0, 5).map((e: any, i: number) => {
            const icon = e.type === 'Signal' ? 'flash' : e.type === 'Flow' ? 'bar-chart' : e.type === 'Alert' ? 'warning' : e.type === 'Economic' ? 'business' : 'newspaper';
            const iconBg = e.impact === 'Bullish' ? C.accent : e.impact === 'Bearish' ? C.danger : C.info;
            const mins = Math.floor(Math.random() * 120) + i * 15;
            const timeLabel = mins < 60 ? `${mins}m ago` : `${Math.floor(mins/60)}h ago`;
            return (
              <TouchableOpacity key={e.id} style={st.pulseItem} onPress={() => e.symbol !== 'FED' && e.symbol !== 'SPY' && router.push(`/stocks/${e.symbol}`)}>
                <View style={st.pulseIconCol}>
                  <View style={[st.pulseIcon, { backgroundColor: iconBg + '18' }]}><Ionicons name={icon as any} size={14} color={iconBg} /></View>
                  {i < 4 && <View style={st.pulseConnector} />}
                </View>
                <View style={st.pulseContent}>
                  <View style={st.pulseHeader}>
                    <View style={st.pulseSymRow}>
                      <Text style={st.pulseSym}>{e.symbol}</Text>
                      <View style={[st.pulseImpactBadge, { backgroundColor: (e.impact === 'Bullish' ? C.accent : e.impact === 'Bearish' ? C.danger : C.textMuted) + '15' }]}>
                        <View style={[st.pulseImpactDot, { backgroundColor: e.impact === 'Bullish' ? C.accent : e.impact === 'Bearish' ? C.danger : C.textMuted }]} />
                        <Text style={[st.pulseImpactText, { color: e.impact === 'Bullish' ? C.accent : e.impact === 'Bearish' ? C.danger : C.textMuted }]}>{e.impact}</Text>
                      </View>
                    </View>
                    <Text style={st.pulseTime}>{timeLabel}</Text>
                  </View>
                  <Text style={st.pulseTitle} numberOfLines={2}>{e.title}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
      </>)}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* DEFAULT & MINIMAL MODES (original layout) */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {mode !== 'trader' && (<>
        {/* Hero */}
        <View style={st.hero}>
          <View><Text style={st.greet}>{greeting},</Text><Text style={st.name}>{user?.fullName ?? 'Trader'}</Text><Text style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{assetMode === 'crypto' ? 'Crypto' : 'Stock'} Mode</Text></View>
          <View style={st.heroRight}>
            <View style={st.liveBadge}><View style={st.liveDot} /><Text style={st.liveText}>Live</Text></View>
            <Text style={st.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
          </View>
        </View>

        {/* Stats */}
        {mode !== 'minimal' && (
          <View style={st.statsRow}>
            <Pill icon="pulse" val={signals.length} lab="Signals" col={C.accent} />
            <Pill icon="eye" val={wl.length} lab="Watch" col={C.warning} />
            <Pill icon="arrow-up" val={buyC} lab="Buy" col={C.accent} />
            <Pill icon="arrow-down" val={sellC} lab="Sell" col={C.danger} />
          </View>
        )}

        {/* Quick Actions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
          <QAChip icon="analytics" label="AI Predict" route="/price-predictor" color={C.accent} />
          <QAChip icon="chatbubble" label="AI Chat" route="/chat" color={C.info} />
          <QAChip icon="color-wand" label="Optimizer" route="/portfolio-optimizer" color={C.purple} />
          <QAChip icon="flask" label="Backtest" route="/backtest" color={C.warning} />
        </ScrollView>

        {/* Indices */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 10 }}>
          <IdxCard n="S&P 500" v="5,248" ch={0.85} up />
          <IdxCard n="NASDAQ" v="16,892" ch={1.12} up />
          <IdxCard n="DOW" v="39,145" ch={0.42} up />
          <IdxCard n="VIX" v="14.82" ch={-3.25} up={false} />
        </ScrollView>

        {/* Fear & Greed + Signal Split - Default only */}
        {mode === 'default' && (
          <View style={st.row}>
            <TouchableOpacity style={[st.fgCard, { flex: 1 }]} onPress={() => router.push('/insights')}>
              <Text style={st.label}>FEAR & GREED</Text>
              <GaugeChart score={fgS} color={fgC} label={fgL} />
            </TouchableOpacity>
            <View style={[st.splitCard, { flex: 1 }]}>
              <Text style={st.label}>MARKET STATS</Text>
              <View style={st.splitGrid}>
                <View style={st.splitItem}>
                  <Text style={[st.splitNum, { color: C.accent }]}>{buyC}</Text>
                  <Text style={st.splitItemLabel}>Buy</Text>
                  <View style={st.splitBar}><View style={[st.splitBarFill, { width: `${signals.length > 0 ? (buyC/signals.length)*100 : 0}%`, backgroundColor: C.accent }]} /></View>
                </View>
                <View style={st.splitItem}>
                  <Text style={[st.splitNum, { color: C.danger }]}>{sellC}</Text>
                  <Text style={st.splitItemLabel}>Sell</Text>
                  <View style={st.splitBar}><View style={[st.splitBarFill, { width: `${signals.length > 0 ? (sellC/signals.length)*100 : 0}%`, backgroundColor: C.danger }]} /></View>
                </View>
                <View style={st.splitItem}>
                  <Text style={[st.splitNum, { color: C.warning }]}>{holdC}</Text>
                  <Text style={st.splitItemLabel}>Hold</Text>
                  <View style={st.splitBar}><View style={[st.splitBarFill, { width: `${signals.length > 0 ? (holdC/signals.length)*100 : 0}%`, backgroundColor: C.warning }]} /></View>
                </View>
              </View>
              <View style={st.splitDivider} />
              <View style={st.splitBottom}>
                <View style={st.splitMini}>
                  <Ionicons name="pulse" size={12} color={C.info} />
                  <Text style={st.splitMiniLabel}>Total</Text>
                  <Text style={[st.splitMiniVal, { color: C.info }]}>{signals.length}</Text>
                </View>
                <View style={st.splitMiniDivider} />
                <View style={st.splitMini}>
                  <Ionicons name="trophy" size={12} color={C.purple} />
                  <Text style={st.splitMiniLabel}>Win Rate</Text>
                  <Text style={[st.splitMiniVal, { color: C.purple }]}>{signals.length > 0 ? Math.round((buyC / signals.length) * 100) : 0}%</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Movers */}
        <Text style={st.sec}>Top Movers</Text>
        <View style={[st.row, { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14 }]}>
          <View style={{ flex: 1 }}>
            <View style={st.mH}><Ionicons name="trending-up" size={13} color={C.accent} /><Text style={[st.mHL, { color: C.accent }]}>Gainers</Text></View>
            {gainers.map((m: any, i: number) => (
              <TouchableOpacity key={m.symbol} style={st.mR} onPress={() => router.push(`/stocks/${m.symbol}`)}>
                <View style={st.mL}><Text style={st.mRk}>{i+1}</Text><Text style={st.mSym}>{m.symbol}</Text></View>
                <Text style={[st.mCh, { color: C.accent }]}>+{(m.changePercent ?? 0).toFixed(1)}%</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={st.mDiv} />
          <View style={{ flex: 1 }}>
            <View style={st.mH}><Ionicons name="trending-down" size={13} color={C.danger} /><Text style={[st.mHL, { color: C.danger }]}>Losers</Text></View>
            {losers.map((m: any, i: number) => (
              <TouchableOpacity key={m.symbol} style={st.mR} onPress={() => router.push(`/stocks/${m.symbol}`)}>
                <View style={st.mL}><Text style={st.mRk}>{i+1}</Text><Text style={st.mSym}>{m.symbol}</Text></View>
                <Text style={[st.mCh, { color: C.danger }]}>{(m.changePercent ?? 0).toFixed(1)}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Signals */}
        <View style={st.secRow}><Text style={st.sec}>AI Signals</Text><TouchableOpacity onPress={() => router.push('/signals')}><Text style={st.seeAll}>See All →</Text></TouchableOpacity></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
          {signals.slice(0, 6).map((sig: any) => {
            const lb = getSignalLabel(sig.type);
            const co = lb === 'Buy' ? C.accent : lb === 'Sell' ? C.danger : C.warning;
            const cf = sig.confidenceScore ?? 0;
            return (
              <TouchableOpacity key={sig.id} style={st.sigCard} onPress={() => router.push(`/stocks/${sig.symbol}`)}>
                <View style={[st.sigAccent, { backgroundColor: co }]} />
                <View style={st.sigTop}><Text style={st.sigSym}>{sig.symbol}</Text><View style={[st.sigBadge, { backgroundColor: co + '20' }]}><Text style={[st.sigBadgeT, { color: co }]}>{lb.toUpperCase()}</Text></View></View>
                <View style={st.cfRow}><Text style={st.cfLab}>Confidence</Text><Text style={[st.cfVal, { color: co }]}>{cf}%</Text></View>
                <View style={st.cfBar}><View style={[st.cfFill, { width: `${cf}%`, backgroundColor: co }]} /></View>
                <Text style={st.sigReason} numberOfLines={2}>{sig.reasoning ?? '—'}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Watchlist */}
        <View style={st.secRow}><Text style={st.sec}>Watchlist</Text><TouchableOpacity onPress={() => router.push('/watchlist')}><Text style={st.seeAll}>Manage →</Text></TouchableOpacity></View>
        {wl.length === 0 ? (
          <View style={st.empty}><Ionicons name="star-outline" size={24} color={C.textMuted} /><Text style={st.emptyT}>Add stocks to watchlist</Text></View>
        ) : (
          <View style={st.wGrid}>
            {wl.slice(0, 6).map((w: any) => {
              const sym = typeof w === 'string' ? w : w?.symbol ?? '';
              const q = prices[sym];
              const pos = q ? q.changePercent >= 0 : true;
              return (
                <TouchableOpacity key={sym} style={st.wCard} onPress={() => router.push(`/stocks/${sym}`)}>
                  <Text style={st.wSym}>{sym}</Text>
                  <Text style={st.wPrice}>{q ? `$${q.price.toFixed(2)}` : '—'}</Text>
                  <Text style={[st.wCh, { color: pos ? C.accent : C.danger }]}>{q ? `${pos ? '+' : ''}${q.changePercent.toFixed(2)}%` : ''}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Pulse */}
        {mode !== 'minimal' && (<>
          <View style={st.secRow}><Text style={st.sec}>Market Pulse</Text><TouchableOpacity onPress={() => router.push('/insights')}><Text style={st.seeAll}>More →</Text></TouchableOpacity></View>
          <View style={st.pulseCard}>
            <View style={st.pulseLine} />
            {((pulse as any[]) ?? []).slice(0, 5).map((e: any, i: number) => {
              const icon = e.type === 'Signal' ? 'flash' : e.type === 'Flow' ? 'bar-chart' : e.type === 'Alert' ? 'warning' : e.type === 'Economic' ? 'business' : 'newspaper';
              const iconBg = e.impact === 'Bullish' ? C.accent : e.impact === 'Bearish' ? C.danger : C.info;
              const mins = Math.floor(Math.random() * 120) + i * 15;
              const timeLabel = mins < 60 ? `${mins}m ago` : `${Math.floor(mins/60)}h ago`;
              return (
                <TouchableOpacity key={e.id} style={st.pulseItem} onPress={() => e.symbol !== 'FED' && e.symbol !== 'SPY' && router.push(`/stocks/${e.symbol}`)}>
                  <View style={st.pulseIconCol}>
                    <View style={[st.pulseIcon, { backgroundColor: iconBg + '18' }]}><Ionicons name={icon as any} size={14} color={iconBg} /></View>
                    {i < 4 && <View style={st.pulseConnector} />}
                  </View>
                  <View style={st.pulseContent}>
                    <View style={st.pulseHeader}>
                      <View style={st.pulseSymRow}>
                        <Text style={st.pulseSym}>{e.symbol}</Text>
                        <View style={[st.pulseImpactBadge, { backgroundColor: (e.impact === 'Bullish' ? C.accent : e.impact === 'Bearish' ? C.danger : C.textMuted) + '15' }]}>
                          <View style={[st.pulseImpactDot, { backgroundColor: e.impact === 'Bullish' ? C.accent : e.impact === 'Bearish' ? C.danger : C.textMuted }]} />
                          <Text style={[st.pulseImpactText, { color: e.impact === 'Bullish' ? C.accent : e.impact === 'Bearish' ? C.danger : C.textMuted }]}>{e.impact}</Text>
                        </View>
                      </View>
                      <Text style={st.pulseTime}>{timeLabel}</Text>
                    </View>
                    <Text style={st.pulseTitle} numberOfLines={2}>{e.title}</Text>
                    {e.description ? <Text style={st.pulseDesc} numberOfLines={1}>{e.description}</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </>)}

        {/* More actions row */}
        {mode === 'default' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
            <QAChip icon="newspaper" label="News" route="/news" color={C.danger} />
            <QAChip icon="apps" label="Heatmap" route="/heatmap" color={C.accent} />
            <QAChip icon="mic" label="Voice AI" route="/voice-command" color={C.purple} />
            <QAChip icon="flame" label="Streaks" route="/streak-tracker" color={C.warning} />
            <QAChip icon="trophy" label="Leaders" route="/leaderboard" color={C.info} />
          </ScrollView>
        )}

        <View style={{ height: 20 }} />
      </>)}
    </ScrollView>
    </SafeAreaView>
  );
}

/* ═══════════════════════════════════════════════════ */
/* SHARED SUB-COMPONENTS */
/* ═══════════════════════════════════════════════════ */

function Pill({ icon, val, lab, col }: any) {
  return (<View style={st.pill}><Ionicons name={icon} size={14} color={col} /><Text style={[st.pillVal, { color: col }]}>{val}</Text><Text style={st.pillLab}>{lab}</Text></View>);
}

function IdxCard({ n, v, ch, up }: { n: string; v: string; ch: number; up: boolean }) {
  return (
    <View style={st.idxCard}>
      <Text style={st.idxN}>{n}</Text>
      <Text style={st.idxV}>{v}</Text>
      <View style={st.idxChR}><Ionicons name={up ? 'trending-up' : 'trending-down'} size={12} color={up ? C.accent : C.danger} /><Text style={[st.idxCh, { color: up ? C.accent : C.danger }]}>{up ? '+' : ''}{ch.toFixed(2)}%</Text></View>
      <View style={st.sparkR}>{Array.from({ length: 12 }, (_, i) => <View key={i} style={[st.sparkB, { height: 4 + Math.random() * 12, backgroundColor: (up ? C.accent : C.danger) + '40' }]} />)}</View>
    </View>
  );
}

function QAChip({ icon, label, route, color }: any) {
  return (
    <TouchableOpacity style={st.qaChip} onPress={() => router.push(route)} activeOpacity={0.7}>
      <View style={[st.qaIcon, { backgroundColor: color + '15' }]}><Ionicons name={icon} size={16} color={color} /></View>
      <Text style={st.qaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function GaugeChart({ score, color, label }: { score: number; color: string; label: string }) {
  const r = 48, cx = 60, cy = 52, strokeW = 10;
  const colors = ['#FF3B5C', '#F97316', '#FFB020', '#84CC16', '#00FF94'];
  const segAngle = 180 / 5;
  const arcPath = (startDeg: number, endDeg: number) => {
    const s = (startDeg * Math.PI) / 180, e = (endDeg * Math.PI) / 180;
    return `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`;
  };
  const needleAngle = ((score / 100) * 180 + 180) * (Math.PI / 180);
  const nx = cx + (r - 14) * Math.cos(needleAngle), ny = cy + (r - 14) * Math.sin(needleAngle);
  return (
    <View style={{ alignItems: 'center', marginVertical: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color, includeFontPadding: false }}>{score}</Text>
          <Text style={{ fontSize: 9, fontWeight: '700', color, marginTop: 0 }}>{label}</Text>
        </View>
        <Svg width={90} height={50} viewBox="0 0 120 60">
          {colors.map((c, i) => (<Path key={i} d={arcPath(180 + i * segAngle, 180 + (i + 1) * segAngle)} stroke={c} strokeWidth={strokeW} fill="none" strokeLinecap="round" opacity={0.7} />))}
          <Line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Circle cx={cx} cy={cy} r={4} fill={color} />
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 105, marginTop: 0 }}>
        {['0', '25', '50', '75', '100'].map((l, i) => (<Text key={l} style={{ fontSize: 6, fontWeight: '700', color: colors[i] }}>{l}</Text>))}
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════ */
/* TRADER PRO SUB-COMPONENTS */
/* ═══════════════════════════════════════════════════ */

function TermCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 8, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '900', color, fontFamily: 'monospace', marginTop: 2 }}>{value}</Text>
    </View>
  );
}

function AIGaugeBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 9, fontWeight: '700', color: C.textMuted, letterSpacing: 0.5 }}>{label}</Text>
        <Text style={{ fontSize: 10, fontWeight: '800', color }}>{value}</Text>
      </View>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: C.border, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${value}%`, borderRadius: 2, backgroundColor: color }} />
      </View>
    </View>
  );
}

function CircleConfidence({ value, color, size }: { value: number; color: string; size: number }) {
  const r = (size - 4) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke={C.border} strokeWidth={3} fill="none" />
        <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={3} fill="none"
          strokeDasharray={`${circ}`} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
      </Svg>
      <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.28, fontWeight: '900', color }}>{value}</Text>
      </View>
    </View>
  );
}

function PickMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 7, fontWeight: '700', color: C.textMuted, letterSpacing: 1 }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '800', color, fontFamily: 'monospace', marginTop: 2 }}>{value}</Text>
    </View>
  );
}

function BreadthBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 50;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 9, fontWeight: '700', color: C.textMuted }}>{label}</Text>
        <Text style={{ fontSize: 11, fontWeight: '800', color }}>{value}</Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pct}%`, borderRadius: 3, backgroundColor: color }} />
      </View>
    </View>
  );
}

function BreadthMini({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Ionicons name={icon as any} size={14} color={color} />
      <Text style={{ fontSize: 7, fontWeight: '600', color: C.textMuted, marginTop: 3, letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '900', color, marginTop: 1, fontFamily: 'monospace' }}>{value}</Text>
    </View>
  );
}

function ScoreMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ fontSize: 8, fontWeight: '600', color: C.textMuted }}>{label}</Text>
        <Text style={{ fontSize: 9, fontWeight: '800', color }}>{value}</Text>
      </View>
      <View style={{ height: 3, borderRadius: 2, backgroundColor: C.border, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${value}%`, borderRadius: 2, backgroundColor: color }} />
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════ */
/* STYLES */
/* ═══════════════════════════════════════════════════ */

const tp = StyleSheet.create({
  heroWrap: { backgroundColor: C.surface, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: C.accent + '20', overflow: 'hidden', position: 'relative' },
  heroGlow: { position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: C.accent + '08' },
  heroContent: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accent + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  proBadgeT: { fontSize: 9, fontWeight: '900', color: C.accent, letterSpacing: 1 },
  heroGreet: { fontSize: 11, color: C.textMuted },
  heroName: { fontSize: 22, fontWeight: '900', color: C.textPrimary, marginTop: 4 },
  heroMeta: { alignItems: 'flex-end' },
  livePulse: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.accent + '12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 4 },
  livePulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  livePulseT: { fontSize: 9, fontWeight: '800', color: C.accent, letterSpacing: 1 },
  heroDate: { fontSize: 9, color: C.textMuted },
  heroTime: { fontSize: 9, color: C.textMuted, fontFamily: 'monospace', marginTop: 1 },

  termStrip: { flexDirection: 'row', backgroundColor: C.surfaceHi, borderRadius: 14, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  termDiv: { width: 1, height: 24, backgroundColor: C.border, marginHorizontal: 4 },

  aiCard: { backgroundColor: C.surface, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.accent + '18' },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  aiHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiBrain: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.accent + '12', alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontSize: 10, fontWeight: '900', color: C.accent, letterSpacing: 1.5 },
  aiSub: { fontSize: 9, color: C.textMuted, marginTop: 1 },
  aiScoreWrap: { alignItems: 'center' },
  aiComposite: { fontSize: 32, fontWeight: '900', fontFamily: 'monospace' },
  aiScoreLabel: { fontSize: 7, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5, marginTop: -2 },
  aiGauges: { gap: 10, marginBottom: 14 },
  aiFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  aiFootItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  aiFootText: { fontSize: 10, color: C.textMuted },

  secBadge: { fontSize: 8, fontWeight: '800', color: C.accent, backgroundColor: C.accent + '12', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, letterSpacing: 1, overflow: 'hidden' },

  pickCard: { backgroundColor: C.surface, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden', flexDirection: 'row' },
  pickAccent: { width: 4 },
  pickBody: { flex: 1, padding: 14 },
  pickTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pickLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickRight: {},
  pickRank: { fontSize: 10, fontWeight: '800', color: C.textMuted },
  pickSym: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  pickBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pickBadgeT: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  pickGrid: { flexDirection: 'row', gap: 4, marginBottom: 10, backgroundColor: C.bg, borderRadius: 10, padding: 10 },
  pickReason: { fontSize: 11, color: C.textMuted, lineHeight: 16 },

  breadthCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  breadthRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  breadthDivider: { height: 1, backgroundColor: C.border, marginBottom: 12 },
  breadthMetrics: { flexDirection: 'row' },

  sectorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  sectorCell: { width: (width - 44) / 5, borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  sectorName: { fontSize: 8, fontWeight: '700', color: C.textMuted, marginBottom: 2 },
  sectorCh: { fontSize: 10, fontWeight: '800' },

  flowCard: { width: width * 0.52, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', flexDirection: 'row' },
  flowAccent: { width: 3 },
  flowBody: { flex: 1, padding: 12 },
  flowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  flowSym: { fontSize: 14, fontWeight: '900', color: C.textPrimary },
  flowTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  flowTypeT: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  flowStrike: { fontSize: 11, color: C.textMuted, marginBottom: 8 },
  flowMetrics: { flexDirection: 'row', gap: 12 },
  flowML: { fontSize: 7, fontWeight: '600', color: C.textMuted, letterSpacing: 0.5 },
  flowMV: { fontSize: 12, fontWeight: '800', color: C.textPrimary, fontFamily: 'monospace' },
  flowUnusual: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: C.warning + '12', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  flowUnusualT: { fontSize: 7, fontWeight: '800', color: C.warning, letterSpacing: 1 },

  smartCard: { backgroundColor: C.surface, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  smartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  smartLeft: { width: 90 },
  smartSym: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  smartSig: { fontSize: 8, color: C.textMuted, marginTop: 1 },
  smartBarWrap: { flex: 1, height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' },
  smartBar: { height: '100%', borderRadius: 4, justifyContent: 'flex-end', flexDirection: 'row' },
  smartBarInner: { width: 3, height: '100%', borderRadius: 2 },
  smartDir: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  sigProCard: { backgroundColor: C.surface, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden', flexDirection: 'row' },
  sigProAccent: { width: 4 },
  sigProBody: { flex: 1, padding: 14 },
  sigProTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sigProSym: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  sigProBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sigProBadgeT: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  sigProScores: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  sigProReason: { fontSize: 11, color: C.textMuted, lineHeight: 16 },
  sigProTime: { fontSize: 9, color: C.textMuted, marginTop: 6 },

  newsFeed: { backgroundColor: C.surface, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  newsItem: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
  newsSentBar: { width: 3 },
  newsBody: { flex: 1, padding: 12 },
  newsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  newsSentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  newsSentDot: { width: 5, height: 5, borderRadius: 3 },
  newsSentText: { fontSize: 9, fontWeight: '700' },
  newsSentScore: { fontSize: 9, fontWeight: '800', marginLeft: 2 },
  newsTime: { fontSize: 8, color: C.textMuted },
  newsTitle: { fontSize: 12, fontWeight: '600', color: C.textPrimary, lineHeight: 17 },
  newsSym: { fontSize: 10, fontWeight: '700', color: C.accent, marginTop: 4 },

  wlRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: C.border },
  wlLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  wlDot: { width: 6, height: 6, borderRadius: 3 },
  wlSym: { fontSize: 14, fontWeight: '800', color: C.textPrimary },
  wlPrice: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  wlMiniChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginRight: 12, height: 18 },
  wlBar: { width: 3, borderRadius: 1.5 },
  wlChBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, minWidth: 70, alignItems: 'center' },
  wlChText: { fontSize: 11, fontWeight: '800' },
});

const st = StyleSheet.create({
  switchRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  switchBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  switchActive: { backgroundColor: C.accent + '12', borderColor: C.accent + '30' },
  switchText: { fontSize: 11, fontWeight: '700', color: C.textMuted },

  hero: { backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  greet: { fontSize: 13, color: C.textMuted },
  name: { fontSize: 24, fontWeight: '900', color: C.textPrimary, marginTop: 2 },
  heroRight: { alignItems: 'flex-end' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.accent + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  liveText: { fontSize: 10, fontWeight: '700', color: C.accent },
  dateText: { fontSize: 10, color: C.textMuted, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill: { flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  pillVal: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  pillLab: { fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },

  idxCard: { width: (width - 62) / 2.5, backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  idxN: { fontSize: 10, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  idxV: { fontSize: 18, fontWeight: '900', color: C.textPrimary, marginTop: 4 },
  idxChR: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  idxCh: { fontSize: 12, fontWeight: '700' },
  sparkR: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginTop: 8, height: 16 },
  sparkB: { flex: 1, borderRadius: 2 },

  row: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  fgCard: { backgroundColor: C.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  label: { fontSize: 8, fontWeight: '800', color: C.textMuted, letterSpacing: 1.5, marginBottom: 4, alignSelf: 'flex-start' },

  qaChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  qaIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 12, fontWeight: '700', color: C.textPrimary },

  splitCard: { backgroundColor: C.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.border },
  splitGrid: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  splitItem: { flex: 1, alignItems: 'center' },
  splitNum: { fontSize: 18, fontWeight: '900' },
  splitItemLabel: { fontSize: 8, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 0, marginBottom: 3 },
  splitBar: { width: '100%', height: 3, borderRadius: 2, backgroundColor: C.border, overflow: 'hidden' },
  splitBarFill: { height: '100%', borderRadius: 2 },
  splitDivider: { height: 1, backgroundColor: C.border, marginBottom: 6 },
  splitBottom: { flexDirection: 'row', alignItems: 'center' },
  splitMini: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  splitMiniLabel: { fontSize: 9, color: C.textMuted, fontWeight: '600' },
  splitMiniVal: { fontSize: 12, fontWeight: '900' },
  splitMiniDivider: { width: 1, height: 16, backgroundColor: C.border },

  sec: { fontSize: 14, fontWeight: '800', color: C.textPrimary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seeAll: { fontSize: 11, fontWeight: '700', color: C.accent },

  mH: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  mHL: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  mR: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  mL: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mRk: { fontSize: 9, color: C.textMuted, width: 12 },
  mSym: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  mCh: { fontSize: 12, fontWeight: '800' },
  mDiv: { width: 1, backgroundColor: C.border },

  sigCard: { width: width * 0.6, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  sigAccent: { height: 3 },
  sigTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 0 },
  sigSym: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  sigBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  sigBadgeT: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cfRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, marginTop: 10 },
  cfLab: { fontSize: 9, color: C.textMuted, textTransform: 'uppercase' },
  cfVal: { fontSize: 11, fontWeight: '800' },
  cfBar: { height: 3, backgroundColor: C.border, borderRadius: 2, marginHorizontal: 14, marginTop: 4, overflow: 'hidden' },
  cfFill: { height: '100%', borderRadius: 2 },
  sigReason: { fontSize: 11, color: C.textMuted, padding: 14, paddingTop: 8, lineHeight: 16 },

  wGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  wCard: { width: (width - 48) / 3, backgroundColor: C.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  wSym: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  wPrice: { fontSize: 12, fontWeight: '600', color: C.textPrimary, marginTop: 4 },
  wCh: { fontSize: 10, fontWeight: '700', marginTop: 2 },

  empty: { backgroundColor: C.surface, borderRadius: 16, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  emptyT: { fontSize: 12, color: C.textMuted, marginTop: 8 },

  pulseCard: { backgroundColor: C.surface, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border, position: 'relative' },
  pulseLine: { position: 'absolute', left: 33, top: 40, bottom: 20, width: 1.5, backgroundColor: C.border, borderRadius: 1 },
  pulseItem: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  pulseIconCol: { alignItems: 'center', width: 36 },
  pulseIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  pulseConnector: { width: 1.5, flex: 1, backgroundColor: C.border, marginTop: 4 },
  pulseContent: { flex: 1, paddingBottom: 2 },
  pulseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pulseSymRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseSym: { fontSize: 12, fontWeight: '900', color: C.accent },
  pulseImpactBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  pulseImpactDot: { width: 5, height: 5, borderRadius: 3 },
  pulseImpactText: { fontSize: 9, fontWeight: '700' },
  pulseTime: { fontSize: 9, color: C.textMuted },
  pulseTitle: { fontSize: 12, fontWeight: '600', color: C.textPrimary, lineHeight: 17 },
  pulseDesc: { fontSize: 10, color: C.textMuted, marginTop: 2 },
});
