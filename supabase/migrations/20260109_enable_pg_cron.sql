-- =====================================================
-- PG_CRON EXTENSION VE HAFTALIK JOB AYARI
-- Supabase Dashboard > Database > Extensions > pg_cron aktif olmalı
-- =====================================================

-- pg_cron extension'ı aktif et (Supabase'de Dashboard'dan da yapılabilir)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- cron schema'ya erişim
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- =====================================================
-- HAFTALIK ENGAGEMENT INDEX GÜNCELLEME CRON JOB
-- Her Pazartesi sabah 03:00 (UTC) çalışır
-- =====================================================

-- Mevcut job varsa sil
SELECT cron.unschedule('weekly-engagement-index') 
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'weekly-engagement-index'
);

-- Yeni job oluştur
SELECT cron.schedule(
    'weekly-engagement-index',           -- job adı
    '0 3 * * 1',                         -- Her Pazartesi 03:00 UTC
    $$SELECT weekly_engagement_index_update()$$
);

-- =====================================================
-- GÜNLÜK ENGAGEMENT SKORU GÜNCELLEME (OPSİYONEL)
-- Daha agresif güncelleme istersen bunu da aktif et
-- =====================================================

-- Her gün gece 02:00'de top 100 yeni popüler sayfayı indexe aç
-- SELECT cron.schedule(
--     'daily-engagement-top100',
--     '0 2 * * *',
--     $$SELECT index_top_engagement_pages(100)$$
-- );

-- =====================================================
-- CRON JOB LOGLAMA TABLOSU
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
-- LOGLAYİCİ WRAPPER FONKSİYON
-- =====================================================

CREATE OR REPLACE FUNCTION logged_engagement_update()
RETURNS VOID AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Ana fonksiyonu çalıştır
    v_result := weekly_engagement_index_update();
    
    -- Loğa kaydet
    INSERT INTO cron_job_logs (job_name, result, success)
    VALUES ('weekly-engagement-index', v_result, TRUE);
    
EXCEPTION WHEN OTHERS THEN
    -- Hata durumunda logla
    INSERT INTO cron_job_logs (job_name, success, error_message)
    VALUES ('weekly-engagement-index', FALSE, SQLERRM);
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron job'ı loglayıcı versiyonla güncelle
SELECT cron.unschedule('weekly-engagement-index') 
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'weekly-engagement-index'
);

SELECT cron.schedule(
    'weekly-engagement-index',
    '0 3 * * 1',
    $$SELECT logged_engagement_update()$$
);

-- =====================================================
-- CRON JOB DURUMU GÖRÜNTÜLEME
-- =====================================================

CREATE OR REPLACE VIEW cron_job_status AS
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    nodename,
    active
FROM cron.job
ORDER BY jobname;

COMMENT ON TABLE cron_job_logs IS 'Cron job çalışma logları';
COMMENT ON VIEW cron_job_status IS 'Aktif cron job listesi';
