-- =====================================================
-- AI KOÇ SİSTEMİ - VERİTABANI TABLOLARI
-- =====================================================

-- 1. AI_COACH_CONVERSATIONS - Sohbet Geçmişi
CREATE TABLE IF NOT EXISTS ai_coach_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_ai_conversations_student ON ai_coach_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created ON ai_coach_conversations(created_at DESC);

-- RLS
ALTER TABLE ai_coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_conversations_select" ON ai_coach_conversations 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM student_profiles sp 
            WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

CREATE POLICY "ai_conversations_insert" ON ai_coach_conversations 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM student_profiles sp 
            WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

-- 2. AI_COACH_TASKS - AI Koç Görevleri
CREATE TABLE IF NOT EXISTS ai_coach_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject_code TEXT, -- matematik, turkce, fen, etc.
    target_count INTEGER NOT NULL DEFAULT 10,
    current_count INTEGER NOT NULL DEFAULT 0,
    target_accuracy INTEGER, -- Hedef doğruluk oranı (opsiyonel)
    xp_reward INTEGER NOT NULL DEFAULT 100,
    bonus_xp INTEGER DEFAULT 0, -- Bonus hedef için ekstra XP
    badge_reward TEXT, -- Rozet ID (opsiyonel)
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'failed')),
    expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_ai_tasks_student ON ai_coach_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_coach_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_expires ON ai_coach_tasks(expires_at);

-- RLS
ALTER TABLE ai_coach_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_tasks_select" ON ai_coach_tasks 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM student_profiles sp 
            WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

CREATE POLICY "ai_tasks_insert" ON ai_coach_tasks 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM student_profiles sp 
            WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

CREATE POLICY "ai_tasks_update" ON ai_coach_tasks 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM student_profiles sp 
            WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

-- 3. AI_COACH_STATS - AI Koç İstatistikleri
CREATE TABLE IF NOT EXISTS ai_coach_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE UNIQUE,
    total_chats INTEGER NOT NULL DEFAULT 0,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    tasks_failed INTEGER NOT NULL DEFAULT 0,
    total_xp_earned INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0, -- AI görev serisi
    max_streak INTEGER NOT NULL DEFAULT 0,
    last_interaction TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_ai_stats_student ON ai_coach_stats(student_id);

-- RLS
ALTER TABLE ai_coach_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_stats_select" ON ai_coach_stats 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM student_profiles sp 
            WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

CREATE POLICY "ai_stats_upsert" ON ai_coach_stats 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM student_profiles sp 
            WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

-- =====================================================
-- YARDIMCI FONKSİYONLAR
-- =====================================================

-- Öğrenci analizi için fonksiyon
CREATE OR REPLACE FUNCTION get_student_analysis(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_questions', COALESCE(sp.total_questions, 0),
        'total_correct', COALESCE(sp.total_correct, 0),
        'total_wrong', COALESCE(sp.total_wrong, 0),
        'accuracy', CASE 
            WHEN COALESCE(sp.total_questions, 0) > 0 
            THEN ROUND((COALESCE(sp.total_correct, 0)::DECIMAL / sp.total_questions) * 100)
            ELSE 0 
        END,
        'current_streak', COALESCE(sp.current_streak, 0),
        'max_streak', COALESCE(sp.max_streak, 0),
        'total_points', COALESCE(sp.total_points, 0),
        'subjects', json_build_object(
            'matematik', json_build_object('correct', COALESCE(sp.matematik_correct, 0), 'wrong', COALESCE(sp.matematik_wrong, 0)),
            'turkce', json_build_object('correct', COALESCE(sp.turkce_correct, 0), 'wrong', COALESCE(sp.turkce_wrong, 0)),
            'fen', json_build_object('correct', COALESCE(sp.fen_correct, 0), 'wrong', COALESCE(sp.fen_wrong, 0)),
            'sosyal', json_build_object('correct', COALESCE(sp.sosyal_correct, 0), 'wrong', COALESCE(sp.sosyal_wrong, 0)),
            'ingilizce', json_build_object('correct', COALESCE(sp.ingilizce_correct, 0), 'wrong', COALESCE(sp.ingilizce_wrong, 0))
        )
    ) INTO result
    FROM student_points sp
    WHERE sp.student_id = p_student_id;
    
    RETURN COALESCE(result, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Son 7 günlük aktivite
CREATE OR REPLACE FUNCTION get_weekly_activity(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_questions', COUNT(*),
        'correct_count', COUNT(*) FILTER (WHERE is_correct = true),
        'wrong_count', COUNT(*) FILTER (WHERE is_correct = false),
        'by_subject', (
            SELECT json_object_agg(subject_code, cnt)
            FROM (
                SELECT subject_code, COUNT(*) as cnt
                FROM point_history
                WHERE student_id = p_student_id 
                  AND created_at >= NOW() - INTERVAL '7 days'
                  AND source = 'question'
                  AND subject_code IS NOT NULL
                GROUP BY subject_code
            ) subq
        ),
        'by_day', (
            SELECT json_agg(day_data ORDER BY day)
            FROM (
                SELECT 
                    DATE(created_at) as day,
                    COUNT(*) as questions,
                    COUNT(*) FILTER (WHERE is_correct = true) as correct
                FROM point_history
                WHERE student_id = p_student_id 
                  AND created_at >= NOW() - INTERVAL '7 days'
                  AND source = 'question'
                GROUP BY DATE(created_at)
            ) day_data
        )
    ) INTO result
    FROM point_history
    WHERE student_id = p_student_id 
      AND created_at >= NOW() - INTERVAL '7 days'
      AND source = 'question';
    
    RETURN COALESCE(result, '{"total_questions": 0, "correct_count": 0, "wrong_count": 0}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonksiyon yetkileri
GRANT EXECUTE ON FUNCTION get_student_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_activity TO authenticated;

