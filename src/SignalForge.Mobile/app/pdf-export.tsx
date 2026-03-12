import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
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

type ThesisResponse = {
  symbol?: string;
  thesis?: string;
  summary?: string;
  sections?: Array<{ title?: string; content?: string }>;
};

export default function PdfExportScreen() {
  const [symbol, setSymbol] = useState('');
  const [generateSymbol, setGenerateSymbol] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['insights', 'thesis', generateSymbol],
    queryFn: async () => {
      const { data: res } = await api.get<ThesisResponse>(
        `/insights/thesis/${encodeURIComponent(generateSymbol!)}`
      );
      return res;
    },
    enabled: !!generateSymbol,
  });

  const handleGenerate = () => {
    const s = symbol.trim().toUpperCase();
    if (!s) {
      Alert.alert('Enter Symbol', 'Please enter a stock symbol.');
      return;
    }
    setGenerateSymbol(s);
  };

  const handleShare = async () => {
    if (!data) return;

    const content = [
      data.summary ?? '',
      data.thesis ?? '',
      ...(data.sections ?? []).map(
        (s) => `${s.title ?? ''}\n${s.content ?? ''}`
      ),
    ]
      .filter(Boolean)
      .join('\n\n');

    const msg = `📄 SignalForge Report: ${data.symbol ?? 'N/A'}\n\n${content}`;

    try {
      await Share.share({
        message: msg,
        title: `Report: ${data.symbol}`,
      });
    } catch (e) {
      if ((e as { message?: string }).message !== 'User did not share') {
        Alert.alert('Share Failed', 'Could not open share dialog.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Symbol (e.g. AAPL)"
          placeholderTextColor={COLORS.textMuted}
          value={symbol}
          onChangeText={setSymbol}
          autoCapitalize="characters"
          onSubmitEditing={handleGenerate}
        />
        <TouchableOpacity
          style={styles.genBtn}
          onPress={handleGenerate}
          disabled={isFetching || !symbol.trim()}
          activeOpacity={0.7}
        >
          {isFetching ? (
            <ActivityIndicator color={COLORS.bg} size="small" />
          ) : (
            <>
              <Ionicons name="document-text" size={18} color={COLORS.bg} />
              <Text style={styles.genBtnText}>Generate</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {generateSymbol && (
        <>
          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={COLORS.accent} size="large" />
              <Text style={styles.loadingText}>
                Generating report for {generateSymbol}...
              </Text>
            </View>
          ) : data ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportSymbol}>
                    {data.symbol ?? generateSymbol}
                  </Text>
                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={handleShare}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-social" size={18} color={COLORS.bg} />
                    <Text style={styles.shareBtnText}>Share</Text>
                  </TouchableOpacity>
                </View>
                {data.summary && (
                  <Text style={styles.summary}>{data.summary}</Text>
                )}
                {data.thesis && (
                  <Text style={styles.thesis}>{data.thesis}</Text>
                )}
                {(data.sections ?? []).map((s, i) => (
                  <View key={i} style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      {s.title ?? `Section ${i + 1}`}
                    </Text>
                    <Text style={styles.sectionContent}>
                      {s.content ?? ''}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.centered}>
              <Ionicons name="document-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>
                No report data for {generateSymbol}
              </Text>
            </View>
          )}
        </>
      )}

      {!generateSymbol && (
        <View style={styles.placeholder}>
          <Ionicons name="document-text-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.placeholderText}>
            Enter a symbol and tap Generate
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 110,
  },
  genBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.bg },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textMuted },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  reportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  reportSymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  shareBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.bg },
  summary: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: '500',
  },
  thesis: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 20,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 12 },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 16,
  },
});
