-- =====================================================
-- 🎯 ENGAGEMENT BAZLI SEO INDEXING - HEMEN ÇALIŞTIR
-- =====================================================
-- Bu dosyayı Supabase SQL Editor'de çalıştır
-- Öğrenci etkileşimlerine göre en popüler 1.000 sayfayı indexe açar
-- =====================================================

-- =====================================================
-- 0. GEREKLİ KOLONLARI EKLE (EKSİKSE)
-- =====================================================

-- SEO indexing kolonları
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_indexed BOOLEAN DEFAULT FALSE;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS index_score INTEGER DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS index_reason TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS indexed_at TIMESTAMPTZ;

-- Engagement için gerekli kolonlar (eksikse)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS solve_count INTEGER DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS times_answered INTEGER DEFAULT 0;

-- Video ve AI çözüm kolonları (eksikse)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'none';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS ai_solution_text TEXT;

-- video_watch_logs tablosu yoksa oluştur
CREATE TABLE IF NOT EXISTS video_watch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    credits_used INTEGER DEFAULT 1,
    is_premium BOOLEAN DEFAULT FALSE,
    watched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_watch_logs_question ON video_watch_logs(question_id);

-- =====================================================
-- 1. ENGAGEMENT SKORU HESAPLAMA FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_engagement_score(p_question_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_solve_count INTEGER;
    v_video_watch_count INTEGER;
    v_times_answered INTEGER;
    v_has_video BOOLEAN;
    v_has_ai_solution BOOLEAN;
    v_score INTEGER := 0;
BEGIN
    -- Soru bilgilerini al
    SELECT 
        COALESCE(solve_count, 0),
        COALESCE(times_answered, 0),
        video_status = 'ready',
        ai_solution_text IS NOT NULL AND LENGTH(ai_solution_text) > 100
    INTO v_solve_count, v_times_answered, v_has_video, v_has_ai_solution
    FROM questions
    WHERE id = p_question_id;
    
    -- Video izleme sayısını al
    SELECT COALESCE(COUNT(*), 0)
    INTO v_video_watch_count
    FROM video_watch_logs
    WHERE question_id = p_question_id;
    
    -- Engagement skoru hesapla
    -- Video izleme en değerli (yüksek dwell time)
    v_score := v_score + (v_video_watch_count * 5);
    
    -- Çözüm sayısı (return visits)
    v_score := v_score + (v_solve_count * 3);
    
    -- Cevaplama sayısı
    v_score := v_score + (v_times_answered * 2);
    
    -- Video varsa bonus
    IF v_has_video THEN
        v_score := v_score + 30;
    END IF;
    
    -- AI çözüm varsa bonus
    IF v_has_ai_solution THEN
        v_score := v_score + 20;
    END IF;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. TOP SAYFALAR INDEXLEME FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION index_top_engagement_pages(p_limit INTEGER DEFAULT 1000)
RETURNS TABLE(
    indexed_count INTEGER,
    top_score INTEGER,
    min_score INTEGER
) AS $$
DECLARE
    v_indexed_count INTEGER := 0;
    v_top_score INTEGER := 0;
    v_min_score INTEGER := 0;
BEGIN
    -- En yüksek skorlu sayfaları indexe aç
    WITH scored_questions AS (
        SELECT 
            q.id,
            calculate_engagement_score(q.id) as engagement_score
        FROM questions q
    ),
    top_pages AS (
        SELECT id, engagement_score
        FROM scored_questions
        ORDER BY engagement_score DESC
        LIMIT p_limit
    ),
    updated AS (
        UPDATE questions q
        SET 
            is_indexed = TRUE,
            index_score = tp.engagement_score,
            index_reason = 'high_engagement',
            indexed_at = NOW()
        FROM top_pages tp
        WHERE q.id = tp.id
        RETURNING q.id, tp.engagement_score
    )
    SELECT COUNT(*), MAX(engagement_score), MIN(engagement_score)
    INTO v_indexed_count, v_top_score, v_min_score
    FROM updated;
    
    RETURN QUERY SELECT v_indexed_count, v_top_score, v_min_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. HAFTALIK CRON JOB FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION weekly_engagement_index_update()
RETURNS JSON AS $$
DECLARE
    v_result RECORD;
    v_new_indexed INTEGER := 0;
    v_demoted INTEGER := 0;
    v_log JSON;
BEGIN
    -- 1. Top 1000'i indexe aç
    SELECT * INTO v_result FROM index_top_engagement_pages(1000);
    v_new_indexed := v_result.indexed_count;
    
    -- 2. Düşük engagement'lı eski indexli sayfaları noindex yap
    WITH low_engagement AS (
        SELECT q.id
        FROM questions q
        WHERE q.is_indexed = TRUE
        AND q.index_reason = 'high_engagement'
        AND calculate_engagement_score(q.id) < 10
        AND NOT EXISTS (
            SELECT 1 FROM video_watch_logs v 
            WHERE v.question_id = q.id 
            AND v.watched_at > NOW() - INTERVAL '30 days'
        )
    ),
    demoted AS (
        UPDATE questions q
        SET 
            is_indexed = FALSE,
            index_reason = 'low_engagement_demoted',
            indexed_at = NULL
        FROM low_engagement le
        WHERE q.id = le.id
        RETURNING q.id
    )
    SELECT COUNT(*) INTO v_demoted FROM demoted;
    
    -- 3. Log oluştur
    v_log := json_build_object(
        'timestamp', NOW(),
        'new_indexed', v_new_indexed,
        'demoted', v_demoted,
        'top_score', v_result.top_score,
        'min_score', v_result.min_score
    );
    
    RETURN v_log;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. İSTATİSTİK FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION get_engagement_stats()
RETURNS JSON AS $$
DECLARE
    v_total_indexed INTEGER;
    v_engagement_indexed INTEGER;
    v_total_questions INTEGER;
    v_top_10 JSON;
BEGIN
    -- Toplam soru sayısı
    SELECT COUNT(*) INTO v_total_questions FROM questions;
    
    -- Toplam indexli sayfa
    SELECT COUNT(*) INTO v_total_indexed
    FROM questions WHERE is_indexed = TRUE;
    
    -- Engagement bazlı indexli
    SELECT COUNT(*) INTO v_engagement_indexed
    FROM questions WHERE is_indexed = TRUE AND index_reason = 'high_engagement';
    
    -- Top 10 sayfa
    SELECT json_agg(t) INTO v_top_10
    FROM (
        SELECT 
            q.id,
            LEFT(q.question_text, 80) as question_preview,
            s.name as subject,
            COALESCE(q.solve_count, 0) as solve_count,
            calculate_engagement_score(q.id) as score
        FROM questions q
        JOIN topics t ON t.id = q.topic_id
        JOIN subjects s ON s.id = t.subject_id
        ORDER BY calculate_engagement_score(q.id) DESC
        LIMIT 10
    ) t;
    
    RETURN json_build_object(
        'total_questions', v_total_questions,
        'total_indexed', v_total_indexed,
        'engagement_indexed', v_engagement_indexed,
        'top_10_pages', v_top_10
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CRON JOB LOG TABLOSU
-- =====================================================

CREATE TABLE IF NOT EXISTS cron_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    result JSONB,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_cron_logs_job ON cron_job_logs(job_name, executed_at DESC);

-- =====================================================
-- 6. INDEXLER
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_questions_engagement 
ON questions(solve_count DESC, times_answered DESC) 
WHERE solve_count > 0 OR times_answered > 0;

CREATE INDEX IF NOT EXISTS idx_video_watch_logs_recent 
ON video_watch_logs(question_id, watched_at DESC);

-- =====================================================
-- 7. PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION calculate_engagement_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION index_top_engagement_pages(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION weekly_engagement_index_update() TO authenticated;
GRANT EXECUTE ON FUNCTION get_engagement_stats() TO authenticated;

-- =====================================================
-- 🚀 8. HEMEN ÇALIŞTIR - TOP 1000'İ INDEXE AÇ
-- =====================================================

SELECT * FROM index_top_engagement_pages(1000);

-- Sonucu kontrol et
SELECT * FROM get_engagement_stats();

-- =====================================================
-- 📅 9. CRON JOB AYARI (Ayrı çalıştır)
-- Supabase Dashboard > Database > Extensions > pg_cron aktif olmalı
-- =====================================================

-- Her Pazartesi sabah 03:00 UTC çalışır
-- SELECT cron.schedule(
--     'weekly-engagement-index',
--     '0 3 * * 1',
--     $$SELECT weekly_engagement_index_update()$$
-- );
