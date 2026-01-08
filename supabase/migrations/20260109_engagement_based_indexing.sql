-- =====================================================
-- ENGAGEMENT BAZLI SEO INDEXING SİSTEMİ
-- 🎯 Öğrenci etkileşimlerine göre en popüler sayfaları indexe aç
-- Google'a "Bu sayfalar gerçek kullanıcılar tarafından seviliyoruz" sinyali
-- =====================================================

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
-- 2. EN POPÜLER SAYFALARI INDEXE AÇMA FONKSİYONU
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
    -- Önce tüm soruların engagement skorunu hesapla
    CREATE TEMP TABLE IF NOT EXISTS temp_engagement_scores AS
    SELECT 
        q.id,
        calculate_engagement_score(q.id) as engagement_score
    FROM questions q
    WHERE q.id IS NOT NULL;
    
    -- En yüksek skorlu sayfaları indexe aç
    WITH top_pages AS (
        SELECT id, engagement_score
        FROM temp_engagement_scores
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
        AND (q.is_indexed IS NULL OR q.is_indexed = FALSE)
        RETURNING q.id
    )
    SELECT COUNT(*) INTO v_indexed_count FROM updated;
    
    -- İstatistikler
    SELECT MAX(engagement_score), MIN(engagement_score)
    INTO v_top_score, v_min_score
    FROM temp_engagement_scores
    ORDER BY engagement_score DESC
    LIMIT p_limit;
    
    -- Temp tabloyu temizle
    DROP TABLE IF EXISTS temp_engagement_scores;
    
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
    -- 1. Yeni engagement skorlarını hesapla ve top 1000'i indexe aç
    SELECT * INTO v_result FROM index_top_engagement_pages(1000);
    v_new_indexed := v_result.indexed_count;
    
    -- 2. Düşük engagement'lı eski indexli sayfaları noindex yap
    -- (Son 30 gündür hiç etkileşim almamış ve skoru düşük olanlar)
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
        AND NOT EXISTS (
            SELECT 1 FROM point_history ph 
            WHERE ph.question_id = q.id 
            AND ph.earned_at > NOW() - INTERVAL '30 days'
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
-- 4. ENGAGEMENT BAZLI SORGULAR İÇİN VIEW
-- =====================================================

CREATE OR REPLACE VIEW engagement_leaderboard AS
SELECT 
    q.id,
    q.question_text,
    s.name as subject_name,
    t.name as topic_name,
    t.grade,
    COALESCE(q.solve_count, 0) as solve_count,
    COALESCE(q.times_answered, 0) as times_answered,
    COALESCE(v.video_watch_count, 0) as video_watch_count,
    q.video_status,
    q.is_indexed,
    q.index_reason,
    calculate_engagement_score(q.id) as engagement_score
FROM questions q
JOIN topics t ON t.id = q.topic_id
JOIN subjects s ON s.id = t.subject_id
LEFT JOIN (
    SELECT question_id, COUNT(*) as video_watch_count
    FROM video_watch_logs
    GROUP BY question_id
) v ON v.question_id = q.id
ORDER BY calculate_engagement_score(q.id) DESC;

-- =====================================================
-- 5. HIZLI ERİŞİM İÇİN INDEX
-- =====================================================

-- Engagement sorgularını hızlandır
CREATE INDEX IF NOT EXISTS idx_questions_engagement 
ON questions(solve_count DESC, times_answered DESC) 
WHERE solve_count > 0 OR times_answered > 0;

CREATE INDEX IF NOT EXISTS idx_video_watch_logs_recent 
ON video_watch_logs(question_id, watched_at DESC);

-- =====================================================
-- 6. İLK ÇALIŞTIRMA - TOP 1000'İ HEMEN INDEXE AÇ
-- =====================================================

-- İlk batch indexleme
DO $$
DECLARE
    v_result RECORD;
BEGIN
    SELECT * INTO v_result FROM index_top_engagement_pages(1000);
    RAISE NOTICE '🎯 Engagement-based indexing tamamlandı: % sayfa indexe açıldı (Max skor: %, Min skor: %)', 
        v_result.indexed_count, v_result.top_score, v_result.min_score;
END $$;

-- =====================================================
-- 7. CRON JOB AYARI (pg_cron extension gerekli)
-- =====================================================

-- Supabase'de pg_cron aktifse:
-- Her Pazartesi sabah 03:00'te çalışır
-- SELECT cron.schedule(
--     'weekly-engagement-index',
--     '0 3 * * 1',
--     $$SELECT weekly_engagement_index_update()$$
-- );

-- =====================================================
-- 8. MANUEL TETİKLEME İÇİN RPC
-- =====================================================

-- Admin panelinden manuel tetikleme için
CREATE OR REPLACE FUNCTION trigger_engagement_index_update()
RETURNS JSON AS $$
BEGIN
    -- Sadece admin çalıştırabilir
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Yetkiniz yok';
    END IF;
    
    RETURN weekly_engagement_index_update();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. İSTATİSTİK FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION get_engagement_stats()
RETURNS JSON AS $$
DECLARE
    v_total_indexed INTEGER;
    v_engagement_indexed INTEGER;
    v_avg_score NUMERIC;
    v_top_10 JSON;
BEGIN
    -- Toplam indexli sayfa
    SELECT COUNT(*) INTO v_total_indexed
    FROM questions WHERE is_indexed = TRUE;
    
    -- Engagement bazlı indexli
    SELECT COUNT(*) INTO v_engagement_indexed
    FROM questions WHERE is_indexed = TRUE AND index_reason = 'high_engagement';
    
    -- Ortalama engagement skoru
    SELECT AVG(calculate_engagement_score(id)) INTO v_avg_score
    FROM questions
    WHERE is_indexed = TRUE;
    
    -- Top 10 sayfa
    SELECT json_agg(t) INTO v_top_10
    FROM (
        SELECT 
            q.id,
            LEFT(q.question_text, 50) as question_preview,
            calculate_engagement_score(q.id) as score
        FROM questions q
        ORDER BY calculate_engagement_score(q.id) DESC
        LIMIT 10
    ) t;
    
    RETURN json_build_object(
        'total_indexed', v_total_indexed,
        'engagement_indexed', v_engagement_indexed,
        'avg_engagement_score', ROUND(v_avg_score, 2),
        'top_10_pages', v_top_10
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION calculate_engagement_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_engagement_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_engagement_index_update() TO authenticated;

COMMENT ON FUNCTION calculate_engagement_score IS 'Bir sorunun engagement skorunu hesaplar (video izleme, çözüm sayısı, cevaplama)';
COMMENT ON FUNCTION index_top_engagement_pages IS 'En yüksek engagement skorlu sayfaları indexe açar';
COMMENT ON FUNCTION weekly_engagement_index_update IS 'Haftalık cron job - engagement bazlı index güncelleme';
COMMENT ON FUNCTION trigger_engagement_index_update IS 'Admin için manuel engagement index güncelleme';
COMMENT ON FUNCTION get_engagement_stats IS 'Engagement istatistiklerini döndürür';
