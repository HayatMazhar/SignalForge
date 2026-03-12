import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../src/api/admin';

interface AdminRole {
  id: string;
  name: string;
  userCount: number;
  permissions: Record<string, boolean>;
}

export default function RoleManagement() {
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: adminApi.getRoles,
  });

  if (isLoading)
    return (
      <View style={s.center}>
        <ActivityIndicator color="#00FF94" size="large" />
      </View>
    );

  return (
    <FlatList
      style={s.container}
      contentContainerStyle={s.listContent}
      data={roles as AdminRole[]}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.roleName}>{item.name}</Text>
            <View style={s.userCountBadge}>
              <Ionicons name="people" size={14} color="#38BDF8" />
              <Text style={s.userCountText}>{item.userCount}</Text>
            </View>
          </View>
          <Text style={s.permissionsTitle}>Permissions</Text>
          {item.permissions && Object.entries(item.permissions).map(([perm, allowed]) => (
            <View key={perm} style={s.permRow}>
              <Ionicons
                name={allowed ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={allowed ? '#00FF94' : '#5B6378'}
              />
              <Text style={[s.permText, !allowed && s.permTextDisabled]}>{perm}</Text>
            </View>
          ))}
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060B' },
  listContent: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, backgroundColor: '#06060B', justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#0C0F1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1A1F35',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roleName: { fontSize: 18, fontWeight: '800', color: '#F0F4F8', textTransform: 'capitalize' },
  userCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  userCountText: { fontSize: 14, fontWeight: '700', color: '#38BDF8' },
  permissionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B6378',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 10,
  },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  permText: { fontSize: 14, color: '#F0F4F8', textTransform: 'capitalize' },
  permTextDisabled: { color: '#5B6378' },
});
