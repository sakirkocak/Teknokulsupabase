import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

interface StudentStats {
  totalQuestions: number;
  correctAnswers: number;
  totalExams: number;
  completedTasks: number;
}

export default function ProfilScreen() {
  const { profile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    totalExams: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!profile) return;

    try {
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!studentProfile) {
        setLoading(false);
        return;
      }

      // Get question stats
      const { data: questionStats } = await supabase
        .from('student_question_stats')
        .select('total_attempted, total_correct')
        .eq('student_id', studentProfile.id);

      // Get exam count
      const { count: examCount } = await supabase
        .from('lgs_mock_exams')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentProfile.id)
        .eq('status', 'completed');

      // Get completed tasks
      const { count: taskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentProfile.id)
        .eq('status', 'completed');

      const totalQuestions = questionStats?.reduce((acc, s) => acc + s.total_attempted, 0) || 0;
      const correctAnswers = questionStats?.reduce((acc, s) => acc + s.total_correct, 0) || 0;

      setStats({
        totalQuestions,
        correctAnswers,
        totalExams: examCount || 0,
        completedTasks: taskCount || 0,
      });
    } catch (error) {
      console.error('Stats yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const successRate = stats.totalQuestions > 0
    ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
    : 0;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      {/* Profile Header */}
      <View style={{
        backgroundColor: '#6366f1',
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
          <Ionicons name="person" size={40} color="#6366f1" />
        </View>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
          {profile?.full_name || 'Öğrenci'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          {profile?.email}
        </Text>
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 12,
          marginTop: 8,
        }}>
          <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Öğrenci</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
        marginTop: -32,
      }}>
        {[
          { label: 'Toplam Soru', value: stats.totalQuestions, icon: 'help-circle', color: '#6366f1' },
          { label: 'Başarı Oranı', value: `%${successRate}`, icon: 'checkmark-circle', color: '#10b981' },
          { label: 'Deneme Sınavı', value: stats.totalExams, icon: 'document-text', color: '#f59e0b' },
          { label: 'Tamamlanan Görev', value: stats.completedTasks, icon: 'checkbox', color: '#ec4899' },
        ].map((stat, index) => (
          <View key={index} style={{ width: '50%', padding: 8 }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <View style={{
                width: 48,
                height: 48,
                backgroundColor: `${stat.color}20`,
                borderRadius: 24,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>
                {stat.value}
              </Text>
              <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                {stat.label}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Menu Items */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6b7280', marginBottom: 12 }}>
          Ayarlar
        </Text>

        {[
          { icon: 'notifications-outline', label: 'Bildirimler', onPress: () => {} },
          { icon: 'shield-outline', label: 'Gizlilik', onPress: () => {} },
          { icon: 'help-circle-outline', label: 'Yardım', onPress: () => {} },
          { icon: 'information-circle-outline', label: 'Hakkında', onPress: () => {} },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
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
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, color: '#1f2937' }}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        ))}

        {/* Sign Out Button */}
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
            Çıkış Yap
          </Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <Text style={{ textAlign: 'center', color: '#9ca3af', marginBottom: 32 }}>
        Teknokul v1.0.0
      </Text>
    </ScrollView>
  );
}

