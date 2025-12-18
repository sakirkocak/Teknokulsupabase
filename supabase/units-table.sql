-- =====================================================
-- ÜNİTELER TABLOSU
-- Sınıf ve ders bazlı üniteler için
-- =====================================================

-- 1. Üniteler tablosu oluştur
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12),
    unit_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject_id, grade, unit_number)
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_units_subject ON units(subject_id);
CREATE INDEX IF NOT EXISTS idx_units_grade ON units(grade);
CREATE INDEX IF NOT EXISTS idx_units_subject_grade ON units(subject_id, grade);

-- RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "units_select" ON units;
CREATE POLICY "units_select" ON units FOR SELECT USING (true);
DROP POLICY IF EXISTS "units_insert" ON units;
CREATE POLICY "units_insert" ON units FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "units_update" ON units;
CREATE POLICY "units_update" ON units FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "units_delete" ON units;
CREATE POLICY "units_delete" ON units FOR DELETE TO authenticated USING (true);

-- 2. Topics tablosuna unit_id foreign key ekle
ALTER TABLE topics ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_topics_unit ON topics(unit_id);

-- 3. Topics tablosuna learning_outcome alanı ekle (yoksa)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS learning_outcome TEXT;

-- 4. Ünite-Konu görünümü
CREATE OR REPLACE VIEW curriculum_view AS
SELECT 
    u.id as unit_id,
    u.name as unit_name,
    u.unit_number,
    u.description as unit_description,
    t.id as topic_id,
    t.main_topic,
    t.sub_topic,
    t.learning_outcome,
    t.grade,
    s.id as subject_id,
    s.name as subject_name,
    s.code as subject_code,
    s.icon as subject_icon,
    g.name as grade_name,
    g.level,
    g.exam_type
FROM units u
LEFT JOIN topics t ON t.unit_id = u.id
LEFT JOIN subjects s ON u.subject_id = s.id
LEFT JOIN grades g ON u.grade = g.id
ORDER BY u.grade, s.name, u.unit_number, t.main_topic;

-- 5. Sınıf bazlı müfredat özet görünümü
CREATE OR REPLACE VIEW curriculum_summary_view AS
SELECT 
    g.id as grade_id,
    g.name as grade_name,
    g.level,
    g.exam_type,
    s.id as subject_id,
    s.name as subject_name,
    s.code as subject_code,
    s.icon,
    COUNT(DISTINCT u.id) as unit_count,
    COUNT(DISTINCT t.id) as topic_count,
    COUNT(DISTINCT q.id) as question_count
FROM grades g
JOIN grade_subjects gs ON gs.grade_id = g.id
JOIN subjects s ON s.id = gs.subject_id
LEFT JOIN units u ON u.subject_id = s.id AND u.grade = g.id
LEFT JOIN topics t ON t.subject_id = s.id AND t.grade = g.id
LEFT JOIN questions q ON q.topic_id = t.id AND q.is_active = true
GROUP BY g.id, g.name, g.level, g.exam_type, s.id, s.name, s.code, s.icon
ORDER BY g.id, s.name;

COMMENT ON TABLE units IS 'Sınıf ve ders bazlı üniteler';
COMMENT ON VIEW curriculum_view IS 'Ünite-Konu-Kazanım detaylı görünümü';
COMMENT ON VIEW curriculum_summary_view IS 'Sınıf bazlı müfredat özeti';


