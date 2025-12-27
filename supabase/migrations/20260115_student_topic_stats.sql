-- =====================================================
-- STUDENT TOPIC STATS TABLE
-- Öğrenci konu bazlı ilerleme tablosu
-- Adaptive learning ve eksiklik gösterimi için
-- =====================================================

-- Tablo oluştur
CREATE TABLE IF NOT EXISTS student_topic_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    
    -- İstatistikler
    total_attempted INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_wrong INTEGER DEFAULT 0,
    
    -- Streak ve zorluk
    consecutive_correct INTEGER DEFAULT 0,
    consecutive_wrong INTEGER DEFAULT 0,
    current_difficulty VARCHAR(20) DEFAULT 'medium',  -- easy, medium, hard
    
    -- Mastery
    mastery_level VARCHAR(20) DEFAULT 'beginner',  -- beginner, learning, proficient, master
    
    -- Zaman
    first_attempted_at TIMESTAMPTZ,
    last_attempted_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,  -- Spaced repetition için
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, topic_id)
);

-- RLS aktif et
ALTER TABLE student_topic_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "student_topic_stats_own_read" ON student_topic_stats;
CREATE POLICY "student_topic_stats_own_read" ON student_topic_stats 
    FOR SELECT 
    USING (
        student_id IN (
            SELECT id FROM student_profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "student_topic_stats_own_write" ON student_topic_stats;
CREATE POLICY "student_topic_stats_own_write" ON student_topic_stats 
    FOR ALL 
    USING (
        student_id IN (
            SELECT id FROM student_profiles WHERE user_id = auth.uid()
        )
    );

-- Indexler
CREATE INDEX IF NOT EXISTS idx_student_topic_stats_student ON student_topic_stats(student_id);
CREATE INDEX IF NOT EXISTS idx_student_topic_stats_topic ON student_topic_stats(topic_id);
CREATE INDEX IF NOT EXISTS idx_student_topic_stats_mastery ON student_topic_stats(mastery_level);
CREATE INDEX IF NOT EXISTS idx_student_topic_stats_last_attempted ON student_topic_stats(last_attempted_at);

-- Update trigger
CREATE OR REPLACE FUNCTION update_student_topic_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS student_topic_stats_updated_at ON student_topic_stats;
CREATE TRIGGER student_topic_stats_updated_at
    BEFORE UPDATE ON student_topic_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_student_topic_stats_updated_at();

-- =====================================================
-- UPSERT FONKSİYONU
-- Soru çözümünden sonra konu istatistiklerini günceller
-- =====================================================
CREATE OR REPLACE FUNCTION update_student_topic_stat(
    p_student_id UUID,
    p_topic_id UUID,
    p_is_correct BOOLEAN
)
RETURNS VOID AS $$
DECLARE
    v_current RECORD;
    v_new_mastery VARCHAR(20);
    v_new_difficulty VARCHAR(20);
    v_success_rate FLOAT;
BEGIN
    -- Mevcut kaydı al veya default değerlerle oluştur
    INSERT INTO student_topic_stats (student_id, topic_id, first_attempted_at, last_attempted_at)
    VALUES (p_student_id, p_topic_id, NOW(), NOW())
    ON CONFLICT (student_id, topic_id) DO NOTHING;
    
    -- Mevcut değerleri al
    SELECT * INTO v_current FROM student_topic_stats 
    WHERE student_id = p_student_id AND topic_id = p_topic_id;
    
    -- İstatistikleri güncelle
    IF p_is_correct THEN
        UPDATE student_topic_stats SET
            total_attempted = v_current.total_attempted + 1,
            total_correct = v_current.total_correct + 1,
            consecutive_correct = v_current.consecutive_correct + 1,
            consecutive_wrong = 0,
            last_attempted_at = NOW()
        WHERE student_id = p_student_id AND topic_id = p_topic_id;
    ELSE
        UPDATE student_topic_stats SET
            total_attempted = v_current.total_attempted + 1,
            total_wrong = COALESCE(v_current.total_wrong, 0) + 1,
            consecutive_correct = 0,
            consecutive_wrong = COALESCE(v_current.consecutive_wrong, 0) + 1,
            last_attempted_at = NOW()
        WHERE student_id = p_student_id AND topic_id = p_topic_id;
    END IF;
    
    -- Güncel değerleri tekrar al
    SELECT * INTO v_current FROM student_topic_stats 
    WHERE student_id = p_student_id AND topic_id = p_topic_id;
    
    -- Success rate hesapla
    v_success_rate := CASE 
        WHEN v_current.total_attempted > 0 
        THEN (v_current.total_correct::FLOAT / v_current.total_attempted) * 100
        ELSE 0 
    END;
    
    -- Mastery level hesapla
    v_new_mastery := CASE
        WHEN v_current.total_attempted >= 20 AND v_success_rate >= 85 THEN 'master'
        WHEN v_current.total_attempted >= 10 AND v_success_rate >= 70 THEN 'proficient'
        WHEN v_success_rate >= 50 THEN 'learning'
        ELSE 'beginner'
    END;
    
    -- Current difficulty hesapla (adaptive learning)
    v_new_difficulty := CASE
        WHEN v_current.consecutive_correct >= 5 AND v_success_rate >= 80 THEN 'hard'
        WHEN v_current.consecutive_correct >= 3 AND v_success_rate >= 60 THEN 'medium'
        WHEN v_current.consecutive_wrong >= 3 THEN 'easy'
        ELSE v_current.current_difficulty
    END;
    
    -- Mastery ve difficulty güncelle
    UPDATE student_topic_stats SET
        mastery_level = v_new_mastery,
        current_difficulty = v_new_difficulty
    WHERE student_id = p_student_id AND topic_id = p_topic_id;
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TYPESENSE SYNC İÇİN RPC
-- Tüm öğrenci konu istatistiklerini döndürür
-- =====================================================
CREATE OR REPLACE FUNCTION get_student_topic_progress()
RETURNS TABLE (
    student_id UUID,
    topic_id UUID,
    subject_code VARCHAR,
    subject_name VARCHAR,
    main_topic VARCHAR,
    grade INTEGER,
    total_attempted INTEGER,
    total_correct INTEGER,
    success_rate FLOAT,
    consecutive_correct INTEGER,
    mastery_level VARCHAR,
    current_difficulty VARCHAR,
    last_practiced_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sts.student_id,
        sts.topic_id,
        s.code as subject_code,
        s.name as subject_name,
        t.main_topic,
        t.grade,
        sts.total_attempted,
        sts.total_correct,
        CASE 
            WHEN sts.total_attempted > 0 
            THEN (sts.total_correct::FLOAT / sts.total_attempted) * 100
            ELSE 0 
        END as success_rate,
        sts.consecutive_correct,
        sts.mastery_level::VARCHAR,
        sts.current_difficulty::VARCHAR,
        sts.last_attempted_at as last_practiced_at
    FROM student_topic_stats sts
    JOIN topics t ON sts.topic_id = t.id
    JOIN subjects s ON t.subject_id = s.id
    WHERE sts.total_attempted > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- user_answers INSERT TRİGGER
-- Yeni cevap eklendiğinde otomatik güncelle
-- =====================================================
CREATE OR REPLACE FUNCTION on_user_answer_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_topic_id UUID;
BEGIN
    -- Student ID direkt NEW'den geliyor (user_answers.student_id)
    IF NEW.student_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Topic ID'yi al
    SELECT q.topic_id INTO v_topic_id
    FROM questions q
    WHERE q.id = NEW.question_id;
    
    IF v_topic_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- İstatistikleri güncelle
    PERFORM update_student_topic_stat(NEW.student_id, v_topic_id, NEW.is_correct);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı ekle (varsa güncelle)
DROP TRIGGER IF EXISTS user_answer_topic_stats_trigger ON user_answers;
CREATE TRIGGER user_answer_topic_stats_trigger
    AFTER INSERT ON user_answers
    FOR EACH ROW
    EXECUTE FUNCTION on_user_answer_insert();

-- =====================================================
-- MEVCUT VERİDEN POPULATE
-- Mevcut user_answers verilerinden istatistik oluştur
-- =====================================================
CREATE OR REPLACE FUNCTION populate_student_topic_stats()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_row RECORD;
BEGIN
    -- Her öğrenci-konu kombinasyonu için aggregate yap
    FOR v_row IN (
        SELECT 
            ua.student_id,
            q.topic_id,
            COUNT(*) as total_attempted,
            COUNT(*) FILTER (WHERE ua.is_correct) as total_correct,
            COUNT(*) FILTER (WHERE NOT ua.is_correct) as total_wrong,
            MIN(ua.answered_at) as first_attempted_at,
            MAX(ua.answered_at) as last_attempted_at
        FROM user_answers ua
        JOIN questions q ON ua.question_id = q.id
        WHERE q.topic_id IS NOT NULL AND ua.student_id IS NOT NULL
        GROUP BY ua.student_id, q.topic_id
    )
    LOOP
        INSERT INTO student_topic_stats (
            student_id, topic_id, 
            total_attempted, total_correct, total_wrong,
            first_attempted_at, last_attempted_at,
            mastery_level, current_difficulty
        )
        VALUES (
            v_row.student_id, v_row.topic_id,
            v_row.total_attempted, v_row.total_correct, v_row.total_wrong,
            v_row.first_attempted_at, v_row.last_attempted_at,
            CASE
                WHEN v_row.total_attempted >= 20 AND (v_row.total_correct::FLOAT / v_row.total_attempted) >= 0.85 THEN 'master'
                WHEN v_row.total_attempted >= 10 AND (v_row.total_correct::FLOAT / v_row.total_attempted) >= 0.70 THEN 'proficient'
                WHEN (v_row.total_correct::FLOAT / v_row.total_attempted) >= 0.50 THEN 'learning'
                ELSE 'beginner'
            END,
            'medium'
        )
        ON CONFLICT (student_id, topic_id) DO UPDATE SET
            total_attempted = EXCLUDED.total_attempted,
            total_correct = EXCLUDED.total_correct,
            total_wrong = EXCLUDED.total_wrong,
            last_attempted_at = EXCLUDED.last_attempted_at,
            mastery_level = EXCLUDED.mastery_level;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Mevcut veriyi populate et
SELECT populate_student_topic_stats();

-- Comment
COMMENT ON TABLE student_topic_stats IS 'Öğrenci konu bazlı ilerleme istatistikleri - Adaptive learning için';
COMMENT ON FUNCTION update_student_topic_stat IS 'Soru çözümünden sonra konu istatistiklerini günceller';
COMMENT ON FUNCTION get_student_topic_progress IS 'Typesense sync için tüm konu istatistiklerini döndürür';

