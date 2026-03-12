import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
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

const VOICE_HISTORY_KEY = 'sf-voice-history';

const SUGGESTIONS = [
  'Top gainers today',
  'Show buy signals',
  'Tech stocks under $50',
  'What is NVDA price?',
  'High dividend yield stocks',
  'Best performing ETFs',
];

type ResultItem = {
  symbol: string;
  name: string;
  [key: string]: any;
};

type QueryResult = {
  interpretation: string;
  results: ResultItem[];
};

type HistoryEntry = {
  query: string;
  interpretation: string;
  resultCount: number;
  timestamp: number;
};

export default function VoiceCommandScreen() {
  const COLORS = useTheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [inputExpanded, setInputExpanded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    AsyncStorage.getItem(VOICE_HISTORY_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
            setHistory(parsed);
          } else {
            setHistory([]);
          }
        } catch {
          setHistory([]);
        }
      }
    });
    return () => { Speech.stop(); };
  }, []);

  const saveHistory = async (entry: HistoryEntry) => {
    const next = [entry, ...history.slice(0, 29)];
    setHistory(next);
    await AsyncStorage.setItem(VOICE_HISTORY_KEY, JSON.stringify(next));
  };

  const speakResponse = useCallback((text: string) => {
    Speech.stop();
    setSpeaking(true);
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setSpeaking(false);
  }, []);

  const handleSubmit = async (q?: string) => {
    const text = (q ?? query).trim();
    if (!text || loading) return;

    Vibration.vibrate(50);
    setLoading(true);
    setError(null);
    setResponse(null);
    if (q) setQuery(q);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    );
    pulseLoop.start();

    try {
      const res = await api.post('/ai/natural-query', { query: text });
      const data = res.data as QueryResult;
      setResponse(data);

      await saveHistory({
        query: text,
        interpretation: data.interpretation || '',
        resultCount: data.results?.length ?? 0,
        timestamp: Date.now(),
      });

      if (data.interpretation) {
        const resultSummary = data.results?.length
          ? ` I found ${data.results.length} result${data.results.length === 1 ? '' : 's'}.`
          : '';
        speakResponse(data.interpretation + resultSummary);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to process query';
      setError(msg);
    } finally {
      pulseLoop.stop();
      pulseAnim.setValue(1);
      setLoading(false);
    }
  };

  const handleMicPress = () => {
    if (loading) return;
    Vibration.vibrate(50);
    setInputExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const extraKeys = (item: ResultItem) =>
    Object.entries(item).filter(([k]) => k !== 'symbol' && k !== 'name');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Ionicons name="mic" size={24} color={COLORS.accent} />
          <Text style={styles.headerTitle}>AI Voice Command</Text>
          {speaking && (
            <TouchableOpacity onPress={stopSpeaking} style={styles.stopSpeakBtn}>
              <Ionicons name="volume-mute" size={18} color={COLORS.danger} />
              <Text style={styles.stopSpeakText}>Stop</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Mic button */}
          <TouchableOpacity
            style={styles.micWrap}
            onPress={handleMicPress}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Animated.View
              style={[
                styles.micBtn,
                loading && { transform: [{ scale: pulseAnim }], borderColor: COLORS.info },
              ]}
            >
              <Ionicons
                name={loading ? 'pulse' : speaking ? 'volume-high' : 'mic-outline'}
                size={48}
                color={loading ? COLORS.info : COLORS.accent}
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.tapLabel}>
            {loading ? 'Processing...' : speaking ? 'Speaking response...' : 'Tap to ask AI'}
          </Text>

          {/* Text input area */}
          {(inputExpanded || query.length > 0) && (
            <View style={styles.inputSection}>
              <View style={styles.inputWrapper}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.textMuted} />
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="Type your query..."
                  placeholderTextColor={COLORS.textMuted}
                  value={query}
                  onChangeText={setQuery}
                  multiline
                  returnKeyType="send"
                  onSubmitEditing={() => handleSubmit()}
                />
              </View>
              <TouchableOpacity
                style={[styles.sendBtn, (!query.trim() || loading) && styles.btnDisabled]}
                onPress={() => handleSubmit()}
                disabled={!query.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.bg} size="small" />
                ) : (
                  <Ionicons name="arrow-forward" size={20} color={COLORS.bg} />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Suggestions */}
          {!response && !loading && !error && (
            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionsTitle}>Try asking</Text>
              <View style={styles.chipGrid}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestionChip}
                    onPress={() => handleSubmit(s)}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Error */}
          {error && (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* AI Response */}
          {response && (
            <View style={styles.responseSection}>
              {response.interpretation ? (
                <View style={styles.interpretCard}>
                  <View style={styles.interpretHeader}>
                    <Ionicons name="bulb-outline" size={16} color={COLORS.purple} />
                    <Text style={styles.interpretLabel}>AI Interpretation</Text>
                    <TouchableOpacity
                      onPress={() => speakResponse(response.interpretation)}
                      style={styles.replayBtn}
                    >
                      <Ionicons
                        name={speaking ? 'volume-high' : 'volume-medium-outline'}
                        size={16}
                        color={COLORS.accent}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.interpretText}>{response.interpretation}</Text>
                </View>
              ) : null}

              {response.interpretation ? (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.surface, borderRadius: 12, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border }}
                  onPress={() => Clipboard.setStringAsync(response.interpretation)}
                >
                  <Ionicons name="copy-outline" size={16} color={COLORS.textMuted} />
                  <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Copy Response</Text>
                </TouchableOpacity>
              ) : null}

              {(response.results ?? []).length > 0 && (
                <View style={styles.resultsContainer}>
                  <Text style={styles.resultsTitle}>
                    {response.results.length} Result{response.results.length === 1 ? '' : 's'}
                  </Text>
                  {response.results.map((item, i) => (
                    <TouchableOpacity
                      key={`${item.symbol}-${i}`}
                      style={styles.resultCard}
                      activeOpacity={0.7}
                      onPress={() => item.symbol && router.push(`/stocks/${item.symbol}` as any)}
                    >
                      <View style={styles.resultHeader}>
                        <Text style={styles.resultSymbol}>{item.symbol}</Text>
                        <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                      </View>
                      {extraKeys(item).length > 0 && (
                        <View style={styles.extraRow}>
                          {extraKeys(item).map(([k, v]) => (
                            <View key={k} style={styles.extraChip}>
                              <Text style={styles.extraLabel}>{k}</Text>
                              <Text style={styles.extraValue}>
                                {typeof v === 'number' ? v.toFixed(2) : String(v)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {(response.results ?? []).length === 0 && (
                <View style={styles.centered}>
                  <Ionicons name="search-outline" size={40} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>No matching results</Text>
                </View>
              )}
            </View>
          )}

          {/* History */}
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Query History</Text>
            {history.length === 0 ? (
              <Text style={styles.emptyText}>No queries yet</Text>
            ) : (
              history.map((entry, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.historyItem}
                  onPress={() => handleSubmit(entry.query)}
                  activeOpacity={0.7}
                >
                  <View style={styles.historyRow}>
                    <Ionicons name="chatbubble-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.historyQuery} numberOfLines={1}>{entry.query}</Text>
                  </View>
                  {entry.interpretation ? (
                    <Text style={styles.historyResponse} numberOfLines={2}>
                      {entry.interpretation}
                    </Text>
                  ) : null}
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyMetaText}>
                      {entry.resultCount} result{entry.resultCount === 1 ? '' : 's'}
                    </Text>
                    <Text style={styles.historyMetaText}>
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  stopSpeakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.danger + '20',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stopSpeakText: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },
  scroll: { flexGrow: 1, padding: 24, alignItems: 'center', paddingBottom: 32 },
  micWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 16 },
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
  tapLabel: { fontSize: 16, color: COLORS.textMuted, marginTop: 12 },
  inputSection: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 20,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    minHeight: 24,
    maxHeight: 80,
    lineHeight: 20,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  suggestionsSection: { width: '100%', marginTop: 24 },
  suggestionsTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, marginBottom: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: { fontSize: 13, color: COLORS.textPrimary },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: COLORS.danger + '15',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.danger, lineHeight: 18 },
  responseSection: { width: '100%', marginTop: 20 },
  interpretCard: {
    backgroundColor: COLORS.purple + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  interpretHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  interpretLabel: { fontSize: 12, fontWeight: '600', color: COLORS.purple, flex: 1 },
  replayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  interpretText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  resultsContainer: { width: '100%' },
  resultsTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, marginBottom: 10 },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 10,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  resultSymbol: { fontSize: 16, fontWeight: '700', color: COLORS.accent },
  resultName: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  extraRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  extraChip: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  extraLabel: { fontSize: 10, color: COLORS.textMuted, marginBottom: 2 },
  extraValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  centered: { alignItems: 'center', paddingTop: 40 },
  historySection: {
    width: '100%',
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  historyTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, marginBottom: 12 },
  historyItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyQuery: { fontSize: 14, color: COLORS.textPrimary, flex: 1, fontWeight: '500' },
  historyResponse: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
    marginLeft: 26,
    lineHeight: 16,
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginLeft: 26,
  },
  historyMetaText: { fontSize: 11, color: COLORS.textMuted },
  emptyText: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic' },
});
