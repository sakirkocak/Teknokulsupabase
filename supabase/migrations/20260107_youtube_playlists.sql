-- =====================================================
-- YOUTUBE PLAYLIST SİSTEMİ
-- Ders bazlı otomatik playlist yönetimi
-- =====================================================

-- 1. YouTube Playlist tablosu
CREATE TABLE IF NOT EXISTS youtube_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12),
    subject TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    playlist_id TEXT UNIQUE,
    playlist_url TEXT,
    video_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(grade, subject_code)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_youtube_playlists_grade ON youtube_playlists(grade);
CREATE INDEX IF NOT EXISTS idx_youtube_playlists_subject ON youtube_playlists(subject_code);

-- 2. Video upload log tablosu (rate limiting için)
CREATE TABLE IF NOT EXISTS youtube_upload_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    playlist_id TEXT,
    youtube_video_id TEXT,
    youtube_url TEXT,
    upload_date DATE DEFAULT CURRENT_DATE,
    upload_time TIMESTAMPTZ DEFAULT NOW(),
    quota_used INTEGER DEFAULT 100,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'pending')),
    error_message TEXT
);

-- Günlük upload sayısı için index
CREATE INDEX IF NOT EXISTS idx_upload_logs_date ON youtube_upload_logs(upload_date);
CREATE INDEX IF NOT EXISTS idx_upload_logs_status ON youtube_upload_logs(status);

-- 3. Günlük upload limiti kontrolü için fonksiyon
CREATE OR REPLACE FUNCTION get_today_upload_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM youtube_upload_logs 
        WHERE upload_date = CURRENT_DATE 
        AND status = 'completed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Upload izni kontrolü (günde max 50)
CREATE OR REPLACE FUNCTION can_upload_video()
RETURNS BOOLEAN AS $$
DECLARE
    today_count INTEGER;
    max_daily INTEGER := 50;
BEGIN
    SELECT get_today_upload_count() INTO today_count;
    RETURN today_count < max_daily;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Playlist video sayısını güncelle
CREATE OR REPLACE FUNCTION update_playlist_video_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.playlist_id IS NOT NULL THEN
        UPDATE youtube_playlists 
        SET video_count = video_count + 1,
            updated_at = NOW()
        WHERE playlist_id = NEW.playlist_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_playlist_count
    AFTER INSERT ON youtube_upload_logs
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_playlist_video_count();

-- 6. Video generation queue'ya playlist_id ekle
ALTER TABLE video_generation_queue 
ADD COLUMN IF NOT EXISTS target_playlist_id TEXT;

-- 7. RLS Politikaları
ALTER TABLE youtube_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_upload_logs ENABLE ROW LEVEL SECURITY;

-- Adminler her şeyi görebilir
CREATE POLICY "youtube_playlists_admin_all" ON youtube_playlists
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "youtube_upload_logs_admin_all" ON youtube_upload_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Service role full access
CREATE POLICY "youtube_playlists_service" ON youtube_playlists
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "youtube_upload_logs_service" ON youtube_upload_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8. İstatistik fonksiyonu
CREATE OR REPLACE FUNCTION get_youtube_stats()
RETURNS TABLE(
    total_playlists INTEGER,
    total_videos_uploaded INTEGER,
    today_uploads INTEGER,
    remaining_today INTEGER,
    quota_used INTEGER,
    quota_remaining INTEGER
) AS $$
DECLARE
    max_daily INTEGER := 50;
    quota_per_upload INTEGER := 100;
    daily_quota INTEGER := 10000;
    today_count INTEGER;
BEGIN
    SELECT get_today_upload_count() INTO today_count;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM youtube_playlists WHERE playlist_id IS NOT NULL),
        (SELECT COUNT(*)::INTEGER FROM youtube_upload_logs WHERE status = 'completed'),
        today_count,
        GREATEST(0, max_daily - today_count),
        today_count * quota_per_upload,
        GREATEST(0, daily_quota - (today_count * quota_per_upload));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- BİLGİLENDİRME
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ YouTube Playlist sistemi kuruldu:';
    RAISE NOTICE '   - youtube_playlists tablosu';
    RAISE NOTICE '   - youtube_upload_logs tablosu';
    RAISE NOTICE '   - Rate limiting fonksiyonları';
    RAISE NOTICE '   - Günlük max 50 video limiti';
END
$$;
