import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Vibration,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/api/client';

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

const WATCH_KEY = 'sf-swiped-watch';

type Signal = {
  id: string;
  symbol: string;
  type: string;
  confidenceScore: number;
  reasoning?: string;
  technicalScore?: number;
  sentimentScore?: number;
  optionsScore?: number;
};

function getBadgeColor(type: string): string {
  const t = String(type);
  if (t === 'Buy' || t === '0') return COLORS.accent;
  if (t === 'Sell' || t === '1') return COLORS.danger;
  return COLORS.warning;
}

export default function SwipeSignalsScreen() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [watched, setWatched] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [flashColor, setFlashColor] = useState('rgba(255,59,92,0.2)');
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    api.get<Signal[]>('/signals', { params: { limit: 15 } })
      .then((r) => setSignals(Array.isArray(r.data) ? r.data : []))
      .catch(() => setSignals([]))
      .finally(() => setLoading(false));
  }, []);

  const current = signals[currentIndex];
  const total = signals.length;
  const allDone = currentIndex >= total && total > 0;

  const flashFeedback = (color: string) => {
    setFlashColor(color === COLORS.danger ? 'rgba(255,59,92,0.25)' : 'rgba(0,255,148,0.25)');
    flashAnim.setValue(1);
    Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const handleSkip = () => {
    if (!current) return;
    Vibration.vibrate(30);
    flashFeedback(COLORS.danger);
    setSkipped((s) => s + 1);
    setCurrentIndex((i) => i + 1);
  };

  const handleWatch = async () => {
    if (!current) return;
    Vibration.vibrate(30);
    try {
      const raw = await AsyncStorage.getItem(WATCH_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(current.symbol)) list.push(current.symbol);
      await AsyncStorage.setItem(WATCH_KEY, JSON.stringify(list));
    } catch {}
    flashFeedback(COLORS.accent);
    setWatched((w) => w + 1);
    setCurrentIndex((i) => i + 1);
  };

  const handleAnalyze = () => {
    if (!current) return;
    router.push(`/stocks/${current.symbol}`);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setWatched(0);
    setSkipped(0);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading signals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Signal Swiper</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>Watched: {watched}</Text>
          <Text style={styles.statsText}>Skipped: {skipped}</Text>
        </View>
        {!allDone && total > 0 && (
          <Text style={styles.counter}>
            {currentIndex + 1} of {total}
          </Text>
        )}
      </View>
      <Animated.View
        style={[
          styles.flashOverlay,
          { backgroundColor: flashColor, opacity: flashAnim },
        ]}
        pointerEvents="none"
      />
      {allDone ? (
        <View style={styles.doneWrap}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.accent} />
          <Text style={styles.doneTitle}>All caught up!</Text>
          <Text style={styles.doneSub}>You've reviewed all {total} signals.</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Reset & Swipe Again</Text>
          </TouchableOpacity>
        </View>
      ) : current ? (
        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <Text style={styles.symbol}>{current.symbol}</Text>
            <View style={[styles.badge, { backgroundColor: getBadgeColor(current.type) + '33' }]}>
              <Text style={[styles.badgeText, { color: getBadgeColor(current.type) }]}>
                {current.type === 'Buy' || current.type === '0' ? 'Buy' : current.type === 'Sell' || current.type === '1' ? 'Sell' : 'Hold'}
              </Text>
            </View>
            <View style={styles.confidenceRow}>
              <Text style={styles.confidenceLabel}>
                {Math.round((current.confidenceScore ?? 0) * 100)}% confidence
              </Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    {
                      width: `${Math.round((current.confidenceScore ?? 0) * 100)}%`,
                      backgroundColor: getBadgeColor(current.type),
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.reasoning}>{current.reasoning || 'No reasoning provided.'}</Text>
          </View>
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} onPress={handleSkip}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
              <Text style={styles.actionBtnText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.analyzeBtn]} onPress={handleAnalyze}>
              <Ionicons name="arrow-up" size={24} color="#FFF" />
              <Text style={styles.actionBtnText}>Analyze</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.watchBtn]} onPress={handleWatch}>
              <Ionicons name="arrow-forward" size={24} color="#FFF" />
              <Text style={styles.actionBtnText}>Watch</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No signals available</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 16, color: COLORS.textMuted },
  emptyText: { fontSize: 16, color: COLORS.textMuted },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  statsText: { fontSize: 14, color: COLORS.textMuted },
  counter: { fontSize: 14, color: COLORS.accent, fontWeight: '600' },
  flashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  doneWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  doneTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  doneSub: { fontSize: 16, color: COLORS.textMuted, marginBottom: 16 },
  resetBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
  },
  resetBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.bg },
  cardWrap: { flex: 1, padding: 32, justifyContent: 'space-between' },
  card: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  symbol: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginBottom: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  confidenceRow: { marginBottom: 12 },
  confidenceLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 6 },
  confidenceBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  confidenceFill: { height: '100%', borderRadius: 3 },
  reasoning: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 24 },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 6,
  },
  skipBtn: { backgroundColor: COLORS.danger },
  analyzeBtn: { backgroundColor: COLORS.info },
  watchBtn: { backgroundColor: COLORS.accent },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
