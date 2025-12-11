import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen email ve şifrenizi girin.');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Giriş Hatası', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, backgroundColor: '#6366f1' }}>
          {/* Header */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
            <View style={{
              width: 80,
              height: 80,
              backgroundColor: 'white',
              borderRadius: 20,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="school" size={48} color="#6366f1" />
            </View>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>Teknokul</Text>
            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
              Akıllı Eğitim Platformu
            </Text>
          </View>

          {/* Form */}
          <View style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 48,
          }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 24 }}>
              Giriş Yap
            </Text>

            {/* Email Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Email</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: 12,
                paddingHorizontal: 16,
              }}>
                <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                <TextInput
                  style={{ flex: 1, paddingVertical: 16, paddingLeft: 12, fontSize: 16 }}
                  placeholder="ornek@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Şifre</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: 12,
                paddingHorizontal: 16,
              }}>
                <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
                <TextInput
                  style={{ flex: 1, paddingVertical: 16, paddingLeft: 12, fontSize: 16 }}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{
                backgroundColor: '#6366f1',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                marginBottom: 16,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>Giriş Yap</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Text style={{ color: '#6b7280' }}>Hesabınız yok mu? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={{ color: '#6366f1', fontWeight: '600' }}>Kayıt Ol</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

