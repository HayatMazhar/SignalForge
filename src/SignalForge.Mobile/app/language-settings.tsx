import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/api/client';

const C = {
  bg: '#06060B', surface: '#0C0F1A', accent: '#00FF94', danger: '#FF3B5C',
  textPrimary: '#F0F4F8', textMuted: '#5B6378', border: '#1A1F35',
  warning: '#FFB020', info: '#38BDF8', purple: '#A78BFA',
};

const STORAGE_KEY = 'sf-language';
const SAMPLE_TEXT = 'Apple stock is looking bullish today with strong momentum.';

type Language = { code: string; name: string; nativeName: string };

export default function LanguageSettingsScreen() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selected, setSelected] = useState('en');
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setSelected(stored);
        const { data } = await api.get<Language[]>('/api/translate/languages');
        setLanguages(data);
      } catch {
        setLanguages([{ code: 'en', name: 'English', nativeName: 'English' }]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectLanguage = async (code: string) => {
    setSelected(code);
    setTranslation(null);
    await AsyncStorage.setItem(STORAGE_KEY, code);
  };

  const testTranslation = async () => {
    if (selected === 'en') {
      setTranslation(SAMPLE_TEXT);
      return;
    }
    setTranslating(true);
    try {
      const { data } = await api.post<{ translatedText: string }>('/api/translate', {
        text: SAMPLE_TEXT,
        language: selected,
      });
      setTranslation(data.translatedText);
    } catch {
      setTranslation('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const selectedLang = languages.find((l) => l.code === selected);

  if (loading) {
    return (
      <SafeAreaView style={s.center} edges={['bottom']}>
        <ActivityIndicator size="large" color={C.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['bottom']}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.heading}>Select Language</Text>
        <Text style={s.subheading}>Choose your preferred language for translations</Text>

        <View style={s.listCard}>
          {languages.map((lang) => {
            const active = lang.code === selected;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[s.row, active && s.rowActive]}
                onPress={() => selectLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <View style={s.rowLeft}>
                  <Text style={[s.langName, active && s.langNameActive]}>{lang.name}</Text>
                  <Text style={s.nativeName}>{lang.nativeName}</Text>
                </View>
                <View style={[s.radio, active && s.radioActive]}>
                  {active && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={s.testBtn} onPress={testTranslation} disabled={translating} activeOpacity={0.8}>
          {translating ? (
            <ActivityIndicator size="small" color={C.bg} />
          ) : (
            <>
              <Ionicons name="language" size={18} color={C.bg} />
              <Text style={s.testBtnText}>Test Translation</Text>
            </>
          )}
        </TouchableOpacity>

        {translation && (
          <View style={s.previewCard}>
            <View style={s.previewHeader}>
              <Ionicons name="text" size={16} color={C.accent} />
              <Text style={s.previewTitle}>
                Translation Preview{selectedLang ? ` — ${selectedLang.name}` : ''}
              </Text>
            </View>
            <Text style={s.originalText}>{SAMPLE_TEXT}</Text>
            <View style={s.divider} />
            <Text style={s.translatedText}>{translation}</Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16 },

  heading: { fontSize: 20, fontWeight: '800', color: C.textPrimary, marginBottom: 4 },
  subheading: { fontSize: 13, color: C.textMuted, marginBottom: 20 },

  listCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  rowActive: { backgroundColor: C.accent + '08' },
  rowLeft: { flex: 1 },
  langName: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  langNameActive: { color: C.accent },
  nativeName: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.textMuted, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.accent },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.accent },

  testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, marginBottom: 20 },
  testBtnText: { fontSize: 14, fontWeight: '800', color: C.bg },

  previewCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  previewTitle: { fontSize: 13, fontWeight: '700', color: C.accent },
  originalText: { fontSize: 13, color: C.textMuted, lineHeight: 20 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  translatedText: { fontSize: 14, fontWeight: '600', color: C.textPrimary, lineHeight: 22 },
});
