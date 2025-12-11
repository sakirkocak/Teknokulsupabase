import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/AuthContext';

export default function ProfilScreen() {
  const { profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Cikis Yap',
      'Hesabinizdan cikis yapmak istediginize emin misiniz?',
      [
        { text: 'Iptal', style: 'cancel' },
        { text: 'Cikis Yap', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <View style={{
        backgroundColor: '#f59e0b',
        paddingTop: 24,
        paddingBottom: 48,
        alignItems: 'center',
      }}>
        <View style={{
          width: 80,
          height: 80,
          backgroundColor: 'white',
          borderRadius: 40,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <Ionicons name="person" size={40} color="#f59e0b" />
        </View>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
          {profile?.full_name || 'Veli'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          {profile?.email}
        </Text>
      </View>

      <View style={{ padding: 16, marginTop: -32 }}>
        {[
          { icon: 'notifications-outline', label: 'Bildirimler' },
          { icon: 'settings-outline', label: 'Ayarlar' },
          { icon: 'help-circle-outline', label: 'Yardim' },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Ionicons name={item.icon as any} size={22} color="#6b7280" />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, color: '#1f2937' }}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            backgroundColor: '#fee2e2',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 16,
          }}
        >
          <Ionicons name="log-out-outline" size={22} color="#dc2626" />
          <Text style={{ marginLeft: 8, fontSize: 16, color: '#dc2626', fontWeight: '600' }}>
            Cikis Yap
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

