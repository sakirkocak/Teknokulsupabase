-- =====================================================
-- GAMİFİCATİON TABLOLARI
-- Günlük görevler, rozetler, XP sistemi
-- =====================================================

-- 1. ROZETLER TABLOSU
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- Emoji veya icon adı
    category VARCHAR(50) DEFAULT 'genel', -- 'streak', 'soru', 'basari', 'liderlik', 'ders'
    requirement_type VARCHAR(50) NOT NULL, -- 'streak_days', 'total_questions', 'correct_rate', 'leaderboard_rank', 'subject_points'
    requirement_value INTEGER NOT NULL, -- Gerekli değer (örn: 7 gün streak, 100 soru)
    xp_reward INTEGER DEFAULT 50, -- Rozet kazanıldığında verilen XP
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Örnek rozetler
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES
    ('İlk Adım', 'İlk soruyu çöz', '🌟', 'basari', 'total_questions', 1, 10),
    ('Yeni Başlangıç', '10 soru çöz', '📚', 'soru', 'total_questions', 10, 25),
    ('Azimli', '50 soru çöz', '💪', 'soru', 'total_questions', 50, 50),
    ('Çalışkan', '100 soru çöz', '📖', 'soru', 'total_questions', 100, 100),
    ('Soru Makinesi', '500 soru çöz', '🚀', 'soru', 'total_questions', 500, 250),
    ('Efsane', '1000 soru çöz', '🏆', 'soru', 'total_questions', 1000, 500),
    
    ('3 Gün Seri', '3 gün üst üste soru çöz', '🔥', 'streak', 'streak_days', 3, 30),
    ('Haftalık Seri', '7 gün üst üste soru çöz', '🔥🔥', 'streak', 'streak_days', 7, 75),
    ('2 Haftalık Seri', '14 gün üst üste soru çöz', '🔥🔥🔥', 'streak', 'streak_days', 14, 150),
    ('Aylık Seri', '30 gün üst üste soru çöz', '🌟🔥', 'streak', 'streak_days', 30, 500),
    
    ('Başarılı', '%70 başarı oranı (min 50 soru)', '🎯', 'basari', 'correct_rate_70', 50, 75),
    ('Usta', '%80 başarı oranı (min 100 soru)', '⭐', 'basari', 'correct_rate_80', 100, 150),
    ('Uzman', '%90 başarı oranı (min 200 soru)', '💎', 'basari', 'correct_rate_90', 200, 300),
    
    ('Top 100', 'Liderlikte ilk 100e gir', '🏅', 'liderlik', 'leaderboard_rank', 100, 100),
    ('Top 50', 'Liderlikte ilk 50ye gir', '🥉', 'liderlik', 'leaderboard_rank', 50, 200),
    ('Top 10', 'Liderlikte ilk 10a gir', '🥈', 'liderlik', 'leaderboard_rank', 10, 500),
    ('Şampiyon', 'Liderlikte 1. ol', '👑', 'liderlik', 'leaderboard_rank', 1, 1000),
    
    ('Matematik Sevdalısı', 'Matematikten 500 puan topla', '📐', 'ders', 'subject_matematik', 500, 100),
    ('Türkçe Aşığı', 'Türkçeden 500 puan topla', '📖', 'ders', 'subject_turkce', 500, 100),
    ('Fen Meraklısı', 'Fen Bilimlerinden 500 puan topla', '🔬', 'ders', 'subject_fen', 500, 100)
ON CONFLICT (name) DO NOTHING;

-- 2. KULLANICI ROZETLERİ TABLOSU
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 3. GÜNLÜK GÖREVLER TABLOSU
CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(50) NOT NULL, -- 'solve_questions', 'solve_subject', 'streak', 'correct_rate'
    target_value INTEGER NOT NULL, -- Hedef değer (örn: 20 soru)
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL, -- Opsiyonel: Belirli bir ders için
    difficulty VARCHAR(20), -- Opsiyonel: Belirli zorluk
    xp_reward INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    valid_date DATE DEFAULT CURRENT_DATE, -- Hangi gün için geçerli
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Örnek günlük görevler (her gün yenilenmeli)
INSERT INTO daily_challenges (title, description, challenge_type, target_value, xp_reward, valid_date) VALUES
    ('Günlük Pratik', 'Bugün 10 soru çöz', 'solve_questions', 10, 30, CURRENT_DATE),
    ('Azimli Öğrenci', 'Bugün 20 soru çöz', 'solve_questions', 20, 50, CURRENT_DATE),
    ('Çalışkan Arı', 'Bugün 50 soru çöz', 'solve_questions', 50, 100, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- 4. KULLANICI GÜNLÜK GÖREV İLERLEMESİ
CREATE TABLE IF NOT EXISTS challenge_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- 5. XP GEÇMİŞİ (opsiyonel, detaylı takip için)
CREATE TABLE IF NOT EXISTS xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'question_correct', 'streak_bonus', 'badge_earned', 'challenge_completed'
    source_id UUID, -- İlgili kayıt ID'si
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEX'LER
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(valid_date);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user ON challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge ON challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_user ON xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_created ON xp_history(created_at DESC);

-- =====================================================
-- RLS POLİTİKALARI
-- =====================================================

-- Badges - Herkes okuyabilir
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "badges_select_all" ON badges;
CREATE POLICY "badges_select_all" ON badges FOR SELECT USING (true);

-- User Badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_badges_select_own" ON user_badges;
CREATE POLICY "user_badges_select_own" ON user_badges FOR SELECT USING (user_id = auth.uid() OR true);
DROP POLICY IF EXISTS "user_badges_insert_own" ON user_badges;
CREATE POLICY "user_badges_insert_own" ON user_badges FOR INSERT WITH CHECK (user_id = auth.uid());

-- Daily Challenges - Herkes okuyabilir
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_challenges_select_all" ON daily_challenges;
CREATE POLICY "daily_challenges_select_all" ON daily_challenges FOR SELECT USING (true);

-- Challenge Progress
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "challenge_progress_select_own" ON challenge_progress;
CREATE POLICY "challenge_progress_select_own" ON challenge_progress FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "challenge_progress_insert_own" ON challenge_progress;
CREATE POLICY "challenge_progress_insert_own" ON challenge_progress FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "challenge_progress_update_own" ON challenge_progress;
CREATE POLICY "challenge_progress_update_own" ON challenge_progress FOR UPDATE USING (user_id = auth.uid());

-- XP History
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "xp_history_select_own" ON xp_history;
CREATE POLICY "xp_history_select_own" ON xp_history FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "xp_history_insert_own" ON xp_history;
CREATE POLICY "xp_history_insert_own" ON xp_history FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- STUDENT_POINTS TABLOSUNA XP KOLONU EKLE
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_points' AND column_name = 'total_xp') THEN
        ALTER TABLE student_points ADD COLUMN total_xp INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_points' AND column_name = 'level') THEN
        ALTER TABLE student_points ADD COLUMN level INTEGER DEFAULT 1;
    END IF;
END $$;

-- Mevcut puanları XP'ye dönüştür (1 puan = 1 XP)
UPDATE student_points SET total_xp = COALESCE(total_points, 0) WHERE total_xp IS NULL OR total_xp = 0;

-- =====================================================
-- ROZET KONTROLÜ FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_badge RECORD;
    v_student_points RECORD;
    v_student_profile RECORD;
    v_correct_rate NUMERIC;
    v_rank INTEGER;
BEGIN
    -- Öğrenci puanlarını al
    SELECT * INTO v_student_points FROM student_points sp
    JOIN student_profiles stpr ON sp.student_id = stpr.id
    WHERE stpr.user_id = p_user_id;
    
    IF v_student_points IS NULL THEN
        RETURN;
    END IF;
    
    -- Başarı oranı hesapla
    IF v_student_points.total_questions > 0 THEN
        v_correct_rate := (v_student_points.total_correct::NUMERIC / v_student_points.total_questions) * 100;
    ELSE
        v_correct_rate := 0;
    END IF;
    
    -- Her rozeti kontrol et
    FOR v_badge IN SELECT * FROM badges WHERE is_active = true LOOP
        -- Rozet zaten kazanılmış mı?
        IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = v_badge.id) THEN
            CONTINUE;
        END IF;
        
        -- Rozet şartları sağlanıyor mu?
        CASE v_badge.requirement_type
            WHEN 'total_questions' THEN
                IF v_student_points.total_questions >= v_badge.requirement_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id);
                    -- XP ver
                    UPDATE student_points SET total_xp = COALESCE(total_xp, 0) + v_badge.xp_reward
                    WHERE student_id = v_student_points.student_id;
                END IF;
                
            WHEN 'streak_days' THEN
                IF v_student_points.max_streak >= v_badge.requirement_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id);
                    UPDATE student_points SET total_xp = COALESCE(total_xp, 0) + v_badge.xp_reward
                    WHERE student_id = v_student_points.student_id;
                END IF;
                
            WHEN 'correct_rate_70' THEN
                IF v_correct_rate >= 70 AND v_student_points.total_questions >= v_badge.requirement_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id);
                    UPDATE student_points SET total_xp = COALESCE(total_xp, 0) + v_badge.xp_reward
                    WHERE student_id = v_student_points.student_id;
                END IF;
                
            WHEN 'correct_rate_80' THEN
                IF v_correct_rate >= 80 AND v_student_points.total_questions >= v_badge.requirement_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id);
                    UPDATE student_points SET total_xp = COALESCE(total_xp, 0) + v_badge.xp_reward
                    WHERE student_id = v_student_points.student_id;
                END IF;
                
            WHEN 'correct_rate_90' THEN
                IF v_correct_rate >= 90 AND v_student_points.total_questions >= v_badge.requirement_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id);
                    UPDATE student_points SET total_xp = COALESCE(total_xp, 0) + v_badge.xp_reward
                    WHERE student_id = v_student_points.student_id;
                END IF;
                
            ELSE
                -- Diğer türler için özel mantık eklenebilir
                NULL;
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

