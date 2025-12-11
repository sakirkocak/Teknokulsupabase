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
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const roles = [
  { id: 'ogrenci', label: 'Öğrenci', icon: 'school-outline' as const, color: '#6366f1' },
  { id: 'koc', label: 'Koç', icon: 'person-outline' as const, color: '#10b981' },
  { id: 'veli', label: 'Veli', icon: 'people-outline' as const, color: '#f59e0b' },
];

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('ogrenci');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName, selectedRole);
    setLoading(false);

    if (error) {
      Alert.alert('Kayıt Hatası', error.message);
    } else {
      Alert.alert('Başarılı', 'Hesabınız oluşturuldu! Giriş yapabilirsiniz.', [
        { text: 'Tamam', onPress: () => router.replace('/(auth)/login') }
      ]);
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
          <View style={{ alignItems: 'center', paddingTop: 60, paddingBottom: 24 }}>
            <View style={{
              width: 64,
              height: 64,
              backgroundColor: 'white',
              borderRadius: 16,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <Ionicons name="school" size={36} color="#6366f1" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Kayıt Ol</Text>
          </View>

          {/* Form */}
          <View style={{
            flex: 1,
            backgroundColor: 'white',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 48,
          }}>
            {/* Role Selection */}
            <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>Hesap Türü</Text>
            <View style={{ flexDirection: 'row', marginBottom: 20, gap: 8 }}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  onPress={() => setSelectedRole(role.id)}
                  style={{
                    flex: 1,
                    backgroundColor: selectedRole === role.id ? role.color : '#f3f4f6',
                    borderRadius: 12,
                    padding: 12,
                    alignItems: 'center',
                  }}
                >
                  <Ionicons
                    name={role.icon}
                    size={24}
                    color={selectedRole === role.id ? 'white' : '#6b7280'}
                  />
                  <Text style={{
                    marginTop: 4,
                    fontSize: 12,
                    fontWeight: '600',
                    color: selectedRole === role.id ? 'white' : '#6b7280',
                  }}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Full Name Input */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Ad Soyad</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: 12,
                paddingHorizontal: 16,
              }}>
                <Ionicons name="person-outline" size={20} color="#9ca3af" />
                <TextInput
                  style={{ flex: 1, paddingVertical: 14, paddingLeft: 12, fontSize: 16 }}
                  placeholder="Adınız Soyadınız"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={{ marginBottom: 12 }}>
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
                  style={{ flex: 1, paddingVertical: 14, paddingLeft: 12, fontSize: 16 }}
                  placeholder="ornek@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: 12 }}>
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
                  style={{ flex: 1, paddingVertical: 14, paddingLeft: 12, fontSize: 16 }}
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

            {/* Confirm Password Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Şifre Tekrar</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: 12,
                paddingHorizontal: 16,
              }}>
                <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
                <TextInput
                  style={{ flex: 1, paddingVertical: 14, paddingLeft: 12, fontSize: 16 }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
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
                <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>Kayıt Ol</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Text style={{ color: '#6b7280' }}>Zaten hesabınız var mı? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={{ color: '#6366f1', fontWeight: '600' }}>Giriş Yap</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

