-- =====================================================
-- VIDEO ÇÖZÜM SİSTEMİ
-- Manim + ElevenLabs ile otomatik video çözüm üretimi
-- =====================================================

-- 1. questions tablosuna video alanları ekle
ALTER TABLE questions ADD COLUMN IF NOT EXISTS video_solution_url TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'none' 
  CHECK (video_status IN ('none', 'pending', 'processing', 'completed', 'failed'));
ALTER TABLE questions ADD COLUMN IF NOT EXISTS video_generated_at TIMESTAMPTZ;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS video_youtube_id TEXT;

-- Index for video status filtering
CREATE INDEX IF NOT EXISTS idx_questions_video_status 
ON questions(video_status) 
WHERE video_status != 'none';

-- 2. Video üretim kuyruğu tablosu
CREATE TABLE IF NOT EXISTS video_generation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Durum
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 0, -- Yüksek = öncelikli
    
    -- İşlem bilgileri
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Maliyet takibi
    elevenlabs_chars INTEGER,
    estimated_cost_usd DECIMAL(10, 4),
    
    -- Zaman damgaları
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Aynı soru için tekrar istek önleme
    UNIQUE(question_id)
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_video_queue_status ON video_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_video_queue_priority ON video_generation_queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_video_queue_requested_by ON video_generation_queue(requested_by);

-- 3. Video üretim logları (istatistik için)
CREATE TABLE IF NOT EXISTS video_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES video_generation_queue(id) ON DELETE SET NULL,
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    
    -- Aşama bilgisi
    stage TEXT NOT NULL, -- 'gemini_solution', 'elevenlabs_tts', 'manim_render', 'youtube_upload'
    status TEXT NOT NULL, -- 'started', 'completed', 'failed'
    
    -- Detaylar
    duration_ms INTEGER,
    details JSONB,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_logs_queue ON video_generation_logs(queue_id);
CREATE INDEX IF NOT EXISTS idx_video_logs_stage ON video_generation_logs(stage, status);

-- =====================================================
-- RLS POLİTİKALARI
-- =====================================================

ALTER TABLE video_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_generation_logs ENABLE ROW LEVEL SECURITY;

-- Queue: Kullanıcılar kendi isteklerini görebilir
CREATE POLICY "video_queue_user_select" ON video_generation_queue
  FOR SELECT USING (auth.uid() = requested_by);

-- Queue: Kullanıcılar istek oluşturabilir
CREATE POLICY "video_queue_user_insert" ON video_generation_queue
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- Queue: Adminler her şeyi görebilir
CREATE POLICY "video_queue_admin_select" ON video_generation_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Queue: Adminler güncelleyebilir
CREATE POLICY "video_queue_admin_update" ON video_generation_queue
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Queue: Adminler silebilir
CREATE POLICY "video_queue_admin_delete" ON video_generation_queue
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Queue: Service role full access (background jobs için)
CREATE POLICY "video_queue_service_role" ON video_generation_queue
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Logs: Adminler görebilir
CREATE POLICY "video_logs_admin_select" ON video_generation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Logs: Service role full access
CREATE POLICY "video_logs_service_role" ON video_generation_logs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =====================================================
-- FONKSİYONLAR
-- =====================================================

-- Sıradaki videoyu al (processing için)
CREATE OR REPLACE FUNCTION get_next_video_to_process()
RETURNS TABLE(
    queue_id UUID,
    question_id UUID,
    question_text TEXT,
    options JSONB,
    correct_answer TEXT,
    explanation TEXT,
    topic_name TEXT,
    subject_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH next_item AS (
        SELECT vgq.id, vgq.question_id
        FROM video_generation_queue vgq
        WHERE vgq.status = 'pending'
          AND vgq.retry_count < vgq.max_retries
        ORDER BY vgq.priority DESC, vgq.created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    UPDATE video_generation_queue
    SET status = 'processing', started_at = NOW()
    FROM next_item
    WHERE video_generation_queue.id = next_item.id
    RETURNING 
        video_generation_queue.id,
        video_generation_queue.question_id,
        (SELECT q.question_text FROM questions q WHERE q.id = video_generation_queue.question_id),
        (SELECT q.options FROM questions q WHERE q.id = video_generation_queue.question_id),
        (SELECT q.correct_answer FROM questions q WHERE q.id = video_generation_queue.question_id),
        (SELECT q.explanation FROM questions q WHERE q.id = video_generation_queue.question_id),
        (SELECT t.main_topic FROM topics t JOIN questions q ON q.topic_id = t.id WHERE q.id = video_generation_queue.question_id),
        (SELECT s.name FROM subjects s JOIN topics t ON t.subject_id = s.id JOIN questions q ON q.topic_id = t.id WHERE q.id = video_generation_queue.question_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Video tamamlandığında güncelle
CREATE OR REPLACE FUNCTION complete_video_generation(
    p_queue_id UUID,
    p_youtube_url TEXT,
    p_youtube_id TEXT,
    p_elevenlabs_chars INTEGER DEFAULT NULL,
    p_cost_usd DECIMAL DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_question_id UUID;
BEGIN
    -- Queue'dan question_id al
    SELECT question_id INTO v_question_id 
    FROM video_generation_queue 
    WHERE id = p_queue_id;
    
    -- Queue'yu güncelle
    UPDATE video_generation_queue
    SET 
        status = 'completed',
        completed_at = NOW(),
        elevenlabs_chars = COALESCE(p_elevenlabs_chars, elevenlabs_chars),
        estimated_cost_usd = COALESCE(p_cost_usd, estimated_cost_usd)
    WHERE id = p_queue_id;
    
    -- Question'ı güncelle
    UPDATE questions
    SET 
        video_solution_url = p_youtube_url,
        video_youtube_id = p_youtube_id,
        video_status = 'completed',
        video_generated_at = NOW()
    WHERE id = v_question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Video başarısız olduğunda
CREATE OR REPLACE FUNCTION fail_video_generation(
    p_queue_id UUID,
    p_error_message TEXT
)
RETURNS VOID AS $$
DECLARE
    v_question_id UUID;
    v_retry_count INTEGER;
    v_max_retries INTEGER;
BEGIN
    -- Mevcut değerleri al
    SELECT question_id, retry_count, max_retries 
    INTO v_question_id, v_retry_count, v_max_retries
    FROM video_generation_queue 
    WHERE id = p_queue_id;
    
    -- Retry sayısını artır
    v_retry_count := v_retry_count + 1;
    
    IF v_retry_count >= v_max_retries THEN
        -- Max retry'a ulaşıldı - failed olarak işaretle
        UPDATE video_generation_queue
        SET 
            status = 'failed',
            error_message = p_error_message,
            retry_count = v_retry_count,
            completed_at = NOW()
        WHERE id = p_queue_id;
        
        UPDATE questions
        SET video_status = 'failed'
        WHERE id = v_question_id;
    ELSE
        -- Tekrar pending'e al
        UPDATE video_generation_queue
        SET 
            status = 'pending',
            error_message = p_error_message,
            retry_count = v_retry_count,
            started_at = NULL
        WHERE id = p_queue_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Video istatistikleri
CREATE OR REPLACE FUNCTION get_video_stats()
RETURNS TABLE(
    total_videos INTEGER,
    pending_count INTEGER,
    processing_count INTEGER,
    completed_count INTEGER,
    failed_count INTEGER,
    total_cost_usd DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_videos,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_count,
        COUNT(*) FILTER (WHERE status = 'processing')::INTEGER as processing_count,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_count,
        COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed_count,
        COALESCE(SUM(estimated_cost_usd), 0) as total_cost_usd
    FROM video_generation_queue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- YORUMLAR
-- =====================================================

COMMENT ON TABLE video_generation_queue IS 'Manim video üretim kuyruğu';
COMMENT ON TABLE video_generation_logs IS 'Video üretim aşama logları';
COMMENT ON COLUMN questions.video_solution_url IS 'YouTube video çözüm URL''si';
COMMENT ON COLUMN questions.video_status IS 'Video durumu: none, pending, processing, completed, failed';
COMMENT ON COLUMN questions.video_youtube_id IS 'YouTube video ID''si';

-- =====================================================
-- BİLGİLENDİRME
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Video Çözüm Sistemi kuruldu:';
    RAISE NOTICE '   - questions tablosuna video alanları eklendi';
    RAISE NOTICE '   - video_generation_queue tablosu oluşturuldu';
    RAISE NOTICE '   - video_generation_logs tablosu oluşturuldu';
    RAISE NOTICE '   - RLS politikaları eklendi';
    RAISE NOTICE '   - Yardımcı fonksiyonlar oluşturuldu';
END
$$;
