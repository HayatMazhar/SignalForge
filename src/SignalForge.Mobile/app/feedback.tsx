import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'sf-feedback-history';

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

const CATEGORIES = [
  { id: 'bug', label: 'Bug Report', icon: 'bug-outline' as const },
  { id: 'feature', label: 'Feature Request', icon: 'sparkles-outline' as const },
  { id: 'ux', label: 'UX Feedback', icon: 'hand-left-outline' as const },
  { id: 'other', label: 'Other', icon: 'chatbox-outline' as const },
];

export default function FeedbackScreen() {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('feature');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Required', 'Please enter your feedback message.');
      return;
    }
    setSubmitting(true);
    try {
      const entry = {
        rating,
        category,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const history = raw ? JSON.parse(raw) : [];
      history.unshift(entry);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
      setMessage('');
      setRating(0);
      setCategory('feature');
      Alert.alert('Thank You', 'Your feedback has been saved.');
    } catch (e) {
      Alert.alert('Error', 'Could not save feedback. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>How would you rate your experience?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              onPress={() => setRating(n)}
              style={styles.starBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={n <= rating ? 'star' : 'star-outline'}
                size={36}
                color={n <= rating ? COLORS.warning : COLORS.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setCategory(c.id)}
              style={[styles.categoryChip, category === c.id && styles.categoryChipActive]}
              activeOpacity={0.7}
            >
              <Ionicons name={c.icon} size={16} color={category === c.id ? COLORS.accent : COLORS.textMuted} />
              <Text style={[styles.categoryText, category === c.id && styles.categoryTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={styles.input}
          placeholder="Share your thoughts..."
          placeholderTextColor={COLORS.textMuted}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.7}
        >
          <Text style={styles.submitBtnText}>{submitting ? 'Saving...' : 'Submit Feedback'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, marginBottom: 10, marginTop: 16 },
  starsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  starBtn: { padding: 4 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: { backgroundColor: COLORS.accent + '22', borderColor: COLORS.accent },
  categoryText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  categoryTextActive: { color: COLORS.accent },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    color: COLORS.textPrimary,
    fontSize: 15,
    minHeight: 120,
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.bg },
});
