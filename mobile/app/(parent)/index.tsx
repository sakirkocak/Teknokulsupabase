import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

interface Child {
  id: string;
  name: string;
  total_tasks: number;
  completed_tasks: number;
}

export default function ParentDashboard() {
  const { profile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!profile) return;

    try {
      const { data: parentProfile } = await supabase
        .from('parent_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!parentProfile) {
        setLoading(false);
        return;
      }

      const { data: childrenData } = await supabase
        .from('parent_students')
        .select(`
          student_id,
          student:student_profiles(
            id,
            profile:profiles(full_name)
          )
        `)
        .eq('parent_id', parentProfile.id)
        .eq('status', 'approved');

      if (childrenData) {
        const enriched = await Promise.all(
          childrenData.map(async (c: any) => {
            const { count: totalTasks } = await supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', c.student_id);

            const { count: completedTasks } = await supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', c.student_id)
              .eq('status', 'completed');

            const studentData = c.student as any;
            const profileData = studentData?.profile;

            return {
              id: c.student_id,
              name: profileData?.full_name || 'Cocuk',
              total_tasks: totalTasks || 0,
              completed_tasks: completedTasks || 0,
            };
          })
        );
        setChildren(enriched);
      }
    } catch (error) {
      console.error('Veri yuklenirken hata:', error);
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
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f3f4f6' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{
        backgroundColor: '#f59e0b',
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
              {profile?.full_name || 'Veli'}
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

      <View style={{ padding: 20, marginTop: -24 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 }}>
          Cocuklarim
        </Text>

        {children.length === 0 ? (
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 32,
            alignItems: 'center',
          }}>
            <Ionicons name="people-outline" size={48} color="#d1d5db" />
            <Text style={{ color: '#6b7280', marginTop: 12 }}>Henuz cocuk eklenmemis</Text>
          </View>
        ) : (
          children.map((child) => {
            const progress = child.total_tasks > 0
              ? Math.round((child.completed_tasks / child.total_tasks) * 100)
              : 0;

            return (
              <TouchableOpacity
                key={child.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 50,
                    height: 50,
                    backgroundColor: '#fef3c7',
                    borderRadius: 25,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: 18 }}>
                      {child.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontWeight: '600', fontSize: 16, color: '#1f2937' }}>{child.name}</Text>
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
                        {child.completed_tasks}/{child.total_tasks} gorev
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

