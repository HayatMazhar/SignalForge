import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
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

const BROKERS = [
  { id: 'ibkr', name: 'Interactive Brokers', icon: 'briefcase-outline' as const },
  { id: 'td', name: 'TD Ameritrade', icon: 'trending-up-outline' as const },
  { id: 'schwab', name: 'Charles Schwab', icon: 'bar-chart-outline' as const },
  { id: 'etrade', name: 'E*TRADE', icon: 'wallet-outline' as const },
  { id: 'fidelity', name: 'Fidelity', icon: 'pie-chart-outline' as const },
];

const SOCIAL = [
  { id: 'twitter', name: 'X (Twitter)', icon: 'logo-twitter' as const },
  { id: 'discord', name: 'Discord', icon: 'chatbubbles-outline' as const },
];

export default function ConnectedAccountsScreen() {
  const [connected, setConnected] = useState<Record<string, boolean>>({
    ibkr: true,
    td: false,
    schwab: false,
    etrade: false,
    fidelity: false,
  });

  const [socialConnected, setSocialConnected] = useState<Record<string, boolean>>({
    twitter: false,
    discord: true,
  });

  const toggleBroker = (id: string) => {
    const isOn = connected[id];
    if (isOn) {
      Alert.alert('Disconnect', `Disconnect ${BROKERS.find((b) => b.id === id)?.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => setConnected((p) => ({ ...p, [id]: false })) },
      ]);
    } else {
      setConnected((p) => ({ ...p, [id]: true }));
    }
  };

  const toggleSocial = (id: string) => {
    setSocialConnected((p) => ({ ...p, [id]: !p[id] }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Broker Connections</Text>
        {BROKERS.map((broker) => {
          const isConnected = connected[broker.id];
          return (
            <View key={broker.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.cardIcon}>
                  <Ionicons name={broker.icon} size={24} color={COLORS.accent} />
                </View>
                <View>
                  <Text style={styles.cardName}>{broker.name}</Text>
                  <View style={[styles.badge, isConnected ? styles.badgeConnected : styles.badgeDisconnected]}>
                    <Text style={[styles.badgeText, isConnected ? styles.badgeTextConnected : styles.badgeTextDisconnected]}>
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, isConnected ? styles.actionBtnDisconnect : styles.actionBtnConnect]}
                onPress={() => toggleBroker(broker.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionBtnText, isConnected ? { color: COLORS.danger } : { color: COLORS.bg }]}>
                  {isConnected ? 'Disconnect' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Social Connections</Text>
        {SOCIAL.map((item) => {
          const isConnected = socialConnected[item.id];
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.cardIcon}>
                  <Ionicons name={item.icon} size={24} color={COLORS.info} />
                </View>
                <View>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <View style={[styles.badge, isConnected ? styles.badgeConnected : styles.badgeDisconnected]}>
                    <Text style={[styles.badgeText, isConnected ? styles.badgeTextConnected : styles.badgeTextDisconnected]}>
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, isConnected ? styles.actionBtnDisconnect : styles.actionBtnConnect]}
                onPress={() => toggleSocial(item.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionBtnText, isConnected ? { color: COLORS.danger } : { color: COLORS.bg }]}>
                  {isConnected ? 'Disconnect' : 'Connect'}
                </Text>
              </TouchableOpacity>
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
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 10,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.accent + '22', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardName: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  badgeConnected: { backgroundColor: COLORS.accent + '22' },
  badgeDisconnected: { backgroundColor: COLORS.border },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextConnected: { color: COLORS.accent },
  badgeTextDisconnected: { color: COLORS.textMuted },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  actionBtnConnect: { backgroundColor: COLORS.accent },
  actionBtnDisconnect: { backgroundColor: COLORS.danger + '22', borderWidth: 1, borderColor: COLORS.danger },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
});
