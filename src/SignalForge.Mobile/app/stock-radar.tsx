import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

const SCAN_COUNT_KEY = 'sf-radar-scan-count';

type Signal = {
  id: string;
  symbol: string;
  type: string;
  confidenceScore?: number;
};

function getDotColor(type: string): string {
  const t = String(type);
  if (t === 'Buy' || t === '0') return COLORS.accent;
  if (t === 'Sell' || t === '1') return COLORS.danger;
  return COLORS.warning;
}

export default function StockRadarScreen() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<Signal[]>([]);
  const [scanCount, setScanCount] = useState(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(SCAN_COUNT_KEY).then((v) => {
      setScanCount(parseInt(v || '0', 10));
    });
  }, []);

  const startScan = () => {
    setScanning(true);
    setResults([]);
    const rotation = Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    );
    rotation.start();

    setTimeout(() => {
      rotation.stop();
      rotationAnim.setValue(0);
      setScanning(false);
      api
        .get<Signal[]>('/signals', { params: { limit: 8 } })
        .then((r) => setResults(Array.isArray(r.data) ? r.data : []))
        .catch(() => setResults([]));
      AsyncStorage.getItem(SCAN_COUNT_KEY).then((v) => {
        const next = parseInt(v || '0', 10) + 1;
        setScanCount(next);
        AsyncStorage.setItem(SCAN_COUNT_KEY, String(next));
      });
    }, 3000);
  };

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Stock Radar</Text>
        {scanCount > 0 && (
          <Text style={styles.scanCount}>Scans: {scanCount}</Text>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!scanning && results.length === 0 && (
          <TouchableOpacity style={styles.startBtn} onPress={startScan}>
            <Ionicons name="radio" size={36} color={COLORS.bg} />
            <Text style={styles.startBtnText}>Start Scan</Text>
          </TouchableOpacity>
        )}

        {scanning && (
          <View style={styles.scanWrap}>
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />
            <View style={[styles.circle, styles.circle3]} />
            <Animated.View style={[styles.radarLine, { transform: [{ rotate: spin }] }]} />
            <Text style={styles.scanningText}>Scanning...</Text>
          </View>
        )}

        {!scanning && results.length > 0 && (
          <>
            <Text style={styles.resultsTitle}>Detected Stocks</Text>
            {results.map((s) => (
              <View key={s.id} style={styles.resultCard}>
                <View style={[styles.dot, { backgroundColor: getDotColor(s.type) }]} />
                <View style={styles.resultContent}>
                  <Text style={styles.resultSymbol}>{s.symbol}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: getDotColor(s.type) + '33' }]}>
                    <Text style={[styles.typeText, { color: getDotColor(s.type) }]}>
                      {s.type === 'Buy' || s.type === '0' ? 'Buy' : s.type === 'Sell' || s.type === '1' ? 'Sell' : 'Hold'}
                    </Text>
                  </View>
                </View>
                {s.confidenceScore != null && (
                  <Text style={styles.confidence}>{Math.round(s.confidenceScore * 100)}%</Text>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.scanAgainBtn} onPress={startScan}>
              <Ionicons name="refresh" size={22} color={COLORS.accent} />
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const centerSize = 120;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  scanCount: { fontSize: 14, color: COLORS.textMuted },
  scroll: { flexGrow: 1, padding: 24, alignItems: 'center', paddingBottom: 40 },
  startBtn: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    gap: 12,
  },
  startBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.bg },
  scanWrap: {
    width: centerSize + 120,
    height: centerSize + 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.accent + '66',
  },
  circle1: { width: 80, height: 80 },
  circle2: { width: 140, height: 140 },
  circle3: { width: 200, height: 200 },
  radarLine: {
    position: 'absolute',
    width: 2,
    height: 110,
    backgroundColor: COLORS.accent,
    top: 5,
  },
  scanningText: { marginTop: 160, fontSize: 16, color: COLORS.textMuted },
  resultsTitle: {
    width: '100%',
    fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 16,
  },
  resultCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 14 },
  resultContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultSymbol: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 12, fontWeight: '600' },
  confidence: { fontSize: 14, color: COLORS.accent, fontWeight: '600' },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 12,
  },
  scanAgainText: { fontSize: 16, fontWeight: '600', color: COLORS.accent },
});
