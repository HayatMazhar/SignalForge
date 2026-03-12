import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../src/api/admin';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  tier: string;
  roles: string[];
  isLocked?: boolean;
  lockoutEnd?: string | null;
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminApi.getUsers,
  });

  const lockMutation = useMutation({
    mutationFn: (userId: string) => adminApi.lockUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
  const unlockMutation = useMutation({
    mutationFn: (userId: string) => adminApi.unlockUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const handleLockToggle = (user: AdminUser) => {
    const isLocked = user.isLocked ?? !!user.lockoutEnd;
    const action = isLocked ? 'unlock' : 'lock';
    Alert.alert(
      `${action === 'lock' ? 'Lock' : 'Unlock'} User`,
      `Are you sure you want to ${action} ${user.fullName || user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'lock' ? 'Lock' : 'Unlock',
          style: action === 'lock' ? 'destructive' : 'default',
          onPress: () =>
            isLocked ? unlockMutation.mutate(user.id) : lockMutation.mutate(user.id),
        },
      ]
    );
  };

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
      data={users as AdminUser[]}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const isLocked = item.isLocked ?? !!item.lockoutEnd;
        return (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.userInfo}>
                <Text style={s.fullName}>{item.fullName || item.email}</Text>
                <Text style={s.email}>{item.email}</Text>
              </View>
              <TouchableOpacity
                style={[s.lockBtn, isLocked && s.lockBtnActive]}
                onPress={() => handleLockToggle(item)}
                disabled={lockMutation.isPending || unlockMutation.isPending}
              >
                <Ionicons name={isLocked ? 'lock-open' : 'lock-closed'} size={20} color={isLocked ? '#00FF94' : '#FF3B5C'} />
              </TouchableOpacity>
            </View>
            <View style={s.badges}>
              <View style={[s.badge, s.tierBadge]}>
                <Text style={s.badgeText}>{item.tier}</Text>
              </View>
              {item.roles?.map((r) => (
                <View key={r} style={[s.badge, s.roleBadge]}>
                  <Text style={s.badgeText}>{r}</Text>
                </View>
              ))}
              {isLocked && (
                <View style={[s.badge, s.lockedBadge]}>
                  <Ionicons name="lock-closed" size={12} color="#FF3B5C" />
                  <Text style={s.lockedBadgeText}>Locked</Text>
                </View>
              )}
            </View>
          </View>
        );
      }}
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flex: 1 },
  fullName: { fontSize: 16, fontWeight: '700', color: '#F0F4F8' },
  email: { fontSize: 13, color: '#5B6378', marginTop: 2 },
  lockBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBtnActive: {
    backgroundColor: 'rgba(0, 255, 148, 0.15)',
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tierBadge: { backgroundColor: 'rgba(167, 139, 250, 0.2)' },
  roleBadge: { backgroundColor: 'rgba(56, 189, 248, 0.2)' },
  lockedBadge: { backgroundColor: 'rgba(255, 59, 92, 0.2)' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#F0F4F8', textTransform: 'capitalize' },
  lockedBadgeText: { fontSize: 12, fontWeight: '600', color: '#FF3B5C', marginLeft: 4 },
});
