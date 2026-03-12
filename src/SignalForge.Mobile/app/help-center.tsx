import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

const FAQ_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'rocket-outline' as const,
    questions: [
      { q: 'How do I add stocks to my watchlist?', a: 'Tap the + button on the Watchlist screen and enter a stock symbol (e.g. AAPL, MSFT).' },
      { q: 'What are AI signals?', a: 'AI signals combine technical analysis, sentiment, and options flow to suggest buy/sell opportunities.' },
      { q: 'How do I create a price alert?', a: 'Go to Alerts, tap Add, and set your symbol, condition (above/below), and target price.' },
    ],
  },
  {
    id: 'account',
    title: 'Account & Subscription',
    icon: 'person-outline' as const,
    questions: [
      { q: 'How do I upgrade my plan?', a: 'Open Settings > Subscription to view plans and manage your subscription.' },
      { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. Access continues until the end of the billing period.' },
      { q: 'Where can I see my invoice?', a: 'Invoices are emailed to your registered address. You can also request them from support.' },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Issues',
    icon: 'settings-outline' as const,
    questions: [
      { q: 'Why are my alerts not firing?', a: 'Ensure notifications are enabled in Settings and your device allows background updates.' },
      { q: 'App is slow or freezing', a: 'Try clearing cache in Settings > Data, or reinstalling the app.' },
      { q: 'Broker connection failed', a: 'Check your credentials and ensure 2FA is configured if required. Reconnect from Brokers.' },
    ],
  },
  {
    id: 'data',
    title: 'Data & Privacy',
    icon: 'shield-checkmark-outline' as const,
    questions: [
      { q: 'How is my data protected?', a: 'We use encryption at rest and in transit, and never share your data with third parties.' },
      { q: 'Can I export my data?', a: 'Yes, go to Export to download your portfolio, signals, watchlist, and alerts as CSV.' },
      { q: 'How do I delete my account?', a: 'Contact support with your email. We process deletion requests within 30 days.' },
    ],
  },
];

export default function HelpCenterScreen() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setExpanded((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleContact = () => {
    Linking.openURL('mailto:support@signalforge.app');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {FAQ_CATEGORIES.map((cat) => (
          <View key={cat.id} style={styles.category}>
            <View style={styles.categoryHeader}>
              <Ionicons name={cat.icon} size={20} color={COLORS.accent} />
              <Text style={styles.categoryTitle}>{cat.title}</Text>
            </View>
            {cat.questions.map((item, idx) => {
              const key = `${cat.id}-${idx}`;
              const isOpen = expanded[key];
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.faqItem}
                  onPress={() => toggle(key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{item.q}</Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={COLORS.textMuted}
                    />
                  </View>
                  {isOpen && <Text style={styles.faqAnswer}>{item.a}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={styles.contactSection}>
          <Ionicons name="mail-outline" size={32} color={COLORS.accent} />
          <Text style={styles.contactTitle}>Contact Support</Text>
          <Text style={styles.contactDesc}>Need more help? Reach out to our team.</Text>
          <TouchableOpacity style={styles.contactBtn} onPress={handleContact} activeOpacity={0.7}>
            <Text style={styles.contactBtnText}>Email Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  category: { marginBottom: 24 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  categoryTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  faqItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 8,
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginRight: 8 },
  faqAnswer: { fontSize: 13, color: COLORS.textMuted, marginTop: 12, lineHeight: 20 },
  contactSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  contactTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 12 },
  contactDesc: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  contactBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  contactBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.bg },
});
