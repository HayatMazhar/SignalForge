import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const STORAGE_KEY = 'sf-trades';

type Trade = {
  id: string;
  symbol: string;
  type: 'Buy' | 'Sell';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  date: string;
};

export default function TradeJournalScreen() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [tradeType, setTradeType] = useState<'Buy' | 'Sell'>('Buy');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const loadTrades = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) setTrades(JSON.parse(raw));
  }, []);

  useEffect(() => { loadTrades(); }, [loadTrades]);

  const saveTrades = async (updated: Trade[]) => {
    setTrades(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAdd = () => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const qty = parseInt(quantity, 10);
    if (!symbol.trim() || isNaN(entry) || isNaN(exit) || isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Input', 'Please fill all fields with valid values.');
      return;
    }
    const trade: Trade = {
      id: Date.now().toString(),
      symbol: symbol.toUpperCase().trim(),
      type: tradeType,
      entryPrice: entry,
      exitPrice: exit,
      quantity: qty,
      date: new Date().toISOString().split('T')[0],
    };
    saveTrades([trade, ...trades]);
    setSymbol('');
    setEntryPrice('');
    setExitPrice('');
    setQuantity('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Trade', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => saveTrades(trades.filter((t) => t.id !== id)) },
    ]);
  };

  const calcPnL = (t: Trade) => {
    const diff = t.type === 'Buy' ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice;
    return diff * t.quantity;
  };

  const totalPnL = trades.reduce((s, t) => s + calcPnL(t), 0);
  const wins = trades.filter((t) => calcPnL(t) > 0).length;
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : '0';

  const renderTrade = ({ item }: { item: Trade }) => {
    const pnl = calcPnL(item);
    const positive = pnl >= 0;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onLongPress={() => handleDelete(item.id)}
      >
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.symbol}>{item.symbol}</Text>
            <View style={[styles.typeBadge, { backgroundColor: (item.type === 'Buy' ? C.accent : C.danger) + '22' }]}>
              <Text style={[styles.typeText, { color: item.type === 'Buy' ? C.accent : C.danger }]}>
                {item.type}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <View style={styles.tradeDetails}>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Entry</Text>
            <Text style={styles.detailValue}>${item.entryPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Exit</Text>
            <Text style={styles.detailValue}>${item.exitPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Qty</Text>
            <Text style={styles.detailValue}>{item.quantity}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>P&L</Text>
            <Text style={[styles.pnlValue, { color: positive ? C.accent : C.danger }]}>
              {positive ? '+' : ''}{pnl.toFixed(2)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Trades</Text>
            <Text style={styles.statValue}>{trades.length}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={[styles.statValue, { color: C.accent }]}>{winRate}%</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Total P&L</Text>
            <Text style={[styles.statValue, { color: totalPnL >= 0 ? C.accent : C.danger }]}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </Text>
          </View>
        </View>

        {showForm && (
          <View style={styles.form}>
            <TextInput
              style={styles.formInput}
              placeholder="Symbol"
              placeholderTextColor={C.textMuted}
              value={symbol}
              onChangeText={setSymbol}
              autoCapitalize="characters"
            />
            <View style={styles.toggleRow}>
              {(['Buy', 'Sell'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.toggleBtn, tradeType === t && styles.toggleActive, tradeType === t && t === 'Sell' && { borderColor: C.danger, backgroundColor: C.danger + '15' }]}
                  onPress={() => setTradeType(t)}
                >
                  <Text style={[styles.toggleText, tradeType === t && { color: t === 'Buy' ? C.accent : C.danger }]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.formRow}>
              <TextInput style={[styles.formInput, { flex: 1 }]} placeholder="Entry $" placeholderTextColor={C.textMuted} value={entryPrice} onChangeText={setEntryPrice} keyboardType="decimal-pad" />
              <TextInput style={[styles.formInput, { flex: 1 }]} placeholder="Exit $" placeholderTextColor={C.textMuted} value={exitPrice} onChangeText={setExitPrice} keyboardType="decimal-pad" />
              <TextInput style={[styles.formInput, { flex: 1 }]} placeholder="Qty" placeholderTextColor={C.textMuted} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
            </View>
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>Add Trade</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={styles.list}
          data={trades}
          keyExtractor={(item) => item.id}
          renderItem={renderTrade}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="journal-outline" size={48} color={C.textMuted} />
              <Text style={styles.emptyText}>No trades yet. Start journaling!</Text>
            </View>
          }
        />

        {!showForm && (
          <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)} activeOpacity={0.8}>
            <Ionicons name="add" size={28} color={C.bg} />
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, paddingBottom: 80 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 0,
    gap: 10,
  },
  statCell: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  form: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 10,
  },
  formInput: {
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.textPrimary,
    fontSize: 14,
  },
  formRow: { flexDirection: 'row', gap: 8 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  toggleActive: { borderColor: C.accent, backgroundColor: C.accent + '15' },
  toggleText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  addBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: 'center',
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: C.bg },
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
    marginBottom: 10,
  },
  symbol: { fontSize: 18, fontWeight: '700', color: C.accent },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: '700' },
  dateText: { fontSize: 12, color: C.textMuted },
  tradeDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  detailCol: { alignItems: 'center' },
  detailLabel: { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  pnlValue: { fontSize: 14, fontWeight: '700' },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: C.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyText: { fontSize: 14, color: C.textMuted, marginTop: 12 },
});
