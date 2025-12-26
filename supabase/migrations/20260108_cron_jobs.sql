-- =====================================================
-- CRON JOB SETUP
-- Periyodik görevler için pg_cron kullanımı
-- NOT: pg_cron sadece Supabase Pro+ planlarında aktiftir
-- Free plan için Vercel Cron veya Edge Function kullanın
-- =====================================================

-- pg_cron extension'ı etkinleştir (Supabase Pro+ gerektirir)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- ALTERNATİF: MANUEL CRON ENDPOINT
-- Vercel Cron veya harici bir servis tarafından çağrılabilir
-- =====================================================

-- 1. Cron için güvenli endpoint fonksiyonu
CREATE OR REPLACE FUNCTION public.cron_flush_pending_points(p_secret TEXT)
RETURNS JSON AS $$
DECLARE
    expected_secret TEXT;
    affected_rows INTEGER;
BEGIN
    -- Secret kontrolü (environment variable olarak ayarlanmalı)
    expected_secret := current_setting('app.cron_secret', true);
    
    -- Secret boş veya eşleşmiyorsa hata ver (güvenlik için)
    IF expected_secret IS NULL OR expected_secret = '' THEN
        -- Development modunda secret kontrolü atlansın
        RAISE NOTICE 'Cron secret not configured, running in dev mode';
    ELSIF p_secret != expected_secret THEN
        RETURN json_build_object('error', 'Invalid secret', 'success', false);
    END IF;
    
    -- Flush işlemini çalıştır
    affected_rows := flush_pending_points();
    
    RETURN json_build_object(
        'success', true,
        'affected_rows', affected_rows,
        'executed_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Partition oluşturma cron fonksiyonu
CREATE OR REPLACE FUNCTION public.cron_create_next_partition(p_secret TEXT)
RETURNS JSON AS $$
DECLARE
    expected_secret TEXT;
BEGIN
    expected_secret := current_setting('app.cron_secret', true);
    
    IF expected_secret IS NULL OR expected_secret = '' THEN
        RAISE NOTICE 'Cron secret not configured, running in dev mode';
    ELSIF p_secret != expected_secret THEN
        RETURN json_build_object('error', 'Invalid secret', 'success', false);
    END IF;
    
    -- Yeni partition oluştur
    PERFORM create_next_quarter_partition();
    
    RETURN json_build_object(
        'success', true,
        'message', 'Next quarter partition created',
        'executed_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Sistem sağlık kontrolü fonksiyonu
CREATE OR REPLACE FUNCTION public.cron_health_check()
RETURNS JSON AS $$
DECLARE
    pending_count BIGINT;
    oldest_pending TIMESTAMPTZ;
    partition_count BIGINT;
BEGIN
    -- Bekleyen puan sayısı
    SELECT COUNT(*), MIN(created_at) INTO pending_count, oldest_pending
    FROM pending_points;
    
    -- Partition sayısı
    SELECT COUNT(*) INTO partition_count
    FROM pg_tables
    WHERE tablename LIKE 'user_answers_%'
    AND schemaname = 'public';
    
    RETURN json_build_object(
        'pending_points_count', pending_count,
        'oldest_pending', oldest_pending,
        'user_answers_partitions', partition_count,
        'checked_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (anon için health check, authenticated için cron)
GRANT EXECUTE ON FUNCTION public.cron_flush_pending_points(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cron_create_next_partition(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cron_health_check() TO anon, authenticated;

-- =====================================================
-- pg_cron JOBS (Sadece Pro+ planlarında çalışır)
-- Aşağıdaki satırları Pro planda aktif edin
-- =====================================================

-- Her 5 dakikada bir pending_points flush
-- SELECT cron.schedule('flush-pending-points', '*/5 * * * *', 
--     $$SELECT public.cron_flush_pending_points('your_secret_here')$$);

-- Her ay 1'inde yeni partition oluştur
-- SELECT cron.schedule('create-next-partition', '0 0 1 * *', 
--     $$SELECT public.cron_create_next_partition('your_secret_here')$$);

