import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

interface Student {
  id: string;
  student_name: string;
  avatar_url: string | null;
  total_tasks: number;
  completed_tasks: number;
}

export default function OgrencilerScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    if (!profile) return;

    try {
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!teacherProfile) return;

      const { data: studentsData } = await supabase
        .from('coach_students')
        .select(`
          student_id,
          student:student_profiles(
            id,
            profile:profiles(full_name, avatar_url)
          )
        `)
        .eq('coach_id', teacherProfile.id)
        .eq('status', 'approved');

      if (studentsData) {
        const enrichedStudents = await Promise.all(
          studentsData.map(async (s) => {
            const { count: totalTasks } = await supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', s.student_id);

            const { count: completedTasks } = await supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', s.student_id)
              .eq('status', 'completed');

            return {
              id: s.student_id,
              student_name: s.student?.profile?.full_name || 'Ogrenci',
              avatar_url: s.student?.profile?.avatar_url,
              total_tasks: totalTasks || 0,
              completed_tasks: completedTasks || 0,
            };
          })
        );

        setStudents(enrichedStudents);
      }
    } catch (error) {
      console.error('Ogrenciler yuklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
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
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {students.length === 0 ? (
        <View style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 32,
          alignItems: 'center',
        }}>
          <Ionicons name="people-outline" size={48} color="#d1d5db" />
          <Text style={{ color: '#6b7280', marginTop: 12 }}>Henuz ogrenci yok</Text>
        </View>
      ) : (
        students.map((student) => {
          const progress = student.total_tasks > 0
            ? Math.round((student.completed_tasks / student.total_tasks) * 100)
            : 0;

          return (
            <TouchableOpacity
              key={student.id}
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{
                width: 50,
                height: 50,
                backgroundColor: '#e0e7ff',
                borderRadius: 25,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ color: '#6366f1', fontWeight: 'bold', fontSize: 18 }}>
                  {student.student_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '600', fontSize: 16, color: '#1f2937' }}>
                  {student.student_name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <View style={{
                    flex: 1,
                    height: 6,
                    backgroundColor: '#e5e7eb',
                    borderRadius: 3,
                    marginRight: 8,
                  }}>
                    <View style={{
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: '#10b981',
                      borderRadius: 3,
                    }} />
                  </View>
                  <Text style={{ color: '#6b7280', fontSize: 12 }}>
                    {student.completed_tasks}/{student.total_tasks}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

