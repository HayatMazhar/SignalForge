import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { newsApi } from '../src/api/stocks';
import type { NewsArticle } from '../src/api/stocks';

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

function getSentimentInfo(score: number) {
  if (score >= 0.3) return { label: 'Bullish', color: C.accent };
  if (score <= -0.3) return { label: 'Bearish', color: C.danger };
  return { label: 'Neutral', color: C.warning };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NewsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: articles = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['marketNews'],
    queryFn: () => newsApi.getMarketNews(30),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderArticle = ({ item }: { item: NewsArticle }) => {
    const sentiment = getSentimentInfo(item.sentimentScore);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => item.url && Linking.openURL(item.url)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={styles.sourceRow}>
            <Ionicons name="newspaper-outline" size={14} color={C.textMuted} />
            <Text style={styles.source}>{item.source}</Text>
          </View>
          <View style={[styles.sentimentBadge, { backgroundColor: sentiment.color + '18' }]}>
            <Text style={[styles.sentimentText, { color: sentiment.color }]}>
              {sentiment.label}
            </Text>
          </View>
        </View>
        <Text style={styles.title} numberOfLines={3}>
          {item.title}
        </Text>
        {item.summary ? (
          <Text style={styles.summary} numberOfLines={2}>
            {item.summary}
          </Text>
        ) : null}
        <View style={styles.cardBottom}>
          {item.symbol ? (
            <View style={styles.symbolChip}>
              <Text style={styles.symbolChipText}>{item.symbol}</Text>
            </View>
          ) : null}
          <Text style={styles.time}>{timeAgo(item.publishedAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={articles}
      keyExtractor={(item) => item.id}
      renderItem={renderArticle}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={C.accent}
        />
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Ionicons name="newspaper-outline" size={48} color={C.textMuted} />
          <Text style={styles.emptyText}>No news articles available</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, paddingBottom: 32 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  source: { fontSize: 12, color: C.textMuted, fontWeight: '500' },
  sentimentBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  sentimentText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '600', color: C.textPrimary, lineHeight: 22, marginBottom: 6 },
  summary: { fontSize: 13, color: C.textMuted, lineHeight: 18, marginBottom: 10 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  symbolChip: {
    backgroundColor: C.info + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  symbolChipText: { fontSize: 11, fontWeight: '700', color: C.info },
  time: { fontSize: 11, color: C.textMuted },
  emptyText: { fontSize: 14, color: C.textMuted, marginTop: 12 },
});
