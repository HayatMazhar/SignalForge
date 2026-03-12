import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/stores/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      await login(res.token, res.refreshToken, res.user);
      router.replace('/(tabs)');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#06060B' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ fontSize: 32, fontWeight: '900', color: '#00FF94', marginBottom: 4 }}>SignalForge</Text>
          <Text style={{ fontSize: 14, color: '#5B6378' }}>AI Trading Intelligence</Text>
        </View>

        <View style={{ backgroundColor: '#0C0F1A', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1A1F35' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#F0F4F8', marginBottom: 4 }}>Welcome back</Text>
          <Text style={{ fontSize: 13, color: '#5B6378', marginBottom: 24 }}>Sign in to your account</Text>

          {error ? (
            <View style={{ backgroundColor: 'rgba(255,59,92,0.1)', borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <Text style={{ color: '#FF3B5C', fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <Text style={{ fontSize: 11, fontWeight: '600', color: '#5B6378', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#5B637850" keyboardType="email-address" autoCapitalize="none"
            style={{ backgroundColor: '#06060B', borderWidth: 1, borderColor: '#1A1F35', borderRadius: 12, padding: 14, color: '#F0F4F8', fontSize: 14, marginBottom: 16 }} />

          <Text style={{ fontSize: 11, fontWeight: '600', color: '#5B6378', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Password</Text>
          <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#5B637850" secureTextEntry
            style={{ backgroundColor: '#06060B', borderWidth: 1, borderColor: '#1A1F35', borderRadius: 12, padding: 14, color: '#F0F4F8', fontSize: 14, marginBottom: 24 }} />

          <TouchableOpacity onPress={handleLogin} disabled={loading}
            style={{ backgroundColor: '#00FF94', borderRadius: 12, padding: 14, alignItems: 'center', opacity: loading ? 0.5 : 1 }}>
            {loading ? <ActivityIndicator color="#06060B" /> : <Text style={{ color: '#06060B', fontWeight: '700', fontSize: 15 }}>Sign In</Text>}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
            <Text style={{ color: '#5B6378', fontSize: 13 }}>Don't have an account? </Text>
            <Link href="/(auth)/register"><Text style={{ color: '#00FF94', fontWeight: '600', fontSize: 13 }}>Sign up</Text></Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
