import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/api/client';

const C = {
  bg: '#06060B', surface: '#0C0F1A', accent: '#00FF94', danger: '#FF3B5C',
  textPrimary: '#F0F4F8', textMuted: '#5B6378', border: '#1A1F35',
  warning: '#FFB020', info: '#38BDF8', purple: '#A78BFA',
};

type AlertItem = { id: string; symbol: string; alertType: string; targetValue: number; isActive: boolean };
type Prediction = { horizon: string; price: number; change: number; confidence: number; direction: string };

export default function PriceAlertsMapScreen() {
  const [symbol, setSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['smart-alerts'],
    queryFn: () => api.get('/alerts').then(r => Array.isArray(r.data) ? r.data as AlertItem[] : []),
  });

  const { data: prediction, isFetching: predicting, mutate: predict } = useMutation({
    mutationFn: (sym: string) => api.get(`/ai/predict/${sym.toUpperCase()}`).then(r => r.data),
  });

  const createAlert = useMutation({
    mutationFn: (data: { symbol: string; alertType: string; targetValue: number }) =>
      api.post('/alerts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-alerts'] });
      setTargetPrice('');
      Alert.alert('Alert Created', 'Your price alert has been set.');
    },
  });

  const deleteAlert = useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smart-alerts'] }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleGetSuggestion = () => {
    if (!symbol.trim()) return;
    predict(symbol.trim().toUpperCase());
  };

  const handleCreateAlert = () => {
    if (!symbol.trim() || !targetPrice.trim()) return;
    const price = parseFloat(targetPrice);
    if (isNaN(price)) return;
    createAlert.mutate({ symbol: symbol.trim().toUpperCase(), alertType: 'Price', targetValue: price });
  };

  const handleCreateFromPrediction = (p: Prediction) => {
    createAlert.mutate({
      symbol: symbol.trim().toUpperCase(),
      alertType: `AI ${p.horizon}`,
      targetValue: Math.round(p.price * 100) / 100,
    });
  };

  const predictions: Prediction[] = prediction?.predictions ?? [];
  const activeAlerts = (alerts ?? []).filter(a => a.isActive);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}>

        <View style={s.inputCard}>
          <Text style={s.inputLabel}>Create Smart Alert</Text>
          <View style={s.inputRow}>
            <TextInput style={s.symbolInput} value={symbol} onChangeText={setSymbol}
              placeholder="Symbol" placeholderTextColor={C.textMuted} autoCapitalize="characters" />
            <TextInput style={s.priceInput} value={targetPrice} onChangeText={setTargetPrice}
              placeholder="Target $" placeholderTextColor={C.textMuted} keyboardType="decimal-pad" />
          </View>
          <View style={s.buttonRow}>
            <TouchableOpacity style={s.suggestBtn} onPress={handleGetSuggestion} disabled={!symbol.trim() || predicting}>
              {predicting ? <ActivityIndicator color={C.bg} size="small" /> :
                <><Ionicons name="sparkles" size={16} color={C.bg} /><Text style={s.suggestBtnText}>AI Suggest</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={s.createBtn} onPress={handleCreateAlert}
              disabled={!symbol.trim() || !targetPrice.trim() || createAlert.isPending}>
              <Ionicons name="add-circle" size={16} color={C.bg} />
              <Text style={s.createBtnText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        {predictions.length > 0 && (
          <View style={s.predictionsCard}>
            <Text style={s.predictionsTitle}>AI Price Targets for {symbol.toUpperCase()}</Text>
            {predictions.map((p, i) => {
              const positive = (p.change ?? 0) >= 0;
              return (
                <TouchableOpacity key={i} style={s.predRow} onPress={() => handleCreateFromPrediction(p)}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.predHorizon}>{p.horizon}</Text>
                    <View style={s.predValues}>
                      <Text style={s.predPrice}>${(p.price ?? 0).toFixed(2)}</Text>
                      <Text style={[s.predChange, { color: positive ? C.accent : C.danger }]}>
                        {positive ? '+' : ''}{(p.change ?? 0).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                  <View style={s.predRight}>
                    <Text style={s.predConf}>{p.confidence ?? 0}%</Text>
                    <Ionicons name="add-circle-outline" size={20} color={C.accent} />
                  </View>
                </TouchableOpacity>
              );
            })}
            <Text style={s.predHint}>Tap a prediction to create an alert</Text>
          </View>
        )}

        <Text style={s.sectionTitle}>Active Alerts ({activeAlerts.length})</Text>

        {isLoading ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 20 }} />
        ) : activeAlerts.length === 0 ? (
          <View style={s.emptyCard}>
            <Ionicons name="notifications-off-outline" size={48} color={C.border} />
            <Text style={s.emptyText}>No active alerts. Create one above.</Text>
          </View>
        ) : (
          activeAlerts.map(alert => (
            <View key={alert.id} style={s.alertCard}>
              <View style={s.alertHeader}>
                <Text style={s.alertSymbol}>{alert.symbol}</Text>
                <TouchableOpacity onPress={() => deleteAlert.mutate(alert.id)}>
                  <Ionicons name="trash-outline" size={18} color={C.danger} />
                </TouchableOpacity>
              </View>
              <View style={s.alertBody}>
                <View style={s.alertBadge}>
                  <Text style={s.alertType}>{alert.alertType}</Text>
                </View>
                <Text style={s.alertTarget}>${alert.targetValue.toFixed(2)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  inputCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 16 },
  inputLabel: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  symbolInput: { flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, color: C.textPrimary, fontSize: 15 },
  priceInput: { flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, color: C.textPrimary, fontSize: 15 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  suggestBtn: { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: C.purple, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center' },
  suggestBtnText: { color: C.bg, fontWeight: '700', fontSize: 14 },
  createBtn: { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: C.accent, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center' },
  createBtnText: { color: C.bg, fontWeight: '700', fontSize: 14 },
  predictionsCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.purple + '40', padding: 16, marginBottom: 16 },
  predictionsTitle: { fontSize: 14, fontWeight: '700', color: C.purple, marginBottom: 12 },
  predRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  predHorizon: { fontSize: 11, color: C.textMuted, fontWeight: '600', marginBottom: 4 },
  predValues: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  predPrice: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  predChange: { fontSize: 13, fontWeight: '700' },
  predRight: { alignItems: 'center', gap: 4 },
  predConf: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  predHint: { fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  emptyCard: { alignItems: 'center', padding: 40, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border },
  emptyText: { fontSize: 13, color: C.textMuted, marginTop: 12 },
  alertCard: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 8 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  alertSymbol: { fontSize: 18, fontWeight: '700', color: C.accent },
  alertBody: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertBadge: { backgroundColor: C.info + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  alertType: { fontSize: 11, fontWeight: '700', color: C.info },
  alertTarget: { fontSize: 20, fontWeight: '800', color: C.textPrimary },
});
