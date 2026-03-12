import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useAssetModeStore } from '../../src/stores/assetModeStore';
import { useThemeStore } from '../../src/stores/themeStore';
import { router } from 'expo-router';

const C = {
  bg: '#06060B', surface: '#0C0F1A', accent: '#00FF94',
  textPrimary: '#F0F4F8', textMuted: '#5B6378', border: '#1A1F35',
};

function TopHeader() {
  const user = useAuthStore((s) => s.user);
  const { mode, toggle } = useAssetModeStore();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.colors);
  return (
    <View style={[h.container, { paddingTop: insets.top + 10, backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={() => router.push('/settings')} style={h.menuBtn}>
        <Ionicons name="menu" size={22} color={colors.textPrimary} />
      </TouchableOpacity>
      <View style={h.logoRow}>
        <Ionicons name="pulse" size={20} color={colors.accent} />
        <Text style={[h.logoText, { color: colors.accent }]}>SignalForge</Text>
      </View>
      <TouchableOpacity onPress={toggle} style={{
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: mode === 'crypto' ? colors.purple + '20' : colors.accent + '20',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
      }}>
        <Ionicons name={mode === 'crypto' ? 'logo-bitcoin' : 'trending-up'} size={14}
          color={mode === 'crypto' ? colors.purple : colors.accent} />
        <Text style={{ fontSize: 11, fontWeight: '700', color: mode === 'crypto' ? colors.purple : colors.accent }}>
          {mode === 'crypto' ? 'Crypto' : 'Stocks'}
        </Text>
      </TouchableOpacity>
      <View style={h.rightRow}>
        <TouchableOpacity onPress={() => router.push('/settings')} style={h.avatarBtn}>
          <View style={[h.avatar, { borderColor: colors.accent + '40' }]}>
            <Text style={[h.avatarText, { color: colors.accent }]}>{user?.fullName?.charAt(0) ?? 'U'}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/notification-center')} style={h.bellBtn}>
          <Ionicons name="notifications" size={20} color={colors.textPrimary} />
          <View style={[h.bellDot, { backgroundColor: colors.accent, borderColor: colors.bg }]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const h = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border },
  menuBtn: { padding: 4 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 16, fontWeight: '800', color: C.accent },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBtn: {},
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#151929', borderWidth: 2, borderColor: C.accent + '40', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '800', color: C.accent },
  bellBtn: { position: 'relative' },
  bellDot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, borderWidth: 1.5, borderColor: C.bg },
});

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const colors = useThemeStore((s) => s.colors);

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{
      header: () => <TopHeader />,
      tabBarStyle: {
        position: 'absolute',
        bottom: 16,
        left: 20,
        right: 20,
        height: 64,
        borderRadius: 24,
        backgroundColor: colors.surface + 'e6',
        borderTopWidth: 0,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 20,
        paddingBottom: 0,
        paddingTop: 0,
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: { fontSize: 9, fontWeight: '700', marginTop: -2, marginBottom: 8, letterSpacing: 0.3 },
      tabBarIconStyle: { marginTop: 8 },
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Home',
        tabBarIcon: ({ color, focused }) => (
          <View style={focused ? { backgroundColor: colors.accent + '15', borderRadius: 12, padding: 6, marginTop: -4 } : undefined}>
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          </View>
        ),
      }} />
      <Tabs.Screen name="signals" options={{
        title: 'Signals',
        tabBarIcon: ({ color, focused }) => (
          <View style={focused ? { backgroundColor: colors.accent + '15', borderRadius: 12, padding: 6, marginTop: -4 } : undefined}>
            <Ionicons name={focused ? 'pulse' : 'pulse-outline'} size={22} color={color} />
          </View>
        ),
      }} />
      <Tabs.Screen name="market" options={{
        title: 'Market',
        tabBarIcon: ({ color, focused }) => (
          <View style={focused ? { backgroundColor: colors.accent + '15', borderRadius: 12, padding: 6, marginTop: -4 } : undefined}>
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={22} color={color} />
          </View>
        ),
      }} />
      <Tabs.Screen name="portfolio" options={{
        title: 'Portfolio',
        tabBarIcon: ({ color, focused }) => (
          <View style={focused ? { backgroundColor: colors.accent + '15', borderRadius: 12, padding: 6, marginTop: -4 } : undefined}>
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />
          </View>
        ),
      }} />
      <Tabs.Screen name="more" options={{
        title: 'More',
        tabBarIcon: ({ color, focused }) => (
          <View style={focused ? { backgroundColor: colors.accent + '15', borderRadius: 12, padding: 6, marginTop: -4 } : undefined}>
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          </View>
        ),
      }} />
    </Tabs>
  );
}

const t = StyleSheet.create({
  activeWrap: { backgroundColor: '#00FF9415', borderRadius: 12, padding: 6, marginTop: -4 },
});
