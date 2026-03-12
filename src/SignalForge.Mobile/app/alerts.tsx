import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { alertsApi } from '../src/api/stocks';
import { useTheme } from '../src/constants/config';

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

const ALERT_TYPES = [
  { value: 0, label: 'Price Above' },
  { value: 1, label: 'Price Below' },
  { value: 2, label: 'Percent Change' },
];

interface AlertItem {
  id: string;
  symbol: string;
  alertType: number;
  targetValue: number;
  isActive: boolean;
  createdAt?: string;
}

export default function AlertsScreen() {
  const C = useTheme();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [alertType, setAlertType] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.get() as Promise<AlertItem[]>,
  });

  const createMutation = useMutation({
    mutationFn: () => alertsApi.create(symbol.toUpperCase(), alertType, parseFloat(targetValue)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setSymbol('');
      setTargetValue('');
      setShowForm(false);
    },
    onError: () => Alert.alert('Error', 'Failed to create alert'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
    onError: () => Alert.alert('Error', 'Failed to delete alert'),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCreate = () => {
    if (!symbol.trim() || !targetValue.trim() || isNaN(parseFloat(targetValue))) {
      Alert.alert('Validation', 'Enter a valid symbol and target value');
      return;
    }
    createMutation.mutate();
  };

  const getTypeLabel = (type: number) =>
    ALERT_TYPES.find((t) => t.value === type)?.label ?? `Type ${type}`;

  const renderAlert = ({ item }: { item: AlertItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.symbolBadge}>
          <Text style={styles.symbolText}>{item.symbol}</Text>
        </View>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.isActive ? C.accent : C.textMuted },
          ]}
        />
      </View>
      <Text style={styles.typeLabel}>{getTypeLabel(item.alertType)}</Text>
      <Text style={styles.targetValue}>${item.targetValue.toFixed(2)}</Text>
      {item.createdAt && (
        <Text style={styles.date}>
          Created {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      )}
      <TouchableOpacity
        style={styles.deleteRow}
        onPress={() =>
          Alert.alert('Delete Alert', 'Remove this alert?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
          ])
        }
      >
        <Ionicons name="trash-outline" size={16} color={C.danger} />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add form */}
      <View style={styles.topBar}>
        {showForm ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={symbol}
              onChangeText={setSymbol}
              placeholder="Symbol (e.g. AAPL)"
              placeholderTextColor={C.textMuted}
              autoCapitalize="characters"
            />
            <View style={styles.typeRow}>
              {ALERT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.typeChip,
                    alertType === t.value && styles.typeChipActive,
                  ]}
                  onPress={() => setAlertType(t.value)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      alertType === t.value && styles.typeChipTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={targetValue}
              onChangeText={setTargetValue}
              placeholder="Target value (e.g. 150.00)"
              placeholderTextColor={C.textMuted}
              keyboardType="decimal-pad"
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color={C.bg} size="small" />
                ) : (
                  <Text style={styles.createBtnText}>Create Alert</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelFormBtn}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.cancelFormText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addToggle} onPress={() => setShowForm(true)}>
            <Ionicons name="add-circle" size={22} color={C.accent} />
            <Text style={styles.addToggleText}>New Alert</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="notifications-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyText}>No alerts set</Text>
            <Text style={styles.emptyHint}>Create an alert to get notified on price targets</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  topBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  addToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  addToggleText: { fontSize: 15, fontWeight: '600', color: C.accent },
  form: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 12,
  },
  input: {
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: C.textPrimary,
    borderWidth: 1,
    borderColor: C.border,
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.bg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  typeChipActive: { backgroundColor: C.accent + '18', borderColor: C.accent },
  typeChipText: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  typeChipTextActive: { color: C.accent },
  formActions: { flexDirection: 'row', gap: 10 },
  createBtn: {
    flex: 1,
    backgroundColor: C.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createBtnText: { fontSize: 15, fontWeight: '700', color: C.bg },
  cancelFormBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  cancelFormText: { fontSize: 15, color: C.textMuted, fontWeight: '600' },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  symbolBadge: {
    backgroundColor: C.info + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  symbolText: { fontSize: 14, fontWeight: '700', color: C.info },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  typeLabel: { fontSize: 13, color: C.textMuted, marginBottom: 4 },
  targetValue: { fontSize: 22, fontWeight: '700', color: C.textPrimary },
  date: { fontSize: 11, color: C.textMuted, marginTop: 6 },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  deleteText: { fontSize: 13, color: C.danger, fontWeight: '600' },
  emptyText: { fontSize: 16, color: C.textMuted, marginTop: 16 },
  emptyHint: { fontSize: 13, color: C.textMuted, marginTop: 4, textAlign: 'center' },
});
