import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { stocksApi, Stock } from '../src/api/stocks';
import api from '../src/api/client';
import { useAssetModeStore } from '../src/stores/assetModeStore';

export default function ScreenerScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { mode } = useAssetModeStore();
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['stocks-search', query, mode],
    queryFn: () =>
      mode === 'crypto'
        ? api.get<Stock[]>('/crypto/search', { params: { q: query } }).then(r => r.data)
        : stocksApi.search(query),
    enabled: query.length >= 1,
  });

  const handleItemPress = (symbol: string) => {
    router.push(`/stocks/${symbol}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#06060B' }} edges={['bottom']}>
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.searchRow}>
        <Ionicons name="search" size={20} color="#5B6378" />
        <TextInput
          style={s.input}
          placeholder="Search symbols..."
          placeholderTextColor="#5B6378"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={22} color="#5B6378" />
          </TouchableOpacity>
        )}
      </View>
      {query.length < 1 ? (
        <View style={s.empty}>
          <Ionicons name="search" size={48} color="#1A1F35" />
          <Text style={s.emptyText}>Enter a symbol or company name to search</Text>
        </View>
      ) : isLoading ? (
        <View style={s.center}>
          <ActivityIndicator color="#00FF94" size="large" />
        </View>
      ) : results.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="sad-outline" size={48} color="#5B6378" />
          <Text style={s.emptyText}>No results for "{query}"</Text>
        </View>
      ) : (
        <FlatList
          style={s.list}
          contentContainerStyle={s.listContent}
          data={results as Stock[]}
          keyExtractor={(item) => item.id || item.symbol}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={s.item} onPress={() => handleItemPress(item.symbol)} activeOpacity={0.7}>
              <View style={s.itemMain}>
                <Text style={s.symbol}>{item.symbol}</Text>
                <Text style={s.name} numberOfLines={1}>{item.name}</Text>
              </View>
              <View style={s.itemMeta}>
                <Text style={s.sector}>{item.sector || '—'}</Text>
                <Text style={s.exchange}>{item.exchange || '—'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#5B6378" />
            </TouchableOpacity>
          )}
        />
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060B' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0C0F1A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#1A1F35',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#F0F4F8',
    paddingVertical: 4,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C0F1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1A1F35',
  },
  itemMain: { flex: 1 },
  symbol: { fontSize: 16, fontWeight: '800', color: '#00FF94' },
  name: { fontSize: 14, color: '#F0F4F8', marginTop: 2 },
  itemMeta: { marginRight: 12 },
  sector: { fontSize: 12, color: '#5B6378' },
  exchange: { fontSize: 11, color: '#5B6378', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 15, color: '#5B6378', marginTop: 12 },
});
