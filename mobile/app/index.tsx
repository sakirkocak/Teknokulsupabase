import { Redirect } from 'expo-router';
import { useAuth } from '../lib/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6366f1' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (profile?.role === 'ogrenci') {
    return <Redirect href="/(student)/" />;
  }

  if (profile?.role === 'koc') {
    return <Redirect href="/(coach)/" />;
  }

  if (profile?.role === 'veli') {
    return <Redirect href="/(parent)/" />;
  }

  return <Redirect href="/(auth)/login" />;
}

