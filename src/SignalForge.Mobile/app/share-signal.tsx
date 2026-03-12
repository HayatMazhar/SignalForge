import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
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

type Signal = {
  id: string;
  symbol?: string;
  type?: string;
  confidenceScore?: number;
  reasoning?: string;
  generatedAt?: string;
};

export default function ShareSignalScreen() {
  const [selected, setSelected] = useState<Signal | null>(null);

  const {
    data: signals = [],
    isLoading,
  } = useQuery({
    queryKey: ['signals', 'share'],
    queryFn: async () => {
      const { data } = await api.get<Signal[]>('/signals?limit=10');
      return Array.isArray(data) ? data : [];
    },
  });

  const handleShare = async () => {
    if (!selected) {
      Alert.alert('Select a Signal', 'Choose a signal to share first.');
      return;
    }

    const msg = [
      `📊 SignalForge Signal: ${selected.symbol ?? 'N/A'} ${selected.type ?? ''}`,
      `Confidence: ${Math.round((selected.confidenceScore ?? 0) * 100)}%`,
      selected.reasoning ? `\n${selected.reasoning}` : '',
    ].join('\n');

    try {
      await Share.share({
        message: msg,
        title: `Signal: ${selected.symbol}`,
      });
    } catch (e) {
      if ((e as { message?: string }).message !== 'User did not share') {
        Alert.alert('Share Failed', 'Could not open share dialog.');
      }
    }
  };

  const getTypeColor = (type: string) => {
    const t = (type ?? '').toLowerCase();
    if (t.includes('buy') || t.includes('long')) return COLORS.accent;
    if (t.includes('sell') || t.includes('short')) return COLORS.danger;
    return COLORS.warning;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Text style={styles.sectionTitle}>Select a Signal</Text>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      ) : (
        <>
          <FlatList
            data={signals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selected?.id === item.id;
              const color = getTypeColor(item.type ?? '');
              return (
                <TouchableOpacity
                  style={[
                    styles.signalItem,
                    isSelected && styles.signalItemSelected,
                  ]}
                  onPress={() => setSelected(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.signalRow}>
                    <Text style={styles.signalSymbol}>{item.symbol ?? '—'}</Text>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: color + '22' },
                      ]}
                    >
                      <Text style={[styles.typeText, { color }]}>
                        {item.type ?? '—'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.confidence}>
                    {Math.round((item.confidenceScore ?? 0) * 100)}%
                  </Text>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="analytics-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No signals to share</Text>
              </View>
            }
          />

          {selected && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewSymbol}>{selected.symbol}</Text>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          getTypeColor(selected.type ?? '') + '22',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        { color: getTypeColor(selected.type ?? '') },
                      ]}
                    >
                      {selected.type ?? '—'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.previewConfidence}>
                  Confidence:{' '}
                  {Math.round((selected.confidenceScore ?? 0) * 100)}%
                </Text>
                <Text style={styles.previewReason} numberOfLines={3}>
                  {selected.reasoning ?? 'No reasoning'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Ionicons name="share-social" size={20} color={COLORS.bg} />
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 16 },
  signalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 8,
  },
  signalItemSelected: { borderColor: COLORS.accent, borderWidth: 2 },
  signalRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signalSymbol: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  typeText: { fontSize: 12, fontWeight: '600' },
  confidence: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 12 },
  previewSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewSymbol: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  previewConfidence: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  previewReason: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.bg },
});
