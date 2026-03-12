import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  StyleSheet,
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

const STORAGE_KEY = 'sf-webhooks';

interface Webhook {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

const INTEGRATIONS = [
  {
    name: 'Discord',
    icon: 'logo-discord' as const,
    color: '#5865F2',
    description: 'Send signal alerts to a Discord channel via webhook',
  },
  {
    name: 'Telegram',
    icon: 'paper-plane-outline' as const,
    color: '#26A5E4',
    description: 'Push notifications to a Telegram bot or group',
  },
  {
    name: 'Slack',
    icon: 'chatbox-outline' as const,
    color: '#E01E5A',
    description: 'Post signal updates to a Slack workspace channel',
  },
];

export default function WebhooksScreen() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setWebhooks(raw ? JSON.parse(raw) : []);
    } catch {
      setWebhooks([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (list: Webhook[]) => {
    setWebhooks(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleAdd = () => {
    const trimName = name.trim();
    const trimUrl = url.trim();
    if (!trimName || !trimUrl) {
      Alert.alert('Validation', 'Name and URL are required');
      return;
    }
    if (!trimUrl.startsWith('http')) {
      Alert.alert('Validation', 'URL must start with http:// or https://');
      return;
    }
    const webhook: Webhook = {
      id: Date.now().toString(),
      name: trimName,
      url: trimUrl,
      enabled: true,
    };
    save([webhook, ...webhooks]);
    setName('');
    setUrl('');
    setShowForm(false);
  };

  const toggleEnabled = (id: string) => {
    save(webhooks.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)));
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Webhook', 'Remove this webhook?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => save(webhooks.filter((w) => w.id !== id)) },
    ]);
  };

  const maskUrl = (u: string) => {
    try {
      const parsed = new URL(u);
      const path = parsed.pathname;
      const masked = path.length > 12 ? path.slice(0, 8) + '****' + path.slice(-4) : path;
      return parsed.origin + masked;
    } catch {
      return u.slice(0, 20) + '****';
    }
  };

  const renderWebhook = ({ item }: { item: Webhook }) => (
    <View style={s.webhookCard}>
      <View style={s.webhookHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.webhookName}>{item.name}</Text>
          <Text style={s.webhookUrl}>{maskUrl(item.url)}</Text>
        </View>
        <Switch
          value={item.enabled}
          onValueChange={() => toggleEnabled(item.id)}
          trackColor={{ false: C.border, true: C.accent + '50' }}
          thumbColor={item.enabled ? C.accent : C.textMuted}
        />
      </View>
      <TouchableOpacity style={s.deleteRow} onPress={() => handleDelete(item.id)}>
        <Ionicons name="trash-outline" size={14} color={C.danger} />
        <Text style={s.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Webhook Config</Text>

        {showForm ? (
          <View style={s.form}>
            <TextInput
              style={s.input}
              placeholder="Webhook name"
              placeholderTextColor={C.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={s.input}
              placeholder="https://example.com/webhook"
              placeholderTextColor={C.textMuted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={s.formActions}>
              <TouchableOpacity style={s.addBtn} onPress={handleAdd}>
                <Ionicons name="add" size={18} color={C.bg} />
                <Text style={s.addBtnText}>Add Webhook</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={s.addToggle} onPress={() => setShowForm(true)}>
            <Ionicons name="add-circle" size={22} color={C.accent} />
            <Text style={s.addToggleText}>Add Webhook</Text>
          </TouchableOpacity>
        )}

        {webhooks.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Your Webhooks ({webhooks.length})</Text>
            {webhooks.map((w) => (
              <View key={w.id}>{renderWebhook({ item: w })}</View>
            ))}
          </View>
        )}

        <View style={s.section}>
          <Text style={s.sectionTitle}>Integrations</Text>
          {INTEGRATIONS.map((integration) => (
            <View key={integration.name} style={s.integrationCard}>
              <View style={[s.integrationIcon, { backgroundColor: integration.color + '18' }]}>
                <Ionicons name={integration.icon} size={24} color={integration.color} />
              </View>
              <View style={s.integrationBody}>
                <Text style={s.integrationName}>{integration.name}</Text>
                <Text style={s.integrationDesc}>{integration.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: C.textPrimary, marginBottom: 16 },
  addToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 8,
  },
  addToggleText: { fontSize: 15, fontWeight: '600', color: C.accent },
  form: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 12,
    marginBottom: 16,
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
  formActions: { flexDirection: 'row', gap: 10 },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addBtnText: { fontSize: 15, fontWeight: '700', color: C.bg },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: C.textMuted, fontWeight: '600' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  webhookCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },
  webhookHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  webhookName: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  webhookUrl: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  deleteText: { fontSize: 12, color: C.danger, fontWeight: '600' },
  integrationCard: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 10,
    gap: 14,
    alignItems: 'center',
  },
  integrationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  integrationBody: { flex: 1 },
  integrationName: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  integrationDesc: { fontSize: 12, color: C.textMuted, marginTop: 4, lineHeight: 18 },
});
