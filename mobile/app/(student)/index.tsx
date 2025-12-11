import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface Stats {
  totalQuestions: number;
  correctAnswers: number;
  totalExams: number;
  pendingTasks: number;
}

export default function StudentDashboard() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalQuestions: 0,
    correctAnswers: 0,
    totalExams: 0,
    pendingTasks: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!profile) return;

    try {
      // Get student profile
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!studentProfile) return;

      // Get question stats
      const { data: questionStats } = await supabase
        .from('student_question_stats')
        .select('total_attempted, total_correct')
        .eq('student_id', studentProfile.id);

      // Get exam count
      const { count: examCount } = await supabase
        .from('lgs_mock_exams')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentProfile.id);

      // Get pending tasks
      const { count: taskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentProfile.id)
        .in('status', ['pending', 'in_progress']);

      const totalQuestions = questionStats?.reduce((acc, s) => acc + s.total_attempted, 0) || 0;
      const correctAnswers = questionStats?.reduce((acc, s) => acc + s.total_correct, 0) || 0;

      setStats({
        totalQuestions,
        correctAnswers,
        totalExams: examCount || 0,
        pendingTasks: taskCount || 0,
      });
    } catch (error) {
      console.error('Stats yüklenirken hata:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const successRate = stats.totalQuestions > 0
    ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
    : 0;

  const quickActions = [
    {
      title: 'Soru Çöz',
      subtitle: 'Konu bazlı çalış',
      icon: 'book-outline' as const,
      color: '#6366f1',
      route: '/(student)/soru-bankasi',
    },
    {
      title: 'Deneme Yap',
      subtitle: 'Tam LGS denemesi',
      icon: 'document-text-outline' as const,
      color: '#10b981',
      route: '/(student)/deneme',
    },
    {
      title: 'Görevlerim',
      subtitle: `${stats.pendingTasks} bekleyen`,
      icon: 'checkbox-outline' as const,
      color: '#f59e0b',
      route: '/(student)/gorevler',
    },
    {
      title: 'İlerleme',
      subtitle: 'Raporları gör',
      icon: 'trending-up-outline' as const,
      color: '#ec4899',
      route: '/(student)/profil',
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f3f4f6' }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={{
        backgroundColor: '#6366f1',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Merhaba,</Text>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
              {profile?.full_name || 'Öğrenci'}
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

      {/* Stats Cards */}
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        marginTop: -24,
      }}>
        {[
          { label: 'Çözülen Soru', value: stats.totalQuestions, icon: 'help-circle', color: '#6366f1' },
          { label: 'Başarı Oranı', value: `%${successRate}`, icon: 'checkmark-circle', color: '#10b981' },
          { label: 'Deneme', value: stats.totalExams, icon: 'document', color: '#f59e0b' },
          { label: 'Görev', value: stats.pendingTasks, icon: 'clipboard', color: '#ec4899' },
        ].map((stat, index) => (
          <View key={index} style={{ width: '50%', padding: 6 }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <View style={{
                width: 40,
                height: 40,
                backgroundColor: `${stat.color}20`,
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>
                {stat.value}
              </Text>
              <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                {stat.label}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 }}>
          Hızlı Erişim
        </Text>
        <View style={{ gap: 12 }}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(action.route as any)}
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{
                width: 50,
                height: 50,
                backgroundColor: `${action.color}20`,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Ionicons name={action.icon} size={26} color={action.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
                  {action.title}
                </Text>
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  {action.subtitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Daily Tip */}
      <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 32 }}>
        <View style={{
          backgroundColor: '#fef3c7',
          borderRadius: 16,
          padding: 16,
          borderLeftWidth: 4,
          borderLeftColor: '#f59e0b',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={{ marginLeft: 8, fontWeight: '600', color: '#92400e' }}>
              Günün İpucu
            </Text>
          </View>
          <Text style={{ color: '#78350f', lineHeight: 20 }}>
            Düzenli olarak deneme çözmek, sınav stresini azaltır ve zaman yönetimini geliştirir.
            Her gün en az 20 soru çözmeyi hedefle!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

