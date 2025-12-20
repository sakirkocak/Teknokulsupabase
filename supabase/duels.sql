-- =====================================================
-- DÜELLO SİSTEMİ - Öğrenciler Arası Yarışma
-- Bu SQL'i Supabase SQL Editor'da çalıştırın
-- =====================================================

-- 1. DUELS - Ana düello tablosu
CREATE TABLE IF NOT EXISTS duels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    opponent_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'expired')),
    subject_id UUID REFERENCES subjects(id),
    grade INTEGER,
    question_count INTEGER DEFAULT 5,
    time_per_question INTEGER DEFAULT 30, -- saniye
    challenger_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES student_profiles(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DUEL_QUESTIONS - Düelloda sorulan sorular
CREATE TABLE IF NOT EXISTS duel_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duel_id UUID NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DUEL_ANSWERS - Oyuncuların cevapları
CREATE TABLE IF NOT EXISTS duel_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duel_id UUID NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    selected_answer VARCHAR(1),
    is_correct BOOLEAN,
    answer_time INTEGER, -- milisaniye
    points_earned INTEGER DEFAULT 0,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(duel_id, question_id, student_id)
);

-- 4. DUEL_INVITATIONS - Düello davetleri (opsiyonel)
CREATE TABLE IF NOT EXISTS duel_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duel_id UUID NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
    from_student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    to_student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- =====================================================
-- INDEX'LER
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_duels_challenger ON duels(challenger_id);
CREATE INDEX IF NOT EXISTS idx_duels_opponent ON duels(opponent_id);
CREATE INDEX IF NOT EXISTS idx_duels_status ON duels(status);
CREATE INDEX IF NOT EXISTS idx_duels_created ON duels(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_duel_questions_duel ON duel_questions(duel_id);
CREATE INDEX IF NOT EXISTS idx_duel_answers_duel ON duel_answers(duel_id);
CREATE INDEX IF NOT EXISTS idx_duel_answers_student ON duel_answers(student_id);

CREATE INDEX IF NOT EXISTS idx_duel_invitations_to ON duel_invitations(to_student_id);
CREATE INDEX IF NOT EXISTS idx_duel_invitations_status ON duel_invitations(status);

-- =====================================================
-- RLS POLİTİKALARI
-- =====================================================

-- DUELS
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "duels_select" ON duels;
CREATE POLICY "duels_select" ON duels FOR SELECT USING (true);

DROP POLICY IF EXISTS "duels_insert" ON duels;
CREATE POLICY "duels_insert" ON duels FOR INSERT TO authenticated 
WITH CHECK (
    challenger_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "duels_update" ON duels;
CREATE POLICY "duels_update" ON duels FOR UPDATE USING (
    challenger_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    OR opponent_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
);

-- DUEL_QUESTIONS
ALTER TABLE duel_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "duel_questions_select" ON duel_questions;
CREATE POLICY "duel_questions_select" ON duel_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "duel_questions_insert" ON duel_questions;
CREATE POLICY "duel_questions_insert" ON duel_questions FOR INSERT TO authenticated WITH CHECK (true);

-- DUEL_ANSWERS
ALTER TABLE duel_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "duel_answers_select" ON duel_answers;
CREATE POLICY "duel_answers_select" ON duel_answers FOR SELECT USING (true);

DROP POLICY IF EXISTS "duel_answers_insert" ON duel_answers;
CREATE POLICY "duel_answers_insert" ON duel_answers FOR INSERT TO authenticated 
WITH CHECK (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "duel_answers_update" ON duel_answers;
CREATE POLICY "duel_answers_update" ON duel_answers FOR UPDATE USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
);

-- DUEL_INVITATIONS
ALTER TABLE duel_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "duel_invitations_select" ON duel_invitations;
CREATE POLICY "duel_invitations_select" ON duel_invitations FOR SELECT USING (
    from_student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    OR to_student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "duel_invitations_insert" ON duel_invitations;
CREATE POLICY "duel_invitations_insert" ON duel_invitations FOR INSERT TO authenticated 
WITH CHECK (
    from_student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "duel_invitations_update" ON duel_invitations;
CREATE POLICY "duel_invitations_update" ON duel_invitations FOR UPDATE USING (
    to_student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
);

-- =====================================================
-- GÜNCELLEME TETİKLEYİCİSİ
-- =====================================================

CREATE OR REPLACE FUNCTION update_duel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_duel_updated_at ON duels;
CREATE TRIGGER trigger_duel_updated_at
    BEFORE UPDATE ON duels
    FOR EACH ROW
    EXECUTE FUNCTION update_duel_updated_at();

-- =====================================================
-- TAMAMLANDI!
-- =====================================================

SELECT 'Düello tabloları başarıyla oluşturuldu!' as message;

-- Tablo kontrolü
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('duels', 'duel_questions', 'duel_answers', 'duel_invitations')
ORDER BY table_name;

