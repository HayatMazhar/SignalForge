import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../src/api/client';

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

const PRESETS = [
  { id: 'oversold', label: 'Oversold Gems', query: 'Show me oversold stocks with RSI under 30' },
  { id: 'momentum', label: 'Momentum Plays', query: 'Show me bullish stocks with strong momentum' },
  { id: 'dividend', label: 'Dividend Kings', query: 'Show me stocks with high dividend yield' },
  { id: 'ai', label: 'AI Favorites', query: 'Show me top AI recommended stocks' },
  { id: 'breakout', label: 'Breakout Candidates', query: 'Show me top gainers today' },
];

type ResultItem = { symbol: string; name: string; [key: string]: any };
type QueryResult = { interpretation?: string; results: ResultItem[] };

export default function AiScreenerScreen() {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');

  const { mutate, data, isPending } = useMutation({
    mutationFn: async (query: string) => {
      const res = await api.post('/ai/natural-query', { query });
      return res.data as QueryResult;
    },
  });

  const results = data?.results ?? [];

  const handlePreset = (preset: (typeof PRESETS)[0]) => {
    setActivePreset(preset.id);
    mutate(preset.query);
  };

  const handleCustom = () => {
    if (!customQuery.trim()) return;
    setActivePreset(null);
    mutate(customQuery);
  };

  const extraKeys = (item: ResultItem) =>
    Object.entries(item).filter(([k]) => k !== 'symbol' && k !== 'name');

  const renderItem = ({ item }: { item: ResultItem }) => (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.8}
      onPress={() => item.symbol && router.push(`/stocks/${item.symbol}`)}
    >
      <Text style={s.symbol}>{item.symbol}</Text>
      <Text style={s.name} numberOfLines={1}>{item.name}</Text>
      {extraKeys(item).length > 0 && (
        <View style={s.extraRow}>
          {extraKeys(item).slice(0, 4).map(([k, v]) => (
            <View key={k} style={s.extraChip}>
              <Text style={s.extraLabel}>{k}</Text>
              <Text style={s.extraVal}>{typeof v === 'number' ? v.toFixed(2) : String(v)}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>AI Smart Screener</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.presetScroll}
        contentContainerStyle={s.presetContent}
      >
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[s.presetBtn, activePreset === p.id && s.presetBtnActive]}
            onPress={() => handlePreset(p)}
            disabled={isPending}
          >
            <Text style={[s.presetText, activePreset === p.id && s.presetTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isPending ? (
        <View style={s.centered}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <FlatList
          style={s.list}
          data={results}
          keyExtractor={(item, i) => `${item.symbol}-${i}`}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            !data ? (
              <View style={s.empty}>
                <Ionicons name="sparkles-outline" size={56} color={C.textMuted} />
                <Text style={s.emptyText}>Select a preset or enter a custom query</Text>
              </View>
            ) : null
          }
        />
      )}

      <View style={s.customWrap}>
        <TextInput
          style={s.customInput}
          placeholder="Custom query..."
          placeholderTextColor={C.textMuted}
          value={customQuery}
          onChangeText={setCustomQuery}
          returnKeyType="search"
          onSubmitEditing={handleCustom}
        />
        <TouchableOpacity
          style={[s.searchBtn, (!customQuery.trim() || isPending) && s.searchBtnDisabled]}
          onPress={handleCustom}
          disabled={!customQuery.trim() || isPending}
        >
          <Ionicons name="arrow-forward" size={20} color={C.bg} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  title: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  presetScroll: { maxHeight: 50 },
  presetContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },
  presetBtnActive: { backgroundColor: C.accent + '20', borderColor: C.accent },
  presetText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  presetTextActive: { color: C.accent },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, color: C.textMuted, marginTop: 12 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 10,
  },
  symbol: { fontSize: 16, fontWeight: '800', color: C.accent },
  name: { fontSize: 14, color: C.textMuted, marginTop: 4 },
  extraRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  extraChip: { backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  extraLabel: { fontSize: 10, color: C.textMuted },
  extraVal: { fontSize: 12, fontWeight: '600', color: C.textPrimary },
  customWrap: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  customInput: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: C.textPrimary,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnDisabled: { opacity: 0.5 },
});
