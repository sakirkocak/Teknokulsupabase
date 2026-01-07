-- =====================================================
-- VIDEO İZLEME LOGLARI
-- Kredi takibi için video izleme kayıtları
-- =====================================================

CREATE TABLE IF NOT EXISTS video_watch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  credits_used INTEGER DEFAULT 1,
  is_premium BOOLEAN DEFAULT FALSE,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Aynı kullanıcı aynı videoyu bir gün içinde tekrar izlerse kredi harcamasın
  UNIQUE(user_id, question_id, (watched_at::DATE))
);

-- Index
CREATE INDEX IF NOT EXISTS idx_video_watch_logs_user ON video_watch_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_logs_question ON video_watch_logs(question_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_logs_date ON video_watch_logs(watched_at);

-- RLS
ALTER TABLE video_watch_logs ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi kayıtlarını görebilir
CREATE POLICY "Users can view own watch logs"
  ON video_watch_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Kullanıcı kayıt ekleyebilir
CREATE POLICY "Users can insert watch logs"
  ON video_watch_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin tüm kayıtları görebilir
CREATE POLICY "Admin can view all watch logs"
  ON video_watch_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

COMMENT ON TABLE video_watch_logs IS 'Video izleme kayıtları ve kredi takibi';
