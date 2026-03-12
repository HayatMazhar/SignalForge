import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const VOICE_HISTORY_KEY = 'sf-voice-history';
const RECOGNIZED_COMMANDS = [
  'Analyze AAPL',
  'Show buy signals',
  'What is NVDA price?',
  'Open portfolio',
  'Show top movers',
];

function parseCommand(cmd: string): string | null {
  const lower = cmd.toLowerCase();
  // Stock symbol: look for 2-5 uppercase letters (AAPL, NVDA, TSLA, etc.)
  const symbolMatch = cmd.match(/\b([A-Z]{2,5})\b/);
  if (symbolMatch) return `/stocks/${symbolMatch[1]}`;
  if (lower.includes('signal')) return '/(tabs)/signals';
  if (lower.includes('portfolio')) return '/(tabs)/portfolio';
  if (lower.includes('top mover')) return '/(tabs)/market';
  return null;
}

export default function VoiceCommandScreen() {
  const [listening, setListening] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(VOICE_HISTORY_KEY).then((raw) => {
      if (raw) setHistory(JSON.parse(raw));
    });
  }, []);

  const saveHistory = async (cmd: string) => {
    const next = [cmd, ...history.slice(0, 49)];
    setHistory(next);
    await AsyncStorage.setItem(VOICE_HISTORY_KEY, JSON.stringify(next));
  };

  const handlePress = () => {
    if (listening) return;
    Vibration.vibrate(50);
    setListening(true);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      { iterations: -1 }
    );
    pulseLoop.start();

    setTimeout(() => {
      pulseLoop.stop();
      pulseAnim.setValue(1);
      setListening(false);
      const cmd = RECOGNIZED_COMMANDS[Math.floor(Math.random() * RECOGNIZED_COMMANDS.length)];
      saveHistory(cmd);
      const route = parseCommand(cmd);
      if (route) router.push(route as any);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Ionicons name="mic" size={24} color={COLORS.accent} />
        <Text style={styles.headerTitle}>AI Voice Command</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.micWrap}
          onPress={handlePress}
          activeOpacity={0.8}
          disabled={listening}
        >
          <Animated.View style={[styles.micBtn, listening && { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name={listening ? 'mic' : 'mic-outline'} size={48} color={COLORS.accent} />
          </Animated.View>
        </TouchableOpacity>
        <Text style={styles.tapLabel}>
          {listening ? 'Listening...' : 'Tap to speak'}
        </Text>
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Command History</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No commands yet</Text>
          ) : (
            (history ?? []).map((cmd, i) => (
              <View key={i} style={styles.historyItem}>
                <Ionicons name="chatbubble-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.historyText}>{cmd}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  scroll: { flexGrow: 1, padding: 24, alignItems: 'center', paddingBottom: 32 },
  micWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  micBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapLabel: { fontSize: 16, color: COLORS.textMuted, marginTop: 16 },
  historySection: {
    width: '100%',
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  historyTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, marginBottom: 12 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyText: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic' },
});
