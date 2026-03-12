import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const FOLLOWING_KEY = 'sf-following';

type LeaderboardTrader = {
  id: string;
  username?: string;
  displayName?: string;
  returnPercent?: number;
  winRate?: number;
  signalCount?: number;
};

export default function CopyTradingScreen() {
  const COLORS = useTheme();
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const loadFollowing = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(FOLLOWING_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      setFollowing(new Set(Array.isArray(ids) ? ids : []));
    } catch {
      setFollowing(new Set());
    }
  }, []);

  useEffect(() => {
    loadFollowing();
  }, [loadFollowing]);

  const toggleFollow = async (id: string) => {
    const next = new Set(following);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFollowing(next);
    await AsyncStorage.setItem(FOLLOWING_KEY, JSON.stringify([...next]));
  };

  const {
    data: leaderboard = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['social', 'leaderboard'],
    queryFn: async () => {
      const { data } = await api.get<LeaderboardTrader[]>('/social/leaderboard');
      return Array.isArray(data) ? data : [];
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), loadFollowing()]);
    setRefreshing(false);
  }, [refetch, loadFollowing]);

  const renderTrader = ({ item }: { item: LeaderboardTrader }) => {
    const id = item.id || String(item);
    const name =
      (item as LeaderboardTrader).displayName ||
      (item as LeaderboardTrader).username ||
      'Trader';
    const isFollowing = following.has(id);
    const ret = (item as LeaderboardTrader).returnPercent ?? 0;
    const win = (item as LeaderboardTrader).winRate ?? 0;
    const sigs = (item as LeaderboardTrader).signalCount ?? 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={COLORS.accent} />
          </View>
          <Text style={styles.traderName}>{name}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Return</Text>
            <Text
              style={[
                styles.statValue,
                { color: ret >= 0 ? COLORS.accent : COLORS.danger },
              ]}
            >
              {ret >= 0 ? '+' : ''}
              {ret.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={styles.statValue}>{win.toFixed(0)}%</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Signals</Text>
            <Text style={styles.statValue}>{sigs}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.unfollowBtn]}
          onPress={() => toggleFollow(id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFollowing ? 'checkmark-circle' : 'person-add'}
            size={18}
            color={isFollowing ? COLORS.textMuted : COLORS.accent}
          />
          <Text
            style={[
              styles.followBtnText,
              { color: isFollowing ? COLORS.textMuted : COLORS.accent },
            ]}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderTrader}
          keyExtractor={(item) => (item as LeaderboardTrader).id || String(item)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No traders on leaderboard yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  traderName: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  statsRow: { flexDirection: 'row', marginBottom: 12 },
  stat: { flex: 1 },
  statLabel: { fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase' },
  statValue: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  unfollowBtn: { borderColor: COLORS.border },
  followBtnText: { fontSize: 14, fontWeight: '600' },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 12 },
});
