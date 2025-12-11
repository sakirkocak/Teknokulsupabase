import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerTitle: 'Teknokul',
        }}
      />
      <Tabs.Screen
        name="soru-bankasi"
        options={{
          title: 'Soru Bankası',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
          headerTitle: 'Soru Bankası',
        }}
      />
      <Tabs.Screen
        name="deneme"
        options={{
          title: 'Deneme',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
          headerTitle: 'Deneme Sınavları',
        }}
      />
      <Tabs.Screen
        name="gorevler"
        options={{
          title: 'Görevler',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox" size={size} color={color} />
          ),
          headerTitle: 'Görevlerim',
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerTitle: 'Profil',
        }}
      />
    </Tabs>
  );
}

