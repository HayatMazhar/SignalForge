import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg: '#06060B',
  surface: '#0C0F1A',
  accent: '#00FF94',
  danger: '#FF3B5C',
  textPrimary: '#F0F4F8',
  textMuted: '#5B6378',
  border: '#1A1F35',
};

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <Text style={s.code}>404</Text>
        <Text style={s.heading}>Page Not Found</Text>
        <Text style={s.message}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <TouchableOpacity
          style={s.homeBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.8}
        >
          <Ionicons name="home-outline" size={20} color={C.bg} />
          <Text style={s.homeBtnText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  code: {
    fontSize: 96,
    fontWeight: '900',
    color: C.accent,
    letterSpacing: 4,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: C.textPrimary,
    marginTop: 8,
  },
  message: {
    fontSize: 15,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    maxWidth: 280,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 32,
  },
  homeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.bg,
  },
});
