import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalStudents: number;
  pendingTasks: number;
  completedTasks: number;
  totalClasses: number;
}

export default function CoachDashboard() {
  const { profile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalClasses: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!profile) return;

    try {
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!teacherProfile) {
        setLoading(false);
        return;
      }

      const { count: studentCount } = await supabase
        .from('coach_students')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', teacherProfile.id)
        .eq('status', 'approved');

      const { count: pendingCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', teacherProfile.id)
        .in('status', ['pending', 'in_progress', 'submitted']);

      const { count: completedCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', teacherProfile.id)
        .eq('status', 'completed');

      const { count: classCount } = await supabase
        .from('classrooms')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', teacherProfile.id)
        .eq('is_active', true);

      setStats({
        totalStudents: studentCount || 0,
        pendingTasks: pendingCount || 0,
        completedTasks: completedCount || 0,
        totalClasses: classCount || 0,
      });
    } catch (error) {
      console.error('Veri hatasi:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f3f4f6' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{
        backgroundColor: '#10b981',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Hos geldiniz,</Text>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
              {profile?.full_name || 'Koc'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={signOut}
            style={{
              width: 44,
              height: 44,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: -24 }}>
        {[
          { label: 'Ogrenci', value: stats.totalStudents, icon: 'people', color: '#6366f1' },
          { label: 'Bekleyen', value: stats.pendingTasks, icon: 'time', color: '#f59e0b' },
          { label: 'Tamamlanan', value: stats.completedTasks, icon: 'checkmark-circle', color: '#10b981' },
          { label: 'Sinif', value: stats.totalClasses, icon: 'school', color: '#ec4899' },
        ].map((stat, index) => (
          <View key={index} style={{ width: '50%', padding: 6 }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 16,
              elevation: 3,
            }}>
              <View style={{
                width: 40,
                height: 40,
                backgroundColor: stat.color + '20',
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>{stat.value}</Text>
              <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{stat.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

