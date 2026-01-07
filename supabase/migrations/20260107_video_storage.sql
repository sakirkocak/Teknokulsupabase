-- =====================================================
-- VIDEO STORAGE BUCKET
-- Soru çözüm videoları için Supabase Storage
-- =====================================================

-- 1. Video bucket oluştur
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'solution-videos',
  'solution-videos',
  true,  -- Public (herkes izleyebilsin)
  104857600,  -- 100MB max
  ARRAY['video/mp4', 'video/webm', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'image/png', 'image/jpeg'];

-- 2. Storage Policies

-- Herkes videoları izleyebilir (public)
DROP POLICY IF EXISTS "Anyone can view solution videos" ON storage.objects;
CREATE POLICY "Anyone can view solution videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'solution-videos');

-- Sadece servis (API) video yükleyebilir
DROP POLICY IF EXISTS "Service can upload solution videos" ON storage.objects;
CREATE POLICY "Service can upload solution videos"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'solution-videos');

-- Admin video yükleyebilir
DROP POLICY IF EXISTS "Admin can upload solution videos" ON storage.objects;
CREATE POLICY "Admin can upload solution videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'solution-videos' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Admin video silebilir
DROP POLICY IF EXISTS "Admin can delete solution videos" ON storage.objects;
CREATE POLICY "Admin can delete solution videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'solution-videos'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 3. Questions tablosuna Supabase video URL kolonu ekle
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS video_storage_url TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;

-- 4. Index for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_video_storage ON questions(video_storage_url) WHERE video_storage_url IS NOT NULL;

-- 5. Video istatistikleri view
CREATE OR REPLACE VIEW video_stats AS
SELECT 
  COUNT(*) FILTER (WHERE video_storage_url IS NOT NULL) as videos_in_storage,
  COUNT(*) FILTER (WHERE video_solution_url IS NOT NULL) as videos_on_youtube,
  COUNT(*) FILTER (WHERE video_storage_url IS NOT NULL AND video_solution_url IS NULL) as pending_youtube_upload,
  COUNT(*) FILTER (WHERE video_status = 'completed') as completed_videos,
  COUNT(*) FILTER (WHERE video_status = 'processing') as processing_videos,
  COUNT(*) FILTER (WHERE video_status = 'failed') as failed_videos
FROM questions;

COMMENT ON VIEW video_stats IS 'Video üretim istatistikleri';
