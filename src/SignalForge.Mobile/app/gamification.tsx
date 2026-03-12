import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

const GAMIFICATION_KEY = 'sf-gamification';

type GamificationState = {
  xp: number;
  streak: number;
  lastLogin: string;
  badges: string[];
};

const BADGES: { id: string; name: string; icon: string; check: (s: GamificationState) => boolean }[] = [
  { id: 'first', name: 'First Login', icon: 'star', check: () => true },
  { id: 'signal', name: 'Signal Watcher', icon: 'pulse', check: (s) => s.xp >= 50 },
  { id: 'backtest', name: 'Backtest Pro', icon: 'analytics', check: (s) => s.xp >= 100 },
  { id: 'ai', name: 'AI Explorer', icon: 'sparkles', check: (s) => s.xp >= 200 },
  { id: 'guru', name: 'Market Guru', icon: 'trending-up', check: (s) => s.xp >= 500 },
  { id: 'streak7', name: 'Streak Master', icon: 'flame', check: (s) => s.streak >= 7 },
  { id: 'diamond', name: 'Diamond Hands', icon: 'diamond', check: (s) => s.streak >= 30 },
  { id: 'legend', name: 'Legend', icon: 'trophy', check: (s) => s.xp >= 1000 },
];

const XP_ACTIONS = [
  { action: 'Daily login', xp: 10 },
  { action: 'View a signal', xp: 5 },
  { action: 'Add to watchlist', xp: 8 },
  { action: 'Run backtest', xp: 15 },
  { action: 'Use AI chat', xp: 12 },
  { action: 'Complete morning briefing', xp: 10 },
  { action: 'Share signal', xp: 7 },
  { action: '7-day streak', xp: 25 },
];

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function GamificationScreen() {
  const [state, setState] = useState<GamificationState>({
    xp: 0,
    streak: 0,
    lastLogin: '',
    badges: [],
  });

  useEffect(() => {
    const today = toDateKey(new Date());
    AsyncStorage.getItem(GAMIFICATION_KEY).then((raw) => {
      const prev: GamificationState = raw ? JSON.parse(raw) : { xp: 0, streak: 0, lastLogin: '', badges: [] };
      let xp = prev.xp;
      let streak = prev.streak;
      const last = prev.lastLogin || '';

      if (last !== today) {
        xp += 10;
        const lastDate = last ? new Date(last) : null;
        const todayDate = new Date();
        if (lastDate) {
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          streak = diffDays === 1 ? (prev.streak || 0) + 1 : 1;
        } else {
          streak = 1;
        }
      }

      const next: GamificationState = {
        xp,
        streak,
        lastLogin: today,
        badges: BADGES.filter((b) => b.check({ ...prev, xp, streak })).map((b) => b.id),
      };
      setState(next);
      AsyncStorage.setItem(GAMIFICATION_KEY, JSON.stringify(next));
    });
  }, []);

  const level = Math.floor(state.xp / 100) + 1;
  const xpInLevel = state.xp % 100;
  const progress = xpInLevel / 100;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Achievements</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.levelCard}>
          <View style={[styles.levelBadge, { backgroundColor: COLORS.accent }]}>
            <Text style={styles.levelText}>Lv {level}</Text>
          </View>
          <View style={styles.xpSection}>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.xpLabel}>{xpInLevel} / 100 XP to next level</Text>
          </View>
        </View>

        <View style={styles.streakCard}>
          <Ionicons name="flame" size={28} color={COLORS.warning} />
          <Text style={styles.streakNumber}>{state.streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>

        <Text style={styles.sectionTitle}>Badges</Text>
        <View style={styles.badgeGrid}>
          {BADGES.map((b) => {
            const unlocked = state.badges.includes(b.id);
            return (
              <View key={b.id} style={[styles.badgeCard, !unlocked && styles.badgeLocked]}>
                <Ionicons
                  name={b.icon as any}
                  size={32}
                  color={unlocked ? COLORS.accent : COLORS.textMuted}
                />
                <Text style={[styles.badgeName, !unlocked && styles.badgeNameLocked]} numberOfLines={2}>
                  {b.name}
                </Text>
                <Text style={styles.badgeStatus}>{unlocked ? 'Unlocked' : 'Locked'}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Earn XP</Text>
        <View style={styles.actionsCard}>
          {XP_ACTIONS.map((a, i) => (
            <View key={i} style={styles.actionRow}>
              <Text style={styles.actionText}>{a.action}</Text>
              <View style={styles.xpPill}>
                <Text style={styles.xpPillText}>+{a.xp}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const gap = 12;
const cols = 3;
const cardWidth = (width - 32 - gap * (cols - 1) - 32) / cols;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  scroll: { padding: 16, paddingBottom: 40 },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    gap: 20,
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: { fontSize: 18, fontWeight: '800', color: COLORS.bg },
  xpSection: { flex: 1 },
  xpBar: { height: 10, backgroundColor: COLORS.border, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  xpFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 5 },
  xpLabel: { fontSize: 13, color: COLORS.textMuted },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    gap: 12,
  },
  streakNumber: { fontSize: 28, fontWeight: '800', color: COLORS.warning },
  streakLabel: { fontSize: 16, color: COLORS.textMuted },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap,
    marginBottom: 24,
  },
  badgeCard: {
    width: cardWidth,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  badgeLocked: { opacity: 0.5 },
  badgeName: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center', marginTop: 8 },
  badgeNameLocked: { color: COLORS.textMuted },
  badgeStatus: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  actionsCard: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionText: { fontSize: 14, color: COLORS.textPrimary },
  xpPill: { backgroundColor: COLORS.accent + '33', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  xpPillText: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
});
