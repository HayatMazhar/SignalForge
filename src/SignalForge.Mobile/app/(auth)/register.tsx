import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/stores/authStore';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleRegister = async () => {
    if (!fullName || !email || !password) return;
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register(email, password, fullName);
      await login(res.token, res.refreshToken, res.user);
      router.replace('/(tabs)');
    } catch {
      setError('Registration failed. Use 8+ chars, uppercase, digit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#06060B' }} edges={['top', 'bottom']}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#06060B' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ fontSize: 32, fontWeight: '900', color: '#00FF94', marginBottom: 4 }}>SignalForge</Text>
          <Text style={{ fontSize: 14, color: '#5B6378' }}>Create your account</Text>
        </View>

        <View style={{ backgroundColor: '#0C0F1A', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1A1F35' }}>
          {error ? (
            <View style={{ backgroundColor: 'rgba(255,59,92,0.1)', borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <Text style={{ color: '#FF3B5C', fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <Text style={{ fontSize: 11, fontWeight: '600', color: '#5B6378', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Full Name</Text>
          <TextInput value={fullName} onChangeText={setFullName} placeholder="John Doe" placeholderTextColor="#5B637850"
            style={{ backgroundColor: '#06060B', borderWidth: 1, borderColor: '#1A1F35', borderRadius: 12, padding: 14, color: '#F0F4F8', fontSize: 14, marginBottom: 16 }} />

          <Text style={{ fontSize: 11, fontWeight: '600', color: '#5B6378', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#5B637850" keyboardType="email-address" autoCapitalize="none"
            style={{ backgroundColor: '#06060B', borderWidth: 1, borderColor: '#1A1F35', borderRadius: 12, padding: 14, color: '#F0F4F8', fontSize: 14, marginBottom: 16 }} />

          <Text style={{ fontSize: 11, fontWeight: '600', color: '#5B6378', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Password</Text>
          <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#5B637850" secureTextEntry
            style={{ backgroundColor: '#06060B', borderWidth: 1, borderColor: '#1A1F35', borderRadius: 12, padding: 14, color: '#F0F4F8', fontSize: 14, marginBottom: 24 }} />

          <TouchableOpacity onPress={handleRegister} disabled={loading}
            style={{ backgroundColor: '#00FF94', borderRadius: 12, padding: 14, alignItems: 'center', opacity: loading ? 0.5 : 1 }}>
            {loading ? <ActivityIndicator color="#06060B" /> : <Text style={{ color: '#06060B', fontWeight: '700', fontSize: 15 }}>Create Account</Text>}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
            <Text style={{ color: '#5B6378', fontSize: 13 }}>Already have an account? </Text>
            <Link href="/(auth)/login"><Text style={{ color: '#00FF94', fontWeight: '600', fontSize: 13 }}>Sign in</Text></Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
