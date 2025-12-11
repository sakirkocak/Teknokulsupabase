import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface Topic {
  id: string;
  subject: string;
  main_topic: string;
  sub_topic: string;
}

interface Question {
  id: string;
  topic_id: string;
  difficulty: string;
  question_text: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: string;
  explanation: string | null;
  topic?: Topic;
}

const subjects = [
  { name: 'Türkçe', color: '#3b82f6', icon: 'book' },
  { name: 'Matematik', color: '#ef4444', icon: 'calculator' },
  { name: 'Fen Bilimleri', color: '#10b981', icon: 'flask' },
  { name: 'İnkılap Tarihi', color: '#f59e0b', icon: 'flag' },
  { name: 'Din Kültürü', color: '#14b8a6', icon: 'moon' },
  { name: 'İngilizce', color: '#8b5cf6', icon: 'language' },
];

const difficultyColors: Record<string, string> = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#f97316',
  legendary: '#8b5cf6',
};

const difficultyLabels: Record<string, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
  legendary: 'Efsane',
};

export default function SoruBankasiScreen() {
  const { profile } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  
  // Practice mode
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Get student profile ID
    if (profile) {
      const { data: sp } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();
      if (sp) setStudentProfileId(sp.id);
    }

    // Load topics
    const { data: topicsData } = await supabase
      .from('lgs_topics')
      .select('*')
      .eq('is_active', true)
      .order('subject')
      .order('main_topic');

    if (topicsData) setTopics(topicsData);

    // Load question counts per subject
    const { data: questions } = await supabase
      .from('lgs_questions')
      .select('topic_id')
      .eq('is_active', true);

    if (questions && topicsData) {
      const counts: Record<string, number> = {};
      const topicSubjectMap: Record<string, string> = {};
      
      topicsData.forEach(t => {
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

  const startPractice = async (subject: string) => {
    // Get random question from subject
    const subjectTopics = topics.filter(t => t.subject === subject);
    const topicIds = subjectTopics.map(t => t.id);

    const { data: questions } = await supabase
      .from('lgs_questions')
      .select('*, topic:lgs_topics(*)')
      .in('topic_id', topicIds)
      .eq('is_active', true);

    if (!questions || questions.length === 0) {
      Alert.alert('Hata', 'Bu derste soru bulunamadı.');
      return;
    }

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion);
    setSelectedAnswer(null);
    setShowResult(false);
    setPracticeMode(true);
  };

  const handleAnswer = async (answer: string) => {
    if (showResult || !currentQuestion) return;

    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.correct_answer;
    setShowResult(true);

    setSessionStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
    }));

    // Update stats in database
    if (studentProfileId) {
      const { data: existingStat } = await supabase
        .from('student_question_stats')
        .select('*')
        .eq('student_id', studentProfileId)
        .eq('topic_id', currentQuestion.topic_id)
        .single();

      if (existingStat) {
        await supabase
          .from('student_question_stats')
          .update({
            total_attempted: existingStat.total_attempted + 1,
            total_correct: existingStat.total_correct + (isCorrect ? 1 : 0),
            total_wrong: existingStat.total_wrong + (isCorrect ? 0 : 1),
          })
          .eq('id', existingStat.id);
      } else {
        await supabase
          .from('student_question_stats')
          .insert({
            student_id: studentProfileId,
            topic_id: currentQuestion.topic_id,
            total_attempted: 1,
            total_correct: isCorrect ? 1 : 0,
            total_wrong: isCorrect ? 0 : 1,
          });
      }
    }
  };

  const loadNextQuestion = async () => {
    if (!currentQuestion?.topic?.subject) return;
    
    const subject = currentQuestion.topic.subject;
    const subjectTopics = topics.filter(t => t.subject === subject);
    const topicIds = subjectTopics.map(t => t.id);

    const { data: questions } = await supabase
      .from('lgs_questions')
      .select('*, topic:lgs_topics(*)')
      .in('topic_id', topicIds)
      .eq('is_active', true);

    if (questions && questions.length > 0) {
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      setCurrentQuestion(randomQuestion);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const exitPractice = () => {
    setPracticeMode(false);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setSessionStats({ correct: 0, wrong: 0 });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Practice Mode Modal
  if (practiceMode && currentQuestion) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1e1b4b' }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
          paddingTop: 48,
        }}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Text style={{ color: '#10b981', fontWeight: '600' }}>✓ {sessionStats.correct}</Text>
            <Text style={{ color: '#ef4444', fontWeight: '600' }}>✗ {sessionStats.wrong}</Text>
          </View>
          <TouchableOpacity
            onPress={exitPractice}
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white' }}>Çık</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, padding: 16 }}>
          {/* Difficulty Badge */}
          <View style={{
            backgroundColor: difficultyColors[currentQuestion.difficulty] + '30',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            alignSelf: 'flex-start',
            marginBottom: 16,
          }}>
            <Text style={{ color: difficultyColors[currentQuestion.difficulty], fontWeight: '600' }}>
              {difficultyLabels[currentQuestion.difficulty]}
            </Text>
          </View>

          {/* Question */}
          <Text style={{ color: 'white', fontSize: 18, lineHeight: 28, marginBottom: 24 }}>
            {currentQuestion.question_text}
          </Text>

          {/* Options */}
          {Object.entries(currentQuestion.options).map(([key, value]) => {
            let bgColor = 'rgba(255,255,255,0.1)';
            let borderColor = 'rgba(255,255,255,0.2)';
            
            if (showResult) {
              if (key === currentQuestion.correct_answer) {
                bgColor = 'rgba(16,185,129,0.3)';
                borderColor = '#10b981';
              } else if (key === selectedAnswer) {
                bgColor = 'rgba(239,68,68,0.3)';
                borderColor = '#ef4444';
              }
            } else if (selectedAnswer === key) {
              bgColor = 'rgba(99,102,241,0.3)';
              borderColor = '#6366f1';
            }

            return (
              <TouchableOpacity
                key={key}
                onPress={() => handleAnswer(key)}
                disabled={showResult}
                style={{
                  backgroundColor: bgColor,
                  borderWidth: 2,
                  borderColor: borderColor,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>{key}</Text>
                </View>
                <Text style={{ color: 'white', flex: 1, fontSize: 16 }}>{value}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Result */}
          {showResult && (
            <View style={{ marginTop: 16 }}>
              <View style={{
                backgroundColor: selectedAnswer === currentQuestion.correct_answer
                  ? 'rgba(16,185,129,0.2)'
                  : 'rgba(239,68,68,0.2)',
                padding: 16,
                borderRadius: 12,
                marginBottom: 16,
              }}>
                <Text style={{
                  color: selectedAnswer === currentQuestion.correct_answer ? '#10b981' : '#ef4444',
                  fontWeight: '600',
                  fontSize: 16,
                }}>
                  {selectedAnswer === currentQuestion.correct_answer
                    ? '✓ Doğru Cevap!'
                    : `✗ Yanlış! Doğru cevap: ${currentQuestion.correct_answer}`}
                </Text>
              </View>

              {currentQuestion.explanation && (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 16,
                }}>
                  <Text style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: 8 }}>Açıklama:</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 22 }}>
                    {currentQuestion.explanation}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={loadNextQuestion}
                style={{
                  backgroundColor: '#6366f1',
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                  Sonraki Soru →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <View style={{ padding: 16 }}>
        {/* Subject Cards */}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 }}>
          Ders Seç
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
          {subjects.map((subject) => {
            const count = questionCounts[subject.name] || 0;
            
            return (
              <TouchableOpacity
                key={subject.name}
                onPress={() => startPractice(subject.name)}
                style={{
                  width: '50%',
                  padding: 6,
                }}
              >
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: subject.color,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    backgroundColor: `${subject.color}20`,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}>
                    <Ionicons name={subject.icon as any} size={24} color={subject.color} />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1f2937' }}>
                    {subject.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    {count} soru
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info */}
        <View style={{
          backgroundColor: '#e0e7ff',
          borderRadius: 12,
          padding: 16,
          marginTop: 24,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="information-circle" size={20} color="#4f46e5" />
            <Text style={{ marginLeft: 8, fontWeight: '600', color: '#3730a3' }}>
              Nasıl Çalışır?
            </Text>
          </View>
          <Text style={{ color: '#4338ca', lineHeight: 20 }}>
            Bir ders seçin ve rastgele sorularla pratik yapın. Her doğru cevap için puan kazanın!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

