-- =====================================================
-- TEKNOKUL GAMİFİCATİON SİSTEMİ - KOMPLE KURULUM
-- Bu dosyayı Supabase SQL Editor'da çalıştırın
-- =====================================================

-- =====================================================
-- 1. USER_BADGES - Kullanıcı Rozetleri
-- =====================================================

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, badge_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

-- RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_badges_select" ON user_badges;
CREATE POLICY "user_badges_select" ON user_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_badges_insert" ON user_badges;
CREATE POLICY "user_badges_insert" ON user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_badges_delete" ON user_badges;
CREATE POLICY "user_badges_delete" ON user_badges FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 2. CHALLENGE_PROGRESS - Günlük Görev İlerlemesi
-- =====================================================

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

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user ON challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge ON challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_completed ON challenge_progress(is_completed);

-- RLS
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenge_progress_select" ON challenge_progress;
CREATE POLICY "challenge_progress_select" ON challenge_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "challenge_progress_insert" ON challenge_progress;
CREATE POLICY "challenge_progress_insert" ON challenge_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "challenge_progress_update" ON challenge_progress;
CREATE POLICY "challenge_progress_update" ON challenge_progress FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "challenge_progress_upsert" ON challenge_progress;
CREATE POLICY "challenge_progress_upsert" ON challenge_progress FOR ALL TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- 3. XP_HISTORY - XP Kazanım Geçmişi
-- =====================================================

CREATE TABLE IF NOT EXISTS xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    source_type TEXT NOT NULL, -- 'question_correct', 'question_wrong', 'badge_earned', 'streak_bonus', 'challenge_completed'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_xp_history_user ON xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_created ON xp_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_history_source ON xp_history(source_type);

-- RLS
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "xp_history_select" ON xp_history;
CREATE POLICY "xp_history_select" ON xp_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "xp_history_insert" ON xp_history;
CREATE POLICY "xp_history_insert" ON xp_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. STUDENT_POINTS GÜNCELLEME
-- total_xp ve level kolonları ekle
-- =====================================================

DO $$
BEGIN
    -- total_xp kolonu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_points' AND column_name = 'total_xp') THEN
        ALTER TABLE student_points ADD COLUMN total_xp INTEGER DEFAULT 0;
    END IF;
    
    -- level kolonu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_points' AND column_name = 'level') THEN
        ALTER TABLE student_points ADD COLUMN level INTEGER DEFAULT 1;
    END IF;
    
    -- daily_xp kolonu (günlük kazanılan XP)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_points' AND column_name = 'daily_xp') THEN
        ALTER TABLE student_points ADD COLUMN daily_xp INTEGER DEFAULT 0;
    END IF;
    
    -- last_daily_reset kolonu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_points' AND column_name = 'last_daily_reset') THEN
        ALTER TABLE student_points ADD COLUMN last_daily_reset DATE DEFAULT CURRENT_DATE;
    END IF;
END
$$;

-- Mevcut total_points'i total_xp'ye kopyala (eğer total_xp boşsa)
UPDATE student_points 
SET total_xp = COALESCE(total_points, 0) 
WHERE total_xp IS NULL OR total_xp = 0;

-- =====================================================
-- 5. WEEKLY_CHALLENGES - Haftalık Yarışmalar (Opsiyonel)
-- =====================================================

CREATE TABLE IF NOT EXISTS weekly_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    challenge_type TEXT NOT NULL, -- 'school', 'city', 'turkey'
    target_school_id UUID REFERENCES schools(id),
    target_city_id UUID REFERENCES turkey_cities(id),
    prize_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES weekly_challenges(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    points_earned INTEGER DEFAULT 0,
    questions_solved INTEGER DEFAULT 0,
    rank INTEGER,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(challenge_id, student_id)
);

-- RLS
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "weekly_challenges_select" ON weekly_challenges;
CREATE POLICY "weekly_challenges_select" ON weekly_challenges FOR SELECT USING (true);

ALTER TABLE weekly_challenge_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "weekly_challenge_participants_select" ON weekly_challenge_participants;
CREATE POLICY "weekly_challenge_participants_select" ON weekly_challenge_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "weekly_challenge_participants_insert" ON weekly_challenge_participants;
CREATE POLICY "weekly_challenge_participants_insert" ON weekly_challenge_participants FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()));

DROP POLICY IF EXISTS "weekly_challenge_participants_update" ON weekly_challenge_participants;
CREATE POLICY "weekly_challenge_participants_update" ON weekly_challenge_participants FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()));

-- =====================================================
-- 6. ACHIEVEMENT_NOTIFICATIONS - Başarım Bildirimleri
-- =====================================================

CREATE TABLE IF NOT EXISTS achievement_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL, -- 'badge', 'level_up', 'streak', 'challenge_complete', 'rank_up'
    achievement_data JSONB, -- Rozet bilgisi, seviye bilgisi vb.
    is_seen BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_achievement_notifications_user ON achievement_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_notifications_seen ON achievement_notifications(is_seen);

-- RLS
ALTER TABLE achievement_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "achievement_notifications_select" ON achievement_notifications;
CREATE POLICY "achievement_notifications_select" ON achievement_notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "achievement_notifications_insert" ON achievement_notifications;
CREATE POLICY "achievement_notifications_insert" ON achievement_notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "achievement_notifications_update" ON achievement_notifications;
CREATE POLICY "achievement_notifications_update" ON achievement_notifications FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 7. GÜNLÜK XP SIFIRLAMA FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION reset_daily_xp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE student_points
    SET daily_xp = 0, last_daily_reset = CURRENT_DATE
    WHERE last_daily_reset < CURRENT_DATE OR last_daily_reset IS NULL;
END;
$$;

-- =====================================================
-- 8. XP EKLEME FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION add_xp(
    p_user_id UUID,
    p_amount INTEGER,
    p_source TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_new_total_xp INTEGER;
    v_new_level INTEGER;
BEGIN
    -- Student ID'yi bul
    SELECT id INTO v_student_id
    FROM student_profiles
    WHERE user_id = p_user_id;
    
    IF v_student_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- XP güncelle
    UPDATE student_points
    SET 
        total_xp = COALESCE(total_xp, 0) + p_amount,
        total_points = COALESCE(total_points, 0) + p_amount,
        daily_xp = COALESCE(daily_xp, 0) + p_amount,
        updated_at = NOW()
    WHERE student_id = v_student_id
    RETURNING total_xp INTO v_new_total_xp;
    
    -- Seviye hesapla (basit formül)
    v_new_level := GREATEST(1, FLOOR(SQRT(v_new_total_xp / 100)) + 1);
    
    -- Seviyeyi güncelle
    UPDATE student_points
    SET level = v_new_level
    WHERE student_id = v_student_id;
    
    -- XP geçmişine kaydet
    INSERT INTO xp_history (user_id, xp_amount, source_type, description)
    VALUES (p_user_id, p_amount, p_source, COALESCE(p_description, p_source));
    
    RETURN v_new_total_xp;
END;
$$;

-- =====================================================
-- 9. ROZET KONTROL VE ÖDÜLLEME FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION check_and_award_badge(
    p_user_id UUID,
    p_badge_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Zaten kazanılmış mı kontrol et
    IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id) THEN
        RETURN FALSE;
    END IF;
    
    -- Rozeti ver
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, p_badge_id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    
    -- Başarım bildirimi oluştur
    INSERT INTO achievement_notifications (user_id, achievement_type, achievement_data)
    VALUES (p_user_id, 'badge', jsonb_build_object('badge_id', p_badge_id));
    
    RETURN TRUE;
END;
$$;

-- =====================================================
-- 10. STREAK GÜNCELLEME FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION update_streak(p_student_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_last_activity TIMESTAMPTZ;
    v_current_streak INTEGER;
    v_max_streak INTEGER;
    v_new_streak INTEGER;
BEGIN
    -- Mevcut değerleri al
    SELECT last_activity_at, current_streak, max_streak
    INTO v_last_activity, v_current_streak, v_max_streak
    FROM student_points
    WHERE student_id = p_student_id;
    
    -- Streak hesapla
    IF v_last_activity IS NULL THEN
        v_new_streak := 1;
    ELSIF DATE(v_last_activity) = CURRENT_DATE THEN
        -- Bugün zaten aktif, streak'i değiştirme
        v_new_streak := v_current_streak;
    ELSIF DATE(v_last_activity) = CURRENT_DATE - INTERVAL '1 day' THEN
        -- Dün aktifti, streak'i artır
        v_new_streak := COALESCE(v_current_streak, 0) + 1;
    ELSE
        -- Seri bozuldu, sıfırdan başla
        v_new_streak := 1;
    END IF;
    
    -- Güncelle
    UPDATE student_points
    SET 
        current_streak = v_new_streak,
        max_streak = GREATEST(COALESCE(max_streak, 0), v_new_streak),
        last_activity_at = NOW()
    WHERE student_id = p_student_id;
    
    RETURN v_new_streak;
END;
$$;

-- =====================================================
-- TAMAMLANDI!
-- =====================================================

-- Başarıyla çalıştırıldığını doğrulamak için:
SELECT 'Gamification tabloları başarıyla oluşturuldu!' as message;

-- Tablo listesi
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_badges', 'challenge_progress', 'xp_history', 'weekly_challenges', 'achievement_notifications')
ORDER BY table_name;

