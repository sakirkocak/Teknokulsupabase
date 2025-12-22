-- =====================================================
-- GAMİFİCATİON TABLOLARI
-- XP, Rozetler, Günlük Görevler, Streak
-- =====================================================

-- user_badges tablosu (Kullanıcı rozetleri)
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, badge_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

-- RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_badges_select" ON user_badges;
CREATE POLICY "user_badges_select" ON user_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_badges_insert" ON user_badges;
CREATE POLICY "user_badges_insert" ON user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- challenge_progress tablosu (Görev ilerlemesi)
CREATE TABLE IF NOT EXISTS challenge_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL,
    current_progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, challenge_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user ON challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge ON challenge_progress(challenge_id);

-- RLS
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenge_progress_select" ON challenge_progress;
CREATE POLICY "challenge_progress_select" ON challenge_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "challenge_progress_insert" ON challenge_progress;
CREATE POLICY "challenge_progress_insert" ON challenge_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "challenge_progress_update" ON challenge_progress;
CREATE POLICY "challenge_progress_update" ON challenge_progress FOR UPDATE USING (auth.uid() = user_id);

-- xp_history tablosu (XP geçmişi)
CREATE TABLE IF NOT EXISTS xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    source_type TEXT NOT NULL, -- 'question_correct', 'question_wrong', 'badge_earned', 'streak_bonus', 'challenge_completed'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_xp_history_user ON xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_created ON xp_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_history_source ON xp_history(source_type);

-- RLS
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "xp_history_select" ON xp_history;
CREATE POLICY "xp_history_select" ON xp_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "xp_history_insert" ON xp_history;
CREATE POLICY "xp_history_insert" ON xp_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- student_points tablosuna total_xp ve level ekle (yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_points' AND column_name = 'total_xp') THEN
        ALTER TABLE student_points ADD COLUMN total_xp INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_points' AND column_name = 'level') THEN
        ALTER TABLE student_points ADD COLUMN level INTEGER DEFAULT 1;
    END IF;
END
$$;

-- Mevcut total_points'i total_xp'ye kopyala (eğer total_xp boşsa)
UPDATE student_points SET total_xp = total_points WHERE total_xp IS NULL OR total_xp = 0;

-- =====================================================
-- ÖRNEK ROZETLER (Opsiyonel - Client tarafında tanımlı)
-- =====================================================

-- Rozetler client tarafında tanımlı, veritabanında sadece
-- kullanıcının kazandığı rozetlerin ID'leri tutulur.
-- Bu sayede yeni rozet eklemek için veritabanı değişikliği gerekmez.

COMMENT ON TABLE user_badges IS 'Kullanıcıların kazandığı rozetler. badge_id client tarafındaki rozet tanımlarına referans verir.';
COMMENT ON TABLE challenge_progress IS 'Günlük görevlerdeki ilerleme. challenge_id client tarafındaki görev tanımlarına referans verir.';
COMMENT ON TABLE xp_history IS 'XP kazanım geçmişi. Tüm XP değişikliklerini takip eder.';

