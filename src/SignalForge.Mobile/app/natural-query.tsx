import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/api/client';
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

type ResultItem = {
  symbol: string;
  name: string;
  [key: string]: any;
};

type QueryResult = {
  interpretation: string;
  results: ResultItem[];
};

const SUGGESTIONS = [
  'Top gainers today',
  'Tech stocks under $50',
  'High dividend yield stocks',
  'Stocks near 52-week low',
  'Best performing ETFs this month',
  'Companies with earnings beat',
];

export default function NaturalQueryScreen() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const HISTORY_KEY = 'sf-natural-query-history';

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then(raw => {
      if (raw) setHistory(JSON.parse(raw));
    }).catch(() => {});
  }, []);

  const { mutate, data, isPending, reset } = useMutation({
    mutationFn: async (q: string) => {
      const res = await api.post('/ai/natural-query', { query: q });
      return res.data as QueryResult;
    },
  });

  const handleSearch = (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    if (q) setQuery(q);
    const newHistory = [searchQuery, ...history.filter(h => h !== searchQuery)].slice(0, 10);
    setHistory(newHistory);
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory)).catch(() => {});
    mutate(searchQuery);
  };

  const extraKeys = (item: ResultItem) =>
    Object.entries(item).filter(([k]) => k !== 'symbol' && k !== 'name');

  const renderResult = ({ item }: { item: ResultItem }) => (
    <TouchableOpacity
      style={styles.resultCard}
      activeOpacity={0.7}
      onPress={() => item.symbol && router.push(`/stocks/${item.symbol}`)}
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
              <Text style={styles.extraValue}>{typeof v === 'number' ? v.toFixed(2) : String(v)}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.inputSection}>
          <View style={styles.inputWrapper}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={C.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Ask anything about stocks..."
              placeholderTextColor={C.textMuted}
              value={query}
              onChangeText={(t) => { setQuery(t); if (!t.trim()) reset(); }}
              multiline
              returnKeyType="search"
              onSubmitEditing={() => handleSearch()}
            />
          </View>
          <TouchableOpacity
            style={[styles.searchBtn, (!query.trim() || isPending) && styles.btnDisabled]}
            onPress={() => handleSearch()}
            disabled={!query.trim() || isPending}
          >
            {isPending ? (
              <ActivityIndicator color={C.bg} size="small" />
            ) : (
              <Ionicons name="arrow-forward" size={20} color={C.bg} />
            )}
          </TouchableOpacity>
        </View>

        {!data && !isPending && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>Try asking</Text>
            <View style={styles.chipGrid}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => handleSearch(s)}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {history.length > 0 && !data && (
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.textMuted }}>Recent Queries</Text>
              <TouchableOpacity onPress={() => { setHistory([]); AsyncStorage.removeItem(HISTORY_KEY).catch(() => {}); }}>
                <Text style={{ fontSize: 11, color: C.textMuted }}>Clear</Text>
              </TouchableOpacity>
            </View>
            {history.map((h, i) => (
              <TouchableOpacity key={i} onPress={() => setQuery(h)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
                <Ionicons name="time-outline" size={16} color={C.textMuted} />
                <Text style={{ fontSize: 14, color: C.textPrimary, flex: 1 }} numberOfLines={1}>{h}</Text>
                <Ionicons name="arrow-forward" size={14} color={C.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {data && (
          <>
            {data.interpretation ? (
              <View style={styles.interpretCard}>
                <Ionicons name="bulb-outline" size={16} color={C.purple} />
                <Text style={styles.interpretText}>{data.interpretation}</Text>
              </View>
            ) : null}
            <FlatList
              style={{ flex: 1 }}
              contentContainerStyle={styles.resultList}
              data={data.results ?? []}
              keyExtractor={(item, i) => `${item.symbol}-${i}`}
              renderItem={renderResult}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Ionicons name="search-outline" size={48} color={C.textMuted} />
                  <Text style={styles.emptyText}>No results found</Text>
                </View>
              }
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, padding: 16 },
  inputSection: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 15,
    minHeight: 24,
    maxHeight: 80,
    lineHeight: 20,
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  suggestionsSection: { marginTop: 8 },
  suggestionsTitle: { fontSize: 14, fontWeight: '600', color: C.textMuted, marginBottom: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: { fontSize: 13, color: C.textPrimary },
  interpretCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: C.purple + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  interpretText: { flex: 1, fontSize: 13, color: C.purple, lineHeight: 18 },
  resultList: { paddingBottom: 20 },
  resultCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 10,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  resultSymbol: { fontSize: 16, fontWeight: '700', color: C.accent },
  resultName: { fontSize: 13, color: C.textMuted, flex: 1 },
  extraRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  extraChip: {
    backgroundColor: C.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  extraLabel: { fontSize: 10, color: C.textMuted, marginBottom: 2 },
  extraValue: { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  centered: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: C.textMuted, marginTop: 12 },
});
