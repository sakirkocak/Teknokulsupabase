-- =====================================================
-- SINIF VE DERS SİSTEMİ ALTYAPISI
-- 1-12. Sınıf Tüm Dersler
-- =====================================================

-- =====================================================
-- 1. SINIFLAR TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('ilkokul', 'ortaokul', 'lise')),
    exam_type TEXT, -- NULL, 'LGS', 'TYT', 'AYT'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grades_select" ON grades;
CREATE POLICY "grades_select" ON grades FOR SELECT USING (true);

-- Sınıfları ekle
INSERT INTO grades (id, name, level, exam_type) VALUES
(1, '1. Sınıf', 'ilkokul', NULL),
(2, '2. Sınıf', 'ilkokul', NULL),
(3, '3. Sınıf', 'ilkokul', NULL),
(4, '4. Sınıf', 'ilkokul', NULL),
(5, '5. Sınıf', 'ortaokul', NULL),
(6, '6. Sınıf', 'ortaokul', NULL),
(7, '7. Sınıf', 'ortaokul', NULL),
(8, '8. Sınıf', 'ortaokul', 'LGS'),
(9, '9. Sınıf', 'lise', NULL),
(10, '10. Sınıf', 'lise', NULL),
(11, '11. Sınıf', 'lise', 'TYT'),
(12, '12. Sınıf', 'lise', 'TYT-AYT')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. DERSLER TABLOSU (Mevcut tabloyu güncelle)
-- =====================================================

-- Mevcut subjects tablosuna yeni kolonlar ekle
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS color TEXT;

-- code kolonunu slug'dan doldur (varsa)
UPDATE subjects SET code = slug WHERE code IS NULL AND slug IS NOT NULL;

-- Unique constraint ekle (code için)
CREATE UNIQUE INDEX IF NOT EXISTS subjects_code_idx ON subjects(code);

-- RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subjects_select_all" ON subjects;
CREATE POLICY "subjects_select_all" ON subjects FOR SELECT USING (true);

-- Dersleri ekle (slug = code olarak)
INSERT INTO subjects (name, slug, code, icon, color, category) VALUES
-- Temel Dersler
('Türkçe', 'turkce', 'turkce', '📖', 'blue', 'temel'),
('Matematik', 'matematik', 'matematik', '🔢', 'red', 'temel'),
('Türk Dili ve Edebiyatı', 'edebiyat', 'edebiyat', '📚', 'indigo', 'temel'),

-- Fen Dersleri
('Hayat Bilgisi', 'hayat_bilgisi', 'hayat_bilgisi', '🌱', 'green', 'fen'),
('Fen Bilimleri', 'fen_bilimleri', 'fen_bilimleri', '🔬', 'emerald', 'fen'),
('Fizik', 'fizik', 'fizik', '⚛️', 'cyan', 'fen'),
('Kimya', 'kimya', 'kimya', '🧪', 'purple', 'fen'),
('Biyoloji', 'biyoloji', 'biyoloji', '🧬', 'lime', 'fen'),

-- Sosyal Dersler
('Sosyal Bilgiler', 'sosyal_bilgiler', 'sosyal_bilgiler', '🌍', 'amber', 'sosyal'),
('T.C. İnkılap Tarihi ve Atatürkçülük', 'inkilap_tarihi', 'inkilap_tarihi', '🏛️', 'orange', 'sosyal'),
('Tarih', 'tarih', 'tarih', '📜', 'yellow', 'sosyal'),
('Coğrafya', 'cografya', 'cografya', '🗺️', 'teal', 'sosyal'),
('Felsefe', 'felsefe', 'felsefe', '💭', 'violet', 'sosyal'),
('Din Kültürü ve Ahlak Bilgisi', 'din_kulturu', 'din_kulturu', '☪️', 'slate', 'sosyal'),

-- Yabancı Dil
('İngilizce', 'ingilizce', 'ingilizce', '🇬🇧', 'sky', 'temel'),

-- Sanat Dersleri
('Görsel Sanatlar', 'gorsel_sanatlar', 'gorsel_sanatlar', '🎨', 'pink', 'sanat'),
('Müzik', 'muzik', 'muzik', '🎵', 'rose', 'sanat'),

-- Diğer Dersler
('Beden Eğitimi ve Spor', 'beden_egitimi', 'beden_egitimi', '⚽', 'green', 'diger'),
('Bilişim Teknolojileri', 'bilisim', 'bilisim', '💻', 'blue', 'diger'),
('Teknoloji ve Tasarım', 'teknoloji_tasarim', 'teknoloji_tasarim', '🔧', 'gray', 'diger'),
('Trafik Güvenliği', 'trafik', 'trafik', '🚦', 'red', 'diger'),
('Sağlık Bilgisi', 'saglik', 'saglik', '🏥', 'red', 'diger'),
('Mantık', 'mantik', 'mantik', '🧠', 'purple', 'sosyal'),
('Psikoloji', 'psikoloji', 'psikoloji', '🧠', 'pink', 'sosyal'),
('Sosyoloji', 'sosyoloji', 'sosyoloji', '👥', 'orange', 'sosyal')
ON CONFLICT (slug) DO UPDATE SET
    code = EXCLUDED.code,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    category = EXCLUDED.category;

-- =====================================================
-- 3. SINIF-DERS İLİŞKİ TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS grade_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_id INTEGER REFERENCES grades(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    is_exam_subject BOOLEAN DEFAULT false,
    weekly_hours INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(grade_id, subject_id)
);

-- RLS
ALTER TABLE grade_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grade_subjects_select" ON grade_subjects;
CREATE POLICY "grade_subjects_select" ON grade_subjects FOR SELECT USING (true);

-- =====================================================
-- 4. KONULAR TABLOSU (Sınıf Bazlı)
-- =====================================================
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12),
    unit_number INTEGER,
    main_topic TEXT NOT NULL,
    sub_topic TEXT,
    learning_outcome TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_grade ON topics(grade);
CREATE INDEX IF NOT EXISTS idx_topics_subject_grade ON topics(subject_id, grade);

-- RLS
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "topics_select" ON topics;
CREATE POLICY "topics_select" ON topics FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "topics_insert" ON topics;
CREATE POLICY "topics_insert" ON topics FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "topics_update" ON topics;
CREATE POLICY "topics_update" ON topics FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "topics_delete" ON topics;
CREATE POLICY "topics_delete" ON topics FOR DELETE TO authenticated USING (true);

-- =====================================================
-- 5. SORULAR TABLOSU (Yeni Yapı)
-- =====================================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),
    question_text TEXT NOT NULL,
    question_image_url TEXT,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    source TEXT,
    year INTEGER,
    times_answered INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);

-- RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "questions_select" ON questions;
CREATE POLICY "questions_select" ON questions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "questions_insert" ON questions;
CREATE POLICY "questions_insert" ON questions FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "questions_update" ON questions;
CREATE POLICY "questions_update" ON questions FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "questions_delete" ON questions;
CREATE POLICY "questions_delete" ON questions FOR DELETE TO authenticated USING (true);

-- =====================================================
-- 6. SINIF-DERS İLİŞKİLERİNİ EKLE
-- =====================================================

-- İLKOKUL (1-4. Sınıf)

-- 1. Sınıf
INSERT INTO grade_subjects (grade_id, subject_id, is_exam_subject, weekly_hours)
SELECT 1, id, false, CASE code
    WHEN 'turkce' THEN 10
    WHEN 'matematik' THEN 5
    WHEN 'hayat_bilgisi' THEN 4
    WHEN 'gorsel_sanatlar' THEN 1
    WHEN 'muzik' THEN 1
    WHEN 'beden_egitimi' THEN 5
    ELSE 0
END
FROM subjects WHERE code IN ('turkce', 'matematik', 'hayat_bilgisi', 'gorsel_sanatlar', 'muzik', 'beden_egitimi')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- 2. Sınıf
INSERT INTO grade_subjects (grade_id, subject_id, is_exam_subject, weekly_hours)
SELECT 2, id, false, CASE code
    WHEN 'turkce' THEN 10
    WHEN 'matematik' THEN 5
    WHEN 'hayat_bilgisi' THEN 4
    WHEN 'ingilizce' THEN 2
    WHEN 'gorsel_sanatlar' THEN 1
    WHEN 'muzik' THEN 1
    WHEN 'beden_egitimi' THEN 5
    ELSE 0
END
FROM subjects WHERE code IN ('turkce', 'matematik', 'hayat_bilgisi', 'ingilizce', 'gorsel_sanatlar', 'muzik', 'beden_egitimi')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- 3. Sınıf
INSERT INTO grade_subjects (grade_id, subject_id, is_exam_subject, weekly_hours)
SELECT 3, id, false, CASE code
    WHEN 'turkce' THEN 8
    WHEN 'matematik' THEN 5
    WHEN 'hayat_bilgisi' THEN 3
    WHEN 'fen_bilimleri' THEN 3
    WHEN 'ingilizce' THEN 2
    WHEN 'gorsel_sanatlar' THEN 1
    WHEN 'muzik' THEN 1
    WHEN 'beden_egitimi' THEN 5
    ELSE 0
END
FROM subjects WHERE code IN ('turkce', 'matematik', 'hayat_bilgisi', 'fen_bilimleri', 'ingilizce', 'gorsel_sanatlar', 'muzik', 'beden_egitimi')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- 4. Sınıf
INSERT INTO grade_subjects (grade_id, subject_id, is_exam_subject, weekly_hours)
SELECT 4, id, false, CASE code
    WHEN 'turkce' THEN 8
    WHEN 'matematik' THEN 5
    WHEN 'fen_bilimleri' THEN 3
    WHEN 'sosyal_bilgiler' THEN 3
    WHEN 'ingilizce' THEN 2
    WHEN 'din_kulturu' THEN 2
    WHEN 'gorsel_sanatlar' THEN 1
    WHEN 'muzik' THEN 1
    WHEN 'beden_egitimi' THEN 2
    WHEN 'trafik' THEN 1
    ELSE 0
END
FROM subjects WHERE code IN ('turkce', 'matematik', 'fen_bilimleri', 'sosyal_bilgiler', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'trafik')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- ORTAOKUL (5-8. Sınıf)

-- 5. Sınıf
INSERT INTO grade_subjects (grade_id, subject_id, is_exam_subject, weekly_hours)
SELECT 5, id, false, CASE code
    WHEN 'turkce' THEN 6
    WHEN 'matematik' THEN 5
    WHEN 'fen_bilimleri' THEN 4
    WHEN 'sosyal_bilgiler' THEN 3
    WHEN 'ingilizce' THEN 3
    WHEN 'din_kulturu' THEN 2
    WHEN 'gorsel_sanatlar' THEN 1
    WHEN 'muzik' THEN 1
    WHEN 'beden_egitimi' THEN 2
    WHEN 'bilisim' THEN 2
    ELSE 0
END
FROM subjects WHERE code IN ('turkce', 'matematik', 'fen_bilimleri', 'sosyal_bilgiler', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'bilisim')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- 6. Sınıf
INSERT INTO grade_subjects (grade_id, subject_id, is_exam_subject, weekly_hours)
SELECT 6, id, false, CASE code
    WHEN 'turkce' THEN 6
    WHEN 'matematik' THEN 5
    WHEN 'fen_bilimleri' THEN 4
    WHEN 'sosyal_bilgiler' THEN 3
    WHEN 'ingilizce' THEN 3
    WHEN 'din_kulturu' THEN 2
    WHEN 'gorsel_sanatlar' THEN 1
    WHEN 'muzik' THEN 1
    WHEN 'beden_egitimi' THEN 2
    WHEN 'bilisim' THEN 2
    ELSE 0
END
FROM subjects WHERE code IN ('turkce', 'matematik', 'fen_bilimleri', 'sosyal_bilgiler', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'bilisim')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- 7. Sınıf
INSERT INTO grade_subjects (grade_id, subject_id, is_exam_subject, weekly_hours)
SELECT 7, id, false, CASE code
    WHEN 'turkce' THEN 5
    WHEN 'matematik' THEN 5
    WHEN 'fen_bilimleri' THEN 4
    WHEN 'sosyal_bilgiler' THEN 3
    WHEN 'ingilizce' THEN 4
    WHEN 'din_kulturu' THEN 2
    WHEN 'gorsel_sanatlar' THEN 1
    WHEN 'muzik' THEN 1
    WHEN 'beden_egitimi' THEN 2
    WHEN 'teknoloji_tasarim' THEN 2
    ELSE 0
END
FROM subjects WHERE code IN ('turkce', 'matematik', 'fen_bilimleri', 'sosyal_bilgiler', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'teknoloji_tasarim')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- 8. Sınıf (LGS)
INSERT INTO grade_subjects (grade_id, subject_id, is_exam_subject, weekly_hours)
SELECT 8, id, 
    CASE WHEN code IN ('turkce', 'matematik', 'fen_bilimleri', 'inkilap_tarihi', 'din_kulturu', 'ingilizce') THEN true ELSE false END,
    CASE code
        WHEN 'turkce' THEN 5
        WHEN 'matematik' THEN 5
        WHEN 'fen_bilimleri' THEN 4
        WHEN 'inkilap_tarihi' THEN 2
        WHEN 'ingilizce' THEN 4
        WHEN 'din_kulturu' THEN 2
        WHEN 'gorsel_sanatlar' THEN 1
        WHEN 'muzik' THEN 1
        WHEN 'beden_egitimi' THEN 2
        WHEN 'teknoloji_tasarim' THEN 2
        ELSE 0
    END
FROM subjects WHERE code IN ('turkce', 'matematik', 'fen_bilimleri', 'inkilap_tarihi', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'teknoloji_tasarim')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- LİSE (9-12. Sınıf)

-- 9. Sınıf
INSERT INTO grade_subjects (grade_id, subject_id, is_exam_subject, weekly_hours)
SELECT 9, id, false, CASE code
    WHEN 'edebiyat' THEN 5
    WHEN 'matematik' THEN 6
    WHEN 'fizik' THEN 2
    WHEN 'kimya' THEN 2
    WHEN 'biyoloji' THEN 2
    WHEN 'tarih' THEN 2
    WHEN 'cografya' THEN 2
    WHEN 'din_kulturu' THEN 2
    WHEN 'ingilizce' THEN 4
    WHEN 'gorsel_sanatlar' THEN 1
    WHEN 'muzik' THEN 1
    WHEN 'beden_egitimi' THEN 2
    WHEN 'saglik' THEN 1
    ELSE 0
END
FROM subjects WHERE code IN ('edebiyat', 'matematik', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'din_kulturu', 'ingilizce', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'saglik')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- 10. Sınıf
INSERT INTO grade_subjects (grade_id, subject_id, is_exam_subject, weekly_hours)
SELECT 10, id, false, CASE code
    WHEN 'edebiyat' THEN 5
    WHEN 'matematik' THEN 6
    WHEN 'fizik' THEN 2
    WHEN 'kimya' THEN 2
    WHEN 'biyoloji' THEN 2
    WHEN 'tarih' THEN 2
    WHEN 'cografya' THEN 2
    WHEN 'felsefe' THEN 2
    WHEN 'din_kulturu' THEN 2
    WHEN 'ingilizce' THEN 4
    WHEN 'gorsel_sanatlar' THEN 1
    WHEN 'muzik' THEN 1
    WHEN 'beden_egitimi' THEN 2
    WHEN 'mantik' THEN 2
    ELSE 0
END
FROM subjects WHERE code IN ('edebiyat', 'matematik', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'felsefe', 'din_kulturu', 'ingilizce', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'mantik')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- 11. Sınıf (TYT)
INSERT INTO grade_subjects (grade_id, subject_id, is_exam_subject, weekly_hours)
SELECT 11, id, 
    CASE WHEN code IN ('edebiyat', 'matematik', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'felsefe', 'din_kulturu') THEN true ELSE false END,
    CASE code
        WHEN 'edebiyat' THEN 5
        WHEN 'matematik' THEN 6
        WHEN 'fizik' THEN 4
        WHEN 'kimya' THEN 4
        WHEN 'biyoloji' THEN 4
        WHEN 'tarih' THEN 4
        WHEN 'cografya' THEN 4
        WHEN 'felsefe' THEN 2
        WHEN 'din_kulturu' THEN 2
        WHEN 'ingilizce' THEN 4
        WHEN 'beden_egitimi' THEN 2
        WHEN 'psikoloji' THEN 2
        WHEN 'sosyoloji' THEN 2
        ELSE 0
    END
FROM subjects WHERE code IN ('edebiyat', 'matematik', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'felsefe', 'din_kulturu', 'ingilizce', 'beden_egitimi', 'psikoloji', 'sosyoloji')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- 12. Sınıf (TYT-AYT)
INSERT INTO grade_subjects (grade_id, subject_id, is_exam_subject, weekly_hours)
SELECT 12, id, true, CASE code
    WHEN 'edebiyat' THEN 5
    WHEN 'matematik' THEN 6
    WHEN 'fizik' THEN 4
    WHEN 'kimya' THEN 4
    WHEN 'biyoloji' THEN 4
    WHEN 'tarih' THEN 4
    WHEN 'cografya' THEN 4
    WHEN 'felsefe' THEN 2
    WHEN 'din_kulturu' THEN 2
    WHEN 'ingilizce' THEN 4
    WHEN 'beden_egitimi' THEN 2
    ELSE 0
END
FROM subjects WHERE code IN ('edebiyat', 'matematik', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'felsefe', 'din_kulturu', 'ingilizce', 'beden_egitimi')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- =====================================================
-- 7. GÖRÜNÜMLER (Views)
-- =====================================================

-- Sınıf bazlı ders listesi görünümü
CREATE OR REPLACE VIEW grade_subjects_view AS
SELECT 
    gs.id,
    gs.grade_id,
    g.name as grade_name,
    g.level,
    g.exam_type,
    gs.subject_id,
    s.name as subject_name,
    s.code as subject_code,
    s.icon,
    s.color,
    s.category,
    gs.is_exam_subject,
    gs.weekly_hours
FROM grade_subjects gs
JOIN grades g ON g.id = gs.grade_id
JOIN subjects s ON s.id = gs.subject_id
ORDER BY gs.grade_id, s.name;

-- Konu ve soru sayıları görünümü
CREATE OR REPLACE VIEW subject_stats_view AS
SELECT 
    s.id as subject_id,
    s.name as subject_name,
    s.code,
    t.grade,
    COUNT(DISTINCT t.id) as topic_count,
    COUNT(DISTINCT q.id) as question_count
FROM subjects s
LEFT JOIN topics t ON t.subject_id = s.id
LEFT JOIN questions q ON q.topic_id = t.id AND q.is_active = true
GROUP BY s.id, s.name, s.code, t.grade;

-- =====================================================
-- 8. ÖĞRENCİ PROFİLİNE SINIF ALANI EKLE
-- =====================================================
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS grade INTEGER CHECK (grade BETWEEN 1 AND 12);
CREATE INDEX IF NOT EXISTS idx_student_profiles_grade ON student_profiles(grade);

-- =====================================================
-- 9. MEVCUT LGS VERİLERİNİ YENİ YAPIYA TAŞI
-- =====================================================

-- lgs_topics'tan topics'a veri taşı (8. sınıf olarak)
INSERT INTO topics (subject_id, grade, main_topic, sub_topic, is_active)
SELECT 
    s.id,
    8,
    lt.main_topic,
    lt.sub_topic,
    lt.is_active
FROM lgs_topics lt
JOIN subjects s ON (
    CASE lt.subject
        WHEN 'Türkçe' THEN 'turkce'
        WHEN 'Matematik' THEN 'matematik'
        WHEN 'Fen Bilimleri' THEN 'fen_bilimleri'
        WHEN 'İnkılap Tarihi' THEN 'inkilap_tarihi'
        WHEN 'Din Kültürü' THEN 'din_kulturu'
        WHEN 'İngilizce' THEN 'ingilizce'
    END = s.code
)
WHERE NOT EXISTS (
    SELECT 1 FROM topics t 
    WHERE t.subject_id = s.id 
    AND t.grade = 8 
    AND t.main_topic = lt.main_topic
);

-- lgs_questions'tan questions'a veri taşı
INSERT INTO questions (topic_id, difficulty, question_text, question_image_url, options, correct_answer, explanation, source, year, times_answered, times_correct, is_active, created_by, created_at)
SELECT 
    t.id,
    lq.difficulty,
    lq.question_text,
    lq.question_image_url,
    lq.options,
    lq.correct_answer,
    lq.explanation,
    lq.source,
    lq.year,
    lq.times_answered,
    lq.times_correct,
    lq.is_active,
    lq.created_by,
    lq.created_at
FROM lgs_questions lq
JOIN lgs_topics lt ON lt.id = lq.topic_id
JOIN subjects s ON (
    CASE lt.subject
        WHEN 'Türkçe' THEN 'turkce'
        WHEN 'Matematik' THEN 'matematik'
        WHEN 'Fen Bilimleri' THEN 'fen_bilimleri'
        WHEN 'İnkılap Tarihi' THEN 'inkilap_tarihi'
        WHEN 'Din Kültürü' THEN 'din_kulturu'
        WHEN 'İngilizce' THEN 'ingilizce'
    END = s.code
)
JOIN topics t ON (t.subject_id = s.id AND t.grade = 8 AND t.main_topic = lt.main_topic)
WHERE NOT EXISTS (
    SELECT 1 FROM questions q WHERE q.question_text = lq.question_text
);

-- =====================================================
-- KONTROL SORGUSU
-- =====================================================
-- SELECT * FROM grade_subjects_view WHERE grade_id = 8; -- 8. sınıf LGS dersleri
-- SELECT * FROM grades;
-- SELECT * FROM subjects;
-- SELECT COUNT(*) FROM topics WHERE grade = 8;
-- SELECT COUNT(*) FROM questions;
