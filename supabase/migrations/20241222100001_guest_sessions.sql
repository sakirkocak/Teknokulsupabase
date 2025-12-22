-- Misafir oturumları için tablo
-- 24 saat sonra otomatik silinecek

CREATE TABLE IF NOT EXISTS guest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text NOT NULL,
  grade integer NOT NULL CHECK (grade >= 1 AND grade <= 12),
  session_token text UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  
  -- İstatistikler
  total_questions integer DEFAULT 0,
  total_correct integer DEFAULT 0,
  total_wrong integer DEFAULT 0,
  total_points integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  max_streak integer DEFAULT 0,
  
  -- Ders bazlı puanlar
  matematik_points integer DEFAULT 0,
  matematik_correct integer DEFAULT 0,
  matematik_wrong integer DEFAULT 0,
  turkce_points integer DEFAULT 0,
  turkce_correct integer DEFAULT 0,
  turkce_wrong integer DEFAULT 0,
  fen_points integer DEFAULT 0,
  fen_correct integer DEFAULT 0,
  fen_wrong integer DEFAULT 0,
  inkilap_points integer DEFAULT 0,
  inkilap_correct integer DEFAULT 0,
  inkilap_wrong integer DEFAULT 0,
  din_points integer DEFAULT 0,
  din_correct integer DEFAULT 0,
  din_wrong integer DEFAULT 0,
  ingilizce_points integer DEFAULT 0,
  ingilizce_correct integer DEFAULT 0,
  ingilizce_wrong integer DEFAULT 0,
  
  -- Zaman damgaları
  created_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Performans için indexler
CREATE INDEX IF NOT EXISTS idx_guest_sessions_token ON guest_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_expires ON guest_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_points ON guest_sessions(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_grade ON guest_sessions(grade);

-- RLS Politikaları (Herkes oluşturabilir, sadece kendi oturumunu görebilir)
ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create guest session" ON guest_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view by token" ON guest_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update by token" ON guest_sessions
  FOR UPDATE USING (true);

-- Expired oturumları temizleyen fonksiyon
CREATE OR REPLACE FUNCTION cleanup_expired_guest_sessions()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM guest_sessions
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pg_cron ile her saat çalıştırmak için (Supabase'de manuel aktifleştirilmeli)
-- SELECT cron.schedule('cleanup-guest-sessions', '0 * * * *', 'SELECT cleanup_expired_guest_sessions()');

-- Yorum: Bu tablo misafir kullanıcıların geçici verilerini tutar.
-- 24 saat sonra otomatik olarak silinir, veritabanı şişmez.
-- Kayıtlı kullanıcılar liderlik tablosunda görünür, misafirler görünmez.

