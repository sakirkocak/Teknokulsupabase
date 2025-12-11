import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  student?: {
    profile?: {
      full_name: string;
    };
  };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Bekliyor', color: '#f59e0b', bgColor: '#fef3c7' },
  in_progress: { label: 'Devam Ediyor', color: '#3b82f6', bgColor: '#dbeafe' },
  submitted: { label: 'Gonderildi', color: '#8b5cf6', bgColor: '#ede9fe' },
  completed: { label: 'Tamamlandi', color: '#10b981', bgColor: '#dcfce7' },
};

export default function GorevlerScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    if (!profile) return;

    try {
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!teacherProfile) return;

      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          *,
          student:student_profiles(
            profile:profiles(full_name)
          )
        `)
        .eq('coach_id', teacherProfile.id)
        .order('created_at', { ascending: false });

      if (tasksData) setTasks(tasksData);
    } catch (error) {
      console.error('Gorevler yuklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 60, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}
        contentContainerStyle={{ padding: 12, gap: 8 }}
      >
        {[
          { key: 'all', label: 'Tumu' },
          { key: 'submitted', label: 'Incelenecek' },
          { key: 'pending', label: 'Bekleyen' },
          { key: 'completed', label: 'Tamamlanan' },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => setFilter(item.key)}
            style={{
              backgroundColor: filter === item.key ? '#10b981' : '#f3f4f6',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{
              color: filter === item.key ? 'white' : '#6b7280',
              fontWeight: '600',
            }}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredTasks.length === 0 ? (
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 32,
            alignItems: 'center',
          }}>
            <Ionicons name="clipboard-outline" size={48} color="#d1d5db" />
            <Text style={{ color: '#6b7280', marginTop: 12 }}>Gorev bulunamadi</Text>
          </View>
        ) : (
          filteredTasks.map((task) => {
            const status = statusConfig[task.status] || statusConfig.pending;

            return (
              <TouchableOpacity
                key={task.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: status.color,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', fontSize: 16, color: '#1f2937' }}>{task.title}</Text>
                    <Text style={{ color: '#6b7280', marginTop: 4 }} numberOfLines={2}>
                      {task.description || 'Aciklama yok'}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: status.bgColor,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}>
                    <Text style={{ color: status.color, fontSize: 12, fontWeight: '600' }}>{status.label}</Text>
                  </View>
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: '#f3f4f6',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="person-outline" size={14} color="#9ca3af" />
                    <Text style={{ color: '#6b7280', fontSize: 12, marginLeft: 4 }}>
                      {task.student?.profile?.full_name || 'Ogrenci'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                    <Text style={{ color: '#6b7280', fontSize: 12, marginLeft: 4 }}>
                      {formatDate(task.created_at)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

