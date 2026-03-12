import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

const STORAGE_KEY = 'sf-streaks';

type DailyGoals = {
  quotes: number;
  signals: number;
  watchlist: number;
  backtest: number;
  trade: number;
};

type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastDate: string;
  dailyGoals: DailyGoals;
  weekHistory: boolean[];
};

const DEFAULT_DAILY: DailyGoals = {
  quotes: 0,
  signals: 0,
  watchlist: 0,
  backtest: 0,
  trade: 0,
};

const GOAL_LIMITS = {
  quotes: 3,
  signals: 1,
  watchlist: 1,
  backtest: 1,
  trade: 1,
};

const GOAL_LABELS: (keyof DailyGoals)[] = ['quotes', 'signals', 'watchlist', 'backtest', 'trade'];
const GOAL_DISPLAY: Record<keyof DailyGoals, string> = {
  quotes: 'Check 3 quotes',
  signals: 'Review 1 signal',
  watchlist: 'Update watchlist',
  backtest: 'Run 1 backtest',
  trade: 'Log 1 trade',
};

const DEFAULT_DATA: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastDate: '',
  dailyGoals: { ...DEFAULT_DAILY },
  weekHistory: Array(7).fill(false),
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function StreakTrackerScreen() {
  const [data, setData] = useState<StreakData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StreakData;
        const today = todayStr();
        if (parsed.lastDate !== today) {
          parsed.dailyGoals = { ...DEFAULT_DAILY };
          parsed.lastDate = today;
        }
        setData({
          currentStreak: parsed.currentStreak ?? 0,
          longestStreak: parsed.longestStreak ?? 0,
          lastDate: parsed.lastDate ?? today,
          dailyGoals: parsed.dailyGoals ?? { ...DEFAULT_DAILY },
          weekHistory: parsed.weekHistory ?? Array(7).fill(false),
        });
      } else {
        setData({ ...DEFAULT_DATA, lastDate: todayStr() });
      }
    } catch {
      setData({ ...DEFAULT_DATA, lastDate: todayStr() });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (d: StreakData) => {
    setData(d);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  };

  const toggleGoal = (key: keyof DailyGoals) => {
    const limits = GOAL_LIMITS;
    const current = data.dailyGoals[key];
    const max = limits[key];
    const next = current >= max ? 0 : current + 1;
    const updated = { ...data.dailyGoals, [key]: next };
    const allDone =
      updated.quotes >= limits.quotes &&
      updated.signals >= limits.signals &&
      updated.watchlist >= limits.watchlist &&
      updated.backtest >= limits.backtest &&
      updated.trade >= limits.trade;
    if (allDone && next > 0) {
      const newStreak = data.currentStreak + 1;
      const newLongest = Math.max(data.longestStreak, newStreak);
      const newWeek = [...data.weekHistory];
      const dayIndex = new Date().getDay();
      newWeek[dayIndex] = true;
      save({
        ...data,
        dailyGoals: updated,
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastDate: todayStr(),
        weekHistory: newWeek,
      });
    } else {
      save({ ...data, dailyGoals: updated });
    }
  };

  const progress = GOAL_LABELS.reduce((sum, k) => {
    const current = data.dailyGoals[k];
    const max = GOAL_LIMITS[k];
    return sum + (current >= max ? 1 : 0);
  }, 0);
  const progressPct = (progress / 5) * 100;

  const badge = data.longestStreak >= 100 ? 'Gold' : data.longestStreak >= 30 ? 'Silver' : data.longestStreak >= 7 ? 'Bronze' : null;
  const badgeIcon = badge === 'Gold' ? 'medal' : badge === 'Silver' ? 'medal-outline' : badge === 'Bronze' ? 'ribbon' : null;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIndex = new Date().getDay();

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Streaks & Goals</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <View style={s.streakRow}>
          <View style={s.streakCard}>
            <Ionicons name="flame" size={48} color={C.danger} />
            <Text style={s.streakNum}>{data.currentStreak}</Text>
            <Text style={s.streakLabel}>Current Streak</Text>
          </View>
          <View style={s.streakCard}>
            <Text style={s.longestLabel}>Longest</Text>
            <Text style={s.longestNum}>{data.longestStreak}</Text>
            {badge && (
              <View style={s.badgeRow}>
                <Ionicons name={badgeIcon as any} size={16} color={C.warning} />
                <Text style={s.badgeText}>{badge}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.progressRing}>
          <View style={s.ringOuter}>
            <View style={s.ringTrack}>
              <View style={[s.ringFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={s.progressText}>{Math.round(progressPct)}%</Text>
          </View>
        </View>

        <View style={s.goalsSection}>
          <Text style={s.sectionTitle}>Daily Goals</Text>
          {GOAL_LABELS.map((key) => {
            const current = data.dailyGoals[key];
            const max = GOAL_LIMITS[key];
            const done = current >= max;
            return (
              <TouchableOpacity
                key={key}
                style={[s.goalRow, done && s.goalRowDone]}
                onPress={() => toggleGoal(key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={done ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={done ? C.accent : C.textMuted}
                />
                <Text style={[s.goalLabel, done && s.goalLabelDone]}>{GOAL_DISPLAY[key]}</Text>
                <Text style={s.goalCount}>({current}/{max})</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={s.weekSection}>
          <Text style={s.sectionTitle}>This Week</Text>
          <View style={s.weekGrid}>
            {weekDays.map((day, i) => (
              <View key={day} style={s.weekCell}>
                <Text style={s.weekDay}>{day}</Text>
                <View
                  style={[
                    s.weekDot,
                    data.weekHistory[i]
                      ? { backgroundColor: C.accent }
                      : i === todayIndex
                      ? { backgroundColor: C.border }
                      : { backgroundColor: C.border + '60' },
                  ]}
                />
              </View>
            ))}
          </View>
        </View>

        <View style={s.rewardsSection}>
          <Text style={s.sectionTitle}>Rewards</Text>
          <View style={s.rewardRow}>
            <Ionicons name="ribbon-outline" size={24} color={C.warning} />
            <Text style={s.rewardText}>7 days = Bronze</Text>
          </View>
          <View style={s.rewardRow}>
            <Ionicons name="medal-outline" size={24} color={C.textMuted} />
            <Text style={s.rewardText}>30 days = Silver</Text>
          </View>
          <View style={s.rewardRow}>
            <Ionicons name="medal" size={24} color={C.warning} />
            <Text style={s.rewardText}>100 days = Gold</Text>
          </View>
        </View>
      </ScrollView>
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
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  streakRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  streakCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  streakNum: { fontSize: 36, fontWeight: '800', color: C.textPrimary, marginTop: 8 },
  streakLabel: { fontSize: 13, color: C.textMuted, marginTop: 4 },
  longestLabel: { fontSize: 12, color: C.textMuted },
  longestNum: { fontSize: 28, fontWeight: '800', color: C.accent },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  badgeText: { fontSize: 12, fontWeight: '700', color: C.warning },
  progressRing: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
  },
  ringTrack: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 6,
    bottom: 6,
    borderRadius: 44,
    backgroundColor: C.border,
    overflow: 'hidden',
  },
  ringFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: C.accent,
    borderRadius: 44,
  },
  progressText: { fontSize: 18, fontWeight: '800', color: C.accent, zIndex: 1 },
  goalsSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  goalRowDone: { borderColor: C.accent + '40', backgroundColor: C.accent + '08' },
  goalLabel: { flex: 1, fontSize: 15, color: C.textPrimary, fontWeight: '600' },
  goalLabelDone: { color: C.accent },
  goalCount: { fontSize: 13, color: C.textMuted },
  weekSection: { marginBottom: 24 },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  weekCell: { alignItems: 'center' },
  weekDay: { fontSize: 11, color: C.textMuted, marginBottom: 8 },
  weekDot: { width: 24, height: 24, borderRadius: 12 },
  rewardsSection: {},
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  rewardText: { fontSize: 14, color: C.textPrimary },
});
