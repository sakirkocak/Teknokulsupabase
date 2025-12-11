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
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface MockExam {
  id: string;
  title: string;
  status: string;
  total_correct: number;
  total_wrong: number;
  total_empty: number;
  total_net: number;
  created_at: string;
}

export default function DenemeSinavlariScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [exams, setExams] = useState<MockExam[]>([]);
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    if (profile) {
      const { data: sp } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (sp) {
        setStudentProfileId(sp.id);

        // Load past exams
        const { data: examsData } = await supabase
          .from('lgs_mock_exams')
          .select('*')
          .eq('student_id', sp.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (examsData) setExams(examsData);
      }
    }

    // Load question counts
    const { data: topics } = await supabase
      .from('lgs_topics')
      .select('id, subject');

    const { data: questions } = await supabase
      .from('lgs_questions')
      .select('topic_id')
      .eq('is_active', true);

    if (topics && questions) {
      const counts: Record<string, number> = {};
      const topicSubjectMap: Record<string, string> = {};
      
      topics.forEach(t => {
        topicSubjectMap[t.id] = t.subject;
      });
      
      questions.forEach(q => {
        const subject = topicSubjectMap[q.topic_id];
        if (subject) {
          counts[subject] = (counts[subject] || 0) + 1;
        }
      });
      
      setQuestionCounts(counts);
    }

    setLoading(false);
  };

  const createExam = async () => {
    if (!studentProfileId) return;
    
    setCreating(true);

    try {
      const subjectQuotas = {
        'Türkçe': 20,
        'Matematik': 20,
        'Fen Bilimleri': 20,
        'İnkılap Tarihi': 10,
        'Din Kültürü': 10,
        'İngilizce': 10,
      };

      const allQuestionIds: string[] = [];

      for (const [subject, quota] of Object.entries(subjectQuotas)) {
        const { data: topics } = await supabase
          .from('lgs_topics')
          .select('id')
          .eq('subject', subject);

        if (!topics || topics.length === 0) continue;

        const topicIds = topics.map(t => t.id);

        const { data: questions } = await supabase
          .from('lgs_questions')
          .select('id')
          .in('topic_id', topicIds)
          .eq('is_active', true)
          .limit(quota * 2);

        if (questions && questions.length > 0) {
          const shuffled = questions.sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, Math.min(quota, shuffled.length));
          allQuestionIds.push(...selected.map(q => q.id));
        }
      }

      if (allQuestionIds.length < 50) {
        Alert.alert('Hata', 'Yeterli soru bulunamadı. Lütfen daha fazla soru ekleyin.');
        setCreating(false);
        return;
      }

      const { data: exam, error } = await supabase
        .from('lgs_mock_exams')
        .insert({
          student_id: studentProfileId,
          title: `LGS Deneme ${new Date().toLocaleDateString('tr-TR')}`,
          exam_type: 'full',
          questions: allQuestionIds,
          status: 'created',
          time_limit_minutes: 135,
        })
        .select()
        .single();

      if (error) throw error;

      // Create answer records
      const answerRecords = allQuestionIds.map((qId, index) => ({
        exam_id: exam.id,
        question_id: qId,
        question_order: index + 1,
      }));

      await supabase.from('mock_exam_answers').insert(answerRecords);

      Alert.alert('Başarılı', `${allQuestionIds.length} soruluk deneme oluşturuldu!`);
      loadData();
    } catch (error) {
      console.error('Deneme oluşturma hatası:', error);
      Alert.alert('Hata', 'Deneme oluşturulurken bir hata oluştu.');
    }

    setCreating(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const totalQuestions = Object.values(questionCounts).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      {/* Create Exam Card */}
      <View style={{
        margin: 16,
        backgroundColor: '#6366f1',
        borderRadius: 20,
        padding: 20,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{
            width: 48,
            height: 48,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Ionicons name="document-text" size={24} color="white" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              Tam LGS Denemesi
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
              90 soru • 135 dakika
            </Text>
          </View>
        </View>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginBottom: 16,
          paddingVertical: 12,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 12,
        }}>
          {[
            { label: 'Türkçe', count: questionCounts['Türkçe'] || 0, needed: 20 },
            { label: 'Mat', count: questionCounts['Matematik'] || 0, needed: 20 },
            { label: 'Fen', count: questionCounts['Fen Bilimleri'] || 0, needed: 20 },
          ].map((item, index) => (
            <View key={index} style={{ alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.count}/{item.needed}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{item.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={createExam}
          disabled={creating || totalQuestions < 50}
          style={{
            backgroundColor: 'white',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: creating || totalQuestions < 50 ? 0.7 : 1,
          }}
        >
          {creating ? (
            <ActivityIndicator color="#6366f1" />
          ) : (
            <Text style={{ color: '#6366f1', fontWeight: '600', fontSize: 16 }}>
              Deneme Başlat
            </Text>
          )}
        </TouchableOpacity>

        {totalQuestions < 50 && (
          <Text style={{ color: '#fbbf24', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
            ⚠️ Yeterli soru yok ({totalQuestions}/50)
          </Text>
        )}
      </View>

      {/* Past Exams */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 }}>
          Geçmiş Denemeler
        </Text>

        {exams.length === 0 ? (
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 32,
            alignItems: 'center',
          }}>
            <Ionicons name="document-outline" size={48} color="#d1d5db" />
            <Text style={{ color: '#6b7280', marginTop: 12 }}>
              Henüz deneme çözmediniz
            </Text>
          </View>
        ) : (
          exams.map((exam) => (
            <View
              key={exam.id}
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontWeight: '600', color: '#1f2937' }}>{exam.title}</Text>
                  <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                    {formatDate(exam.created_at)}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: exam.status === 'completed' ? '#dcfce7' : '#fef3c7',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}>
                  <Text style={{
                    color: exam.status === 'completed' ? '#16a34a' : '#d97706',
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                    {exam.status === 'completed' ? 'Tamamlandı' : 'Devam Ediyor'}
                  </Text>
                </View>
              </View>

              {exam.status === 'completed' && (
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: '#e5e7eb',
                }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 16 }}>
                      {exam.total_correct}
                    </Text>
                    <Text style={{ color: '#6b7280', fontSize: 12 }}>Doğru</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 16 }}>
                      {exam.total_wrong}
                    </Text>
                    <Text style={{ color: '#6b7280', fontSize: 12 }}>Yanlış</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#6b7280', fontWeight: 'bold', fontSize: 16 }}>
                      {exam.total_empty}
                    </Text>
                    <Text style={{ color: '#6b7280', fontSize: 12 }}>Boş</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#6366f1', fontWeight: 'bold', fontSize: 16 }}>
                      {exam.total_net?.toFixed(2)}
                    </Text>
                    <Text style={{ color: '#6b7280', fontSize: 12 }}>Net</Text>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

