import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CocuklarScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f3f4f6' }} contentContainerStyle={{ padding: 16 }}>
      <View style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
      }}>
        <Ionicons name="people-outline" size={48} color="#d1d5db" />
        <Text style={{ color: '#6b7280', marginTop: 12, textAlign: 'center' }}>
          Cocuklarinizi eklemek icin web uygulamasini kullanin
        </Text>
      </View>
    </ScrollView>
  );
}

