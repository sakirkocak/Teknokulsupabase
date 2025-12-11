-- =====================================================
-- LGS SORU BANKASI VERİTABANI TABLOLARI
-- =====================================================

-- 1. LGS Konuları Tablosu
CREATE TABLE IF NOT EXISTS lgs_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL, -- Türkçe, Matematik, Fen Bilimleri, İnkılap Tarihi, Din Kültürü, İngilizce
    main_topic TEXT NOT NULL, -- Ana konu başlığı
    sub_topic TEXT, -- Alt konu (opsiyonel)
    avg_question_count INTEGER DEFAULT 1, -- LGS'de ortalama çıkan soru sayısı
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LGS Soruları Tablosu
CREATE TABLE IF NOT EXISTS lgs_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES lgs_topics(id) ON DELETE CASCADE,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),
    question_text TEXT NOT NULL, -- Soru metni
    question_image_url TEXT, -- Görsel URL (opsiyonel)
    options JSONB NOT NULL, -- {"A": "...", "B": "...", "C": "...", "D": "..."}
    correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT, -- Çözüm açıklaması
    source TEXT, -- Kaynak (örn: "2024 LGS", "MEB Kazanım Testi")
    year INTEGER, -- Yıl
    times_answered INTEGER DEFAULT 0, -- Kaç kez cevaplandı
    times_correct INTEGER DEFAULT 0, -- Kaç kez doğru cevaplandı
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LGS Deneme Sınavları Tablosu
CREATE TABLE IF NOT EXISTS lgs_mock_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    exam_type TEXT DEFAULT 'full' CHECK (exam_type IN ('full', 'subject', 'topic')), -- Tam deneme, ders bazlı, konu bazlı
    questions JSONB NOT NULL, -- Soru ID'leri listesi
    -- Ders bazlı netler
    turkce_correct INTEGER DEFAULT 0,
    turkce_wrong INTEGER DEFAULT 0,
    turkce_empty INTEGER DEFAULT 0,
    matematik_correct INTEGER DEFAULT 0,
    matematik_wrong INTEGER DEFAULT 0,
    matematik_empty INTEGER DEFAULT 0,
    fen_correct INTEGER DEFAULT 0,
    fen_wrong INTEGER DEFAULT 0,
    fen_empty INTEGER DEFAULT 0,
    inkilap_correct INTEGER DEFAULT 0,
    inkilap_wrong INTEGER DEFAULT 0,
    inkilap_empty INTEGER DEFAULT 0,
    din_correct INTEGER DEFAULT 0,
    din_wrong INTEGER DEFAULT 0,
    din_empty INTEGER DEFAULT 0,
    ingilizce_correct INTEGER DEFAULT 0,
    ingilizce_wrong INTEGER DEFAULT 0,
    ingilizce_empty INTEGER DEFAULT 0,
    -- Toplam
    total_correct INTEGER DEFAULT 0,
    total_wrong INTEGER DEFAULT 0,
    total_empty INTEGER DEFAULT 0,
    total_net DECIMAL(5,2) DEFAULT 0, -- Net = Doğru - (Yanlış/3)
    total_score DECIMAL(5,2) DEFAULT 0, -- Puan (0-100)
    -- Durum
    status TEXT DEFAULT 'created' CHECK (status IN ('created', 'in_progress', 'completed', 'abandoned')),
    time_limit_minutes INTEGER DEFAULT 135, -- 135 dakika
    time_spent_seconds INTEGER DEFAULT 0, -- Harcanan süre
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Deneme Cevapları Tablosu
CREATE TABLE IF NOT EXISTS mock_exam_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES lgs_mock_exams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES lgs_questions(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL, -- Soru sırası (1-90)
    student_answer TEXT CHECK (student_answer IN ('A', 'B', 'C', 'D', NULL)), -- NULL = boş
    is_correct BOOLEAN,
    time_spent_seconds INTEGER DEFAULT 0,
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, question_id)
);

-- 5. Öğrenci Soru Çözme İstatistikleri
CREATE TABLE IF NOT EXISTS student_question_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES lgs_topics(id) ON DELETE CASCADE,
    total_attempted INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_wrong INTEGER DEFAULT 0,
    last_attempted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, topic_id)
);

-- =====================================================
-- INDEXLER
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_lgs_topics_subject ON lgs_topics(subject);
CREATE INDEX IF NOT EXISTS idx_lgs_questions_topic ON lgs_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_lgs_questions_difficulty ON lgs_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_lgs_mock_exams_student ON lgs_mock_exams(student_id);
CREATE INDEX IF NOT EXISTS idx_mock_exam_answers_exam ON mock_exam_answers(exam_id);
CREATE INDEX IF NOT EXISTS idx_student_question_stats_student ON student_question_stats(student_id);

-- =====================================================
-- RLS POLİTİKALARI
-- =====================================================

-- lgs_topics - Herkes okuyabilir
ALTER TABLE lgs_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lgs_topics_select" ON lgs_topics;
CREATE POLICY "lgs_topics_select" ON lgs_topics FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "lgs_topics_insert" ON lgs_topics;
CREATE POLICY "lgs_topics_insert" ON lgs_topics FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "lgs_topics_update" ON lgs_topics;
CREATE POLICY "lgs_topics_update" ON lgs_topics FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "lgs_topics_delete" ON lgs_topics;
CREATE POLICY "lgs_topics_delete" ON lgs_topics FOR DELETE TO authenticated USING (true);

-- lgs_questions - Herkes okuyabilir, admin ekleyebilir
ALTER TABLE lgs_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lgs_questions_select" ON lgs_questions;
CREATE POLICY "lgs_questions_select" ON lgs_questions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "lgs_questions_insert" ON lgs_questions;
CREATE POLICY "lgs_questions_insert" ON lgs_questions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "lgs_questions_update" ON lgs_questions;
CREATE POLICY "lgs_questions_update" ON lgs_questions FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "lgs_questions_delete" ON lgs_questions;
CREATE POLICY "lgs_questions_delete" ON lgs_questions FOR DELETE TO authenticated USING (true);

-- lgs_mock_exams - Öğrenci kendi denemelerini görebilir
ALTER TABLE lgs_mock_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lgs_mock_exams_select" ON lgs_mock_exams;
CREATE POLICY "lgs_mock_exams_select" ON lgs_mock_exams FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "lgs_mock_exams_insert" ON lgs_mock_exams;
CREATE POLICY "lgs_mock_exams_insert" ON lgs_mock_exams FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "lgs_mock_exams_update" ON lgs_mock_exams;
CREATE POLICY "lgs_mock_exams_update" ON lgs_mock_exams FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "lgs_mock_exams_delete" ON lgs_mock_exams;
CREATE POLICY "lgs_mock_exams_delete" ON lgs_mock_exams FOR DELETE TO authenticated USING (true);

-- mock_exam_answers
ALTER TABLE mock_exam_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mock_exam_answers_select" ON mock_exam_answers;
CREATE POLICY "mock_exam_answers_select" ON mock_exam_answers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "mock_exam_answers_insert" ON mock_exam_answers;
CREATE POLICY "mock_exam_answers_insert" ON mock_exam_answers FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "mock_exam_answers_update" ON mock_exam_answers;
CREATE POLICY "mock_exam_answers_update" ON mock_exam_answers FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "mock_exam_answers_delete" ON mock_exam_answers;
CREATE POLICY "mock_exam_answers_delete" ON mock_exam_answers FOR DELETE TO authenticated USING (true);

-- student_question_stats
ALTER TABLE student_question_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_question_stats_select" ON student_question_stats;
CREATE POLICY "student_question_stats_select" ON student_question_stats FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "student_question_stats_insert" ON student_question_stats;
CREATE POLICY "student_question_stats_insert" ON student_question_stats FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "student_question_stats_update" ON student_question_stats;
CREATE POLICY "student_question_stats_update" ON student_question_stats FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "student_question_stats_delete" ON student_question_stats;
CREATE POLICY "student_question_stats_delete" ON student_question_stats FOR DELETE TO authenticated USING (true);

-- =====================================================
-- STORAGE BUCKET (Soru Görselleri)
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
DROP POLICY IF EXISTS "question_images_select" ON storage.objects;
CREATE POLICY "question_images_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'question-images');

DROP POLICY IF EXISTS "question_images_insert" ON storage.objects;
CREATE POLICY "question_images_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'question-images');

DROP POLICY IF EXISTS "question_images_delete" ON storage.objects;
CREATE POLICY "question_images_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'question-images');

