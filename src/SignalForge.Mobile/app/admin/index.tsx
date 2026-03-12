import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../src/api/admin';

export default function AdminDashboard() {
  const router = useRouter();
  const { data: stats, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.getStats });

  if (isLoading) return <View style={s.center}><ActivityIndicator color="#00FF94" size="large" /></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#06060B' }} edges={['bottom']}>
      <ScrollView style={s.container}>
      <View style={s.header}>
        <Ionicons name="shield" size={28} color="#A78BFA" />
        <Text style={s.title}>Admin Dashboard</Text>
      </View>
      <View style={s.grid}>
        <StatCard icon="people" label="Users" value={stats?.totalUsers ?? 0} color="#38BDF8" />
        <StatCard icon="bar-chart" label="Stocks" value={stats?.totalStocks ?? 0} color="#00FF94" />
        <StatCard icon="pulse" label="Signals" value={stats?.totalSignals ?? 0} color="#A78BFA" />
        <StatCard icon="notifications" label="Alerts" value={stats?.totalAlerts ?? 0} color="#FF3B5C" />
        <StatCard icon="star" label="Watchlist" value={stats?.totalWatchlist ?? 0} color="#FFB020" />
        <StatCard icon="briefcase" label="Positions" value={stats?.totalPortfolio ?? 0} color="#38BDF8" />
      </View>
      <View style={s.navRow}>
        <TouchableOpacity style={s.navBtn} onPress={() => router.push('/admin/users')}>
          <Ionicons name="people" size={20} color="#38BDF8" />
          <Text style={s.navBtnText}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navBtn} onPress={() => router.push('/admin/roles')}>
          <Ionicons name="shield" size={20} color="#A78BFA" />
          <Text style={s.navBtnText}>Roles</Text>
        </TouchableOpacity>
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Tier Distribution</Text>
        {stats?.tierBreakdown?.map((t: any) => (
          <View key={t.tier} style={s.tierRow}>
            <Text style={s.tierName}>{t.tier}</Text>
            <Text style={s.tierCount}>{t.count}</Text>
          </View>
        ))}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <View style={s.statCard}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060B', padding: 16 },
  center: { flex: 1, backgroundColor: '#06060B', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 8 },
  title: { fontSize: 22, fontWeight: '900', color: '#F0F4F8' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', backgroundColor: '#0C0F1A', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1A1F35', alignItems: 'center', gap: 6 },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0C0F1A', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1A1F35' },
  navBtnText: { fontSize: 15, fontWeight: '700', color: '#F0F4F8' },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, color: '#5B6378', textTransform: 'uppercase', letterSpacing: 1 },
  section: { backgroundColor: '#0C0F1A', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#1A1F35' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#5B6378', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  tierRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(26, 31, 53, 0.3)' },
  tierName: { fontSize: 14, color: '#F0F4F8', textTransform: 'capitalize', fontWeight: '600' },
  tierCount: { fontSize: 14, color: '#00FF94', fontWeight: '800' },
});
