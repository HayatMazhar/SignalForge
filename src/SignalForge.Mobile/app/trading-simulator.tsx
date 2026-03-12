import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/api/client';

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

const STORAGE_KEY = 'sf-paper-trading';
const INITIAL_CASH = 100000;

type Position = { symbol: string; qty: number; avgCost: number };
type HistoryEntry = { action: 'buy' | 'sell'; symbol: string; qty: number; price: number; date: string };
type PaperData = {
  cash: number;
  positions: Position[];
  history: HistoryEntry[];
};

const DEFAULT_DATA: PaperData = {
  cash: INITIAL_CASH,
  positions: [],
  history: [],
};

export default function TradingSimulatorScreen() {
  const [data, setData] = useState<PaperData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [buySymbol, setBuySymbol] = useState('');
  const [buyQty, setBuyQty] = useState('');
  const [sellSymbol, setSellSymbol] = useState('');
  const [sellQty, setSellQty] = useState('');
  const [buyPending, setBuyPending] = useState(false);
  const [sellPending, setSellPending] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PaperData;
        setData({
          cash: parsed.cash ?? INITIAL_CASH,
          positions: parsed.positions ?? [],
          history: parsed.history ?? [],
        });
      }
    } catch {
      setData(DEFAULT_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (d: PaperData) => {
    setData(d);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  };

  const handleBuy = async () => {
    const symbol = buySymbol.trim().toUpperCase();
    const qty = parseInt(buyQty, 10);
    if (!symbol || !qty || qty < 1) {
      Alert.alert('Validation', 'Enter valid symbol and quantity');
      return;
    }
    setBuyPending(true);
    try {
      const res = await api.get(`/stocks/${symbol}/quote`);
      const price = (res.data as any)?.price ?? 100;
      const cost = price * qty;
      if (data.cash < cost) {
        Alert.alert('Insufficient', `Need $${cost.toFixed(2)}, have $${data.cash.toFixed(2)}`);
        setBuyPending(false);
        return;
      }
      const newPositions = [...data.positions];
      const existing = newPositions.find((p) => p.symbol === symbol);
      const entry: HistoryEntry = { action: 'buy', symbol, qty, price, date: new Date().toISOString() };
      if (existing) {
        const totalQty = existing.qty + qty;
        const totalCost = existing.avgCost * existing.qty + price * qty;
        existing.qty = totalQty;
        existing.avgCost = totalCost / totalQty;
      } else {
        newPositions.push({ symbol, qty, avgCost: price });
      }
      await save({
        cash: data.cash - cost,
        positions: newPositions,
        history: [...data.history, entry],
      });
      setBuySymbol('');
      setBuyQty('');
    } catch {
      Alert.alert('Error', 'Failed to fetch quote');
    } finally {
      setBuyPending(false);
    }
  };

  const handleSell = async () => {
    const symbol = sellSymbol.trim().toUpperCase();
    const qty = parseInt(sellQty, 10);
    const pos = data.positions.find((p) => p.symbol === symbol);
    if (!pos || !qty || qty < 1 || qty > pos.qty) {
      Alert.alert('Validation', 'Select a position and valid quantity');
      return;
    }
    setSellPending(true);
    try {
      const res = await api.get(`/stocks/${symbol}/quote`);
      const price = (res.data as any)?.price ?? pos.avgCost;
      const proceeds = price * qty;
      const newPositions = data.positions
        .map((p) => (p.symbol === symbol ? { ...p, qty: p.qty - qty } : p))
        .filter((p) => p.qty > 0);
      const entry: HistoryEntry = { action: 'sell', symbol, qty, price, date: new Date().toISOString() };
      await save({
        cash: data.cash + proceeds,
        positions: newPositions,
        history: [...data.history, entry],
      });
      setSellSymbol('');
      setSellQty('');
    } catch {
      Alert.alert('Error', 'Failed to fetch quote');
    } finally {
      setSellPending(false);
    }
  };

  const totalPositionsValue = data.positions.reduce(
    (sum, p) => sum + p.qty * p.avgCost,
    0
  );
  const totalValue = data.cash + totalPositionsValue;
  const totalPL = totalValue - INITIAL_CASH;

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['bottom']}>
        <View style={s.centered}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Paper Trading</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Total Value</Text>
            <Text style={s.statValue}>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Cash</Text>
            <Text style={s.statValue}>${data.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Total P&L</Text>
            <Text style={[s.statValue, { color: totalPL >= 0 ? C.accent : C.danger }]}>
              {totalPL >= 0 ? '+' : ''}${totalPL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Trades</Text>
            <Text style={s.statValue}>{data.history.length}</Text>
          </View>
        </View>

        <View style={s.formSection}>
          <Text style={s.sectionTitle}>Buy</Text>
          <TextInput
            style={s.input}
            placeholder="Symbol"
            placeholderTextColor={C.textMuted}
            value={buySymbol}
            onChangeText={setBuySymbol}
            autoCapitalize="characters"
          />
          <TextInput
            style={s.input}
            placeholder="Quantity"
            placeholderTextColor={C.textMuted}
            value={buyQty}
            onChangeText={setBuyQty}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={[s.btn, s.buyBtn, buyPending && s.btnDisabled]}
            onPress={handleBuy}
            disabled={buyPending}
          >
            {buyPending ? <ActivityIndicator color={C.bg} size="small" /> : <Text style={s.btnText}>Buy</Text>}
          </TouchableOpacity>
        </View>

        <View style={s.formSection}>
          <Text style={s.sectionTitle}>Sell</Text>
          <TextInput
            style={s.input}
            placeholder="Symbol"
            placeholderTextColor={C.textMuted}
            value={sellSymbol}
            onChangeText={setSellSymbol}
            autoCapitalize="characters"
          />
          <TextInput
            style={s.input}
            placeholder="Quantity"
            placeholderTextColor={C.textMuted}
            value={sellQty}
            onChangeText={setSellQty}
            keyboardType="number-pad"
          />
          <View style={s.positionChips}>
            {data.positions.map((p) => (
              <TouchableOpacity
                key={p.symbol}
                style={[s.chip, sellSymbol === p.symbol && s.chipActive]}
                onPress={() => setSellSymbol(p.symbol)}
              >
                <Text style={s.chipText}>{p.symbol} ({p.qty})</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[s.btn, s.sellBtn, sellPending && s.btnDisabled]}
            onPress={handleSell}
            disabled={sellPending}
          >
            {sellPending ? <ActivityIndicator color={C.bg} size="small" /> : <Text style={s.btnText}>Sell</Text>}
          </TouchableOpacity>
        </View>

        <View style={s.positionsSection}>
          <Text style={s.sectionTitle}>Portfolio</Text>
          {data.positions.length === 0 ? (
            <Text style={s.emptyText}>No positions</Text>
          ) : (
            data.positions.map((p) => {
              const value = p.qty * p.avgCost;
              const pl = value - p.qty * p.avgCost;
              return (
                <View key={p.symbol} style={s.positionCard}>
                  <View style={s.positionHeader}>
                    <Text style={s.posSymbol}>{p.symbol}</Text>
                    <Text style={s.posValue}>${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                  </View>
                  <Text style={s.posMeta}>Qty: {p.qty} @ ${p.avgCost.toFixed(2)} • P&L: ${pl.toFixed(2)}</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={s.historySection}>
          <Text style={s.sectionTitle}>Trade History</Text>
          {data.history.length === 0 ? (
            <Text style={s.emptyText}>No trades yet</Text>
          ) : (
            data.history
              .slice()
              .reverse()
              .slice(0, 20)
              .map((h, i) => (
                <View key={i} style={s.historyRow}>
                  <Text style={[s.histAction, { color: h.action === 'buy' ? C.accent : C.danger }]}>
                    {h.action.toUpperCase()}
                  </Text>
                  <Text style={s.histSymbol}>{h.symbol}</Text>
                  <Text style={s.histQty}>{h.qty} @ ${h.price.toFixed(2)}</Text>
                  <Text style={s.histDate}>{new Date(h.date).toLocaleDateString()}</Text>
                </View>
              ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  title: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  statLabel: { fontSize: 12, color: C.textMuted, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: C.textPrimary },
  formSection: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  input: {
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: C.textPrimary,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buyBtn: { backgroundColor: C.accent },
  sellBtn: { backgroundColor: C.danger },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 15, fontWeight: '700', color: C.bg },
  positionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    backgroundColor: C.bg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: { borderColor: C.accent, backgroundColor: C.accent + '15' },
  chipText: { fontSize: 13, color: C.textPrimary, fontWeight: '600' },
  positionsSection: { marginBottom: 20 },
  positionCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  positionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  posSymbol: { fontSize: 16, fontWeight: '800', color: C.accent },
  posValue: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  posMeta: { fontSize: 12, color: C.textMuted, marginTop: 6 },
  historySection: {},
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  histAction: { fontSize: 12, fontWeight: '800', width: 36 },
  histSymbol: { fontSize: 14, fontWeight: '600', color: C.textPrimary, width: 50 },
  histQty: { fontSize: 13, color: C.textMuted, flex: 1 },
  histDate: { fontSize: 11, color: C.textMuted },
  emptyText: { fontSize: 14, color: C.textMuted, marginTop: 8 },
});
