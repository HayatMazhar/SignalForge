import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

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

const REFERRAL_CODE = 'SGF7-X9K2';
const STATS = { invited: 3, earned: 45 };

const TIERS = [
  { level: 1, label: 'Starter', reward: '$5', min: 0, max: 2, current: Math.min(STATS.invited, 2) },
  { level: 2, label: 'Bronze', reward: '$15', min: 3, max: 5, current: Math.min(Math.max(STATS.invited - 2, 0), 3) },
  { level: 3, label: 'Silver', reward: '$50', min: 6, max: 10, current: Math.min(Math.max(STATS.invited - 5, 0), 5) },
  { level: 4, label: 'Gold', reward: '$150', min: 11, max: 20, current: 0 },
];

export default function ReferralScreen() {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(REFERRAL_CODE);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join SignalForge with my referral code ${REFERRAL_CODE} and get exclusive benefits!`,
        title: 'Join SignalForge',
      });
    } catch (e) {
      // User cancelled
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <Text style={styles.codeValue}>{REFERRAL_CODE}</Text>
          <View style={styles.codeActions}>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
              <Ionicons name="copy-outline" size={20} color={COLORS.bg} />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
              <Ionicons name="share-social-outline" size={20} color={COLORS.accent} />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={24} color={COLORS.accent} />
            <Text style={styles.statValue}>{STATS.invited}</Text>
            <Text style={styles.statLabel}>Invited</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color={COLORS.accent} />
            <Text style={styles.statValue}>${STATS.earned}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Reward Tiers</Text>
        {TIERS.map((tier) => {
          const total = tier.max - tier.min;
          const progress = tier.current / total;
          return (
            <View key={tier.level} style={styles.tierCard}>
              <View style={styles.tierHeader}>
                <Text style={styles.tierLabel}>{tier.label}</Text>
                <Text style={styles.tierReward}>{tier.reward}</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.tierMeta}>
                {tier.current}/{total} referrals ({tier.min}-{tier.max})
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  codeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: { fontSize: 12, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  codeValue: { fontSize: 28, fontWeight: '800', color: COLORS.accent, letterSpacing: 4, marginBottom: 16 },
  codeActions: { flexDirection: 'row', gap: 12 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  copyBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.bg },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accent + '22',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  shareBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.accent },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8 },
  statLabel: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase' },
  tierCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 10,
  },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierLabel: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  tierReward: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  progressBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 3 },
  tierMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 6 },
});
