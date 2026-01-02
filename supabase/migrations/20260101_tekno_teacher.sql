-- =====================================================
-- TeknoÖğretmen - AI Özel Ders Asistanı
-- Veritabanı Şeması
-- =====================================================

-- 1. Çalışma Oturumları Tablosu
-- Öğrencinin soru çözme oturumlarını takip eder
CREATE TABLE IF NOT EXISTS tekno_teacher_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code VARCHAR(50), -- matematik, turkce, fen, etc.
  topic VARCHAR(255), -- Konu adı
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  score DECIMAL(5,2), -- Yüzde olarak başarı
  duration_seconds INTEGER, -- Oturum süresi
  wrong_question_ids UUID[], -- Yanlış yapılan soru ID'leri
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Zayıf Konu Matrisi
-- Öğrencinin hangi konularda zorlandığını takip eder
CREATE TABLE IF NOT EXISTS tekno_teacher_weaknesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code VARCHAR(50) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  sub_topic VARCHAR(255),
  wrong_count INTEGER DEFAULT 1,
  last_wrong_at TIMESTAMPTZ DEFAULT NOW(),
  improvement_score DECIMAL(5,2) DEFAULT 0, -- İlerleme puanı
  podcast_generated_at TIMESTAMPTZ, -- Son podcast ne zaman üretildi
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Aynı kullanıcı için aynı konu tekrar eklenmemeli
  UNIQUE(user_id, subject_code, topic, sub_topic)
);

-- 3. AI Geri Bildirim Logları
-- TeknoÖğretmen'in ürettiği sesli/yazılı yanıtları saklar
CREATE TABLE IF NOT EXISTS tekno_teacher_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES tekno_teacher_sessions(id) ON DELETE SET NULL,
  
  -- İçerik
  feedback_type VARCHAR(20) DEFAULT 'text', -- text, audio, video
  text_content TEXT, -- Yazılı geri bildirim
  audio_url TEXT, -- Ses dosyası URL'i (Supabase Storage)
  audio_duration_seconds INTEGER,
  
  -- Bağlam
  topic_context JSONB, -- Hangi konuyla ilgili: {subject, topic, questions: [...]}
  prompt_used TEXT, -- Gemini'ye gönderilen prompt
  
  -- Meta
  is_premium BOOLEAN DEFAULT FALSE,
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Kullanıcı AI Kredileri
-- Günlük kullanım limitlerini takip eder
CREATE TABLE IF NOT EXISTS tekno_teacher_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Kredi bilgileri
  daily_credits INTEGER DEFAULT 3, -- Günlük ücretsiz limit
  used_today INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  
  -- Premium
  is_premium BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMPTZ,
  
  -- Tarihler
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- İNDEXLER
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON tekno_teacher_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON tekno_teacher_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON tekno_teacher_sessions(subject_code);

CREATE INDEX IF NOT EXISTS idx_weaknesses_user_id ON tekno_teacher_weaknesses(user_id);
CREATE INDEX IF NOT EXISTS idx_weaknesses_topic ON tekno_teacher_weaknesses(subject_code, topic);
CREATE INDEX IF NOT EXISTS idx_weaknesses_wrong_count ON tekno_teacher_weaknesses(wrong_count DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON tekno_teacher_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON tekno_teacher_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credits_user_id ON tekno_teacher_credits(user_id);

-- =====================================================
-- RLS POLİTİKALARI
-- =====================================================

ALTER TABLE tekno_teacher_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tekno_teacher_weaknesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tekno_teacher_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE tekno_teacher_credits ENABLE ROW LEVEL SECURITY;

-- Sessions: Kullanıcı sadece kendi oturumlarını görebilir
CREATE POLICY "Users can view own sessions" ON tekno_teacher_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON tekno_teacher_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Weaknesses: Kullanıcı sadece kendi zayıf konularını görebilir
CREATE POLICY "Users can view own weaknesses" ON tekno_teacher_weaknesses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own weaknesses" ON tekno_teacher_weaknesses
  FOR ALL USING (auth.uid() = user_id);

-- Feedback: Kullanıcı sadece kendi geri bildirimlerini görebilir
CREATE POLICY "Users can view own feedback" ON tekno_teacher_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON tekno_teacher_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Credits: Kullanıcı sadece kendi kredilerini görebilir
CREATE POLICY "Users can view own credits" ON tekno_teacher_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON tekno_teacher_credits
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FONKSİYONLAR
-- =====================================================

-- Kredi kontrolü ve kullanımı
CREATE OR REPLACE FUNCTION check_and_use_ai_credit(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, is_premium BOOLEAN) AS $$
DECLARE
  v_credits tekno_teacher_credits%ROWTYPE;
BEGIN
  -- Kredi kaydını al veya oluştur
  INSERT INTO tekno_teacher_credits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO v_credits FROM tekno_teacher_credits WHERE user_id = p_user_id;
  
  -- Günlük reset kontrolü
  IF v_credits.last_reset_date < CURRENT_DATE THEN
    UPDATE tekno_teacher_credits 
    SET used_today = 0, last_reset_date = CURRENT_DATE, updated_at = NOW()
    WHERE user_id = p_user_id;
    v_credits.used_today := 0;
  END IF;
  
  -- Premium kullanıcılar sınırsız
  IF v_credits.is_premium AND (v_credits.premium_until IS NULL OR v_credits.premium_until > NOW()) THEN
    -- Krediyi kullan (takip için)
    UPDATE tekno_teacher_credits 
    SET used_today = used_today + 1, total_used = total_used + 1, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT TRUE, 999, TRUE;
    RETURN;
  END IF;
  
  -- Ücretsiz kullanıcı limit kontrolü
  IF v_credits.used_today >= v_credits.daily_credits THEN
    RETURN QUERY SELECT FALSE, 0, FALSE;
    RETURN;
  END IF;
  
  -- Krediyi kullan
  UPDATE tekno_teacher_credits 
  SET used_today = used_today + 1, total_used = total_used + 1, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT TRUE, (v_credits.daily_credits - v_credits.used_today - 1), FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Zayıf konu güncelleme
CREATE OR REPLACE FUNCTION update_weakness(
  p_user_id UUID,
  p_subject_code VARCHAR,
  p_topic VARCHAR,
  p_sub_topic VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO tekno_teacher_weaknesses (user_id, subject_code, topic, sub_topic, wrong_count, last_wrong_at)
  VALUES (p_user_id, p_subject_code, p_topic, p_sub_topic, 1, NOW())
  ON CONFLICT (user_id, subject_code, topic, sub_topic)
  DO UPDATE SET 
    wrong_count = tekno_teacher_weaknesses.wrong_count + 1,
    last_wrong_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Öğrencinin en zayıf konularını getir
CREATE OR REPLACE FUNCTION get_top_weaknesses(p_user_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE(
  subject_code VARCHAR,
  topic VARCHAR,
  sub_topic VARCHAR,
  wrong_count INTEGER,
  last_wrong_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.subject_code,
    w.topic,
    w.sub_topic,
    w.wrong_count,
    w.last_wrong_at
  FROM tekno_teacher_weaknesses w
  WHERE w.user_id = p_user_id
  ORDER BY w.wrong_count DESC, w.last_wrong_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STORAGE BUCKET (Ses dosyaları için)
-- =====================================================
-- Not: Bu Supabase Dashboard'dan veya ayrı bir script ile oluşturulmalı
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('tekno-teacher-audio', 'tekno-teacher-audio', true);
