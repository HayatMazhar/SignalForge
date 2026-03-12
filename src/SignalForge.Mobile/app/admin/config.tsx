import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

export default function SystemConfigScreen() {
  const [alphaVantageKey, setAlphaVantageKey] = useState('sk-****-****-****');
  const [openAiKey, setOpenAiKey] = useState('sk-****-****-****');
  const [finnhubKey, setFinnhubKey] = useState('****-****');

  const [enableAiSignals, setEnableAiSignals] = useState(true);
  const [enableWebhooks, setEnableWebhooks] = useState(true);
  const [enableSentiment, setEnableSentiment] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [enableRegistration, setEnableRegistration] = useState(true);

  const [maxSignalsPerDay, setMaxSignalsPerDay] = useState('500');
  const [maxUsersCount, setMaxUsersCount] = useState('1000');
  const [rateLimit, setRateLimit] = useState('100');
  const [sessionTimeout, setSessionTimeout] = useState('30');

  const [showKeys, setShowKeys] = useState(false);

  const handleSave = () => {
    Alert.alert(
      'Save Configuration',
      'System configuration updated successfully.\n\nChanges have been applied.',
      [{ text: 'OK' }],
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.titleRow}>
          <Text style={s.title}>System Config</Text>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
            <Ionicons name="save-outline" size={18} color={C.bg} />
            <Text style={s.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* API Keys */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="key-outline" size={18} color={C.warning} />
            <Text style={s.sectionTitle}>API Keys</Text>
            <TouchableOpacity onPress={() => setShowKeys(!showKeys)} style={s.toggleEye}>
              <Ionicons
                name={showKeys ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={C.textMuted}
              />
            </TouchableOpacity>
          </View>
          <ConfigInput
            label="Alpha Vantage"
            value={alphaVantageKey}
            onChangeText={setAlphaVantageKey}
            secure={!showKeys}
          />
          <ConfigInput
            label="OpenAI"
            value={openAiKey}
            onChangeText={setOpenAiKey}
            secure={!showKeys}
          />
          <ConfigInput
            label="Finnhub"
            value={finnhubKey}
            onChangeText={setFinnhubKey}
            secure={!showKeys}
          />
        </View>

        {/* Feature Flags */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="toggle-outline" size={18} color={C.accent} />
            <Text style={s.sectionTitle}>Feature Flags</Text>
          </View>
          <FlagRow label="AI Signal Generation" value={enableAiSignals} onToggle={setEnableAiSignals} />
          <FlagRow label="Webhook Notifications" value={enableWebhooks} onToggle={setEnableWebhooks} />
          <FlagRow label="Sentiment Analysis" value={enableSentiment} onToggle={setEnableSentiment} />
          <FlagRow label="Maintenance Mode" value={maintenanceMode} onToggle={setMaintenanceMode} danger />
          <FlagRow label="User Registration" value={enableRegistration} onToggle={setEnableRegistration} />
        </View>

        {/* Limits */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="speedometer-outline" size={18} color={C.info} />
            <Text style={s.sectionTitle}>Limits</Text>
          </View>
          <ConfigInput
            label="Max Signals / Day"
            value={maxSignalsPerDay}
            onChangeText={setMaxSignalsPerDay}
            keyboard="numeric"
          />
          <ConfigInput
            label="Max Users"
            value={maxUsersCount}
            onChangeText={setMaxUsersCount}
            keyboard="numeric"
          />
          <ConfigInput
            label="Rate Limit (req/min)"
            value={rateLimit}
            onChangeText={setRateLimit}
            keyboard="numeric"
          />
          <ConfigInput
            label="Session Timeout (min)"
            value={sessionTimeout}
            onChangeText={setSessionTimeout}
            keyboard="numeric"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ConfigInput({
  label,
  value,
  onChangeText,
  secure = false,
  keyboard = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
  keyboard?: 'default' | 'numeric';
}) {
  return (
    <View style={s.configField}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.fieldInput}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        placeholderTextColor={C.textMuted}
        keyboardType={keyboard}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

function FlagRow({
  label,
  value,
  onToggle,
  danger = false,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  danger?: boolean;
}) {
  const activeColor = danger ? C.danger : C.accent;
  return (
    <View style={s.flagRow}>
      <Text style={s.flagLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: C.border, true: activeColor + '50' }}
        thumbColor={value ? activeColor : C.textMuted}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '800', color: C.textPrimary },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: C.bg },
  section: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, flex: 1 },
  toggleEye: { padding: 4 },
  configField: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.textMuted, marginBottom: 6 },
  fieldInput: {
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.textPrimary,
    borderWidth: 1,
    borderColor: C.border,
  },
  flagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  flagLabel: { fontSize: 14, color: C.textPrimary, fontWeight: '500' },
});
