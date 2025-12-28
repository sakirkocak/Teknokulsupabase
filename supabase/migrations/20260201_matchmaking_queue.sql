-- ============================================
-- MATCHMAKING QUEUE - Rastgele Rakip Bulma
-- ============================================

-- 1. Matchmaking Queue Tablosu
CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
  grade int NOT NULL,
  total_points int DEFAULT 0,
  preferred_subject varchar(50),          -- null = Karışık
  status varchar(20) DEFAULT 'waiting',   -- waiting, matched, cancelled, expired
  matched_with uuid REFERENCES student_profiles(id),
  duel_id uuid REFERENCES duels(id),
  search_range int DEFAULT 300,           -- Başlangıç puan aralığı
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '2 minutes')
);

-- 2. Indexler (performans için)
CREATE INDEX IF NOT EXISTS idx_matchmaking_status ON matchmaking_queue(status);
CREATE INDEX IF NOT EXISTS idx_matchmaking_grade ON matchmaking_queue(grade) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_matchmaking_points ON matchmaking_queue(total_points) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_matchmaking_student ON matchmaking_queue(student_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_expires ON matchmaking_queue(expires_at);

-- 3. Unique constraint - Aynı öğrenci aynı anda sadece bir kez bekleyebilir
CREATE UNIQUE INDEX IF NOT EXISTS idx_matchmaking_unique_waiting 
  ON matchmaking_queue(student_id) WHERE status = 'waiting';

-- 4. RLS Policies
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Mevcut policies temizle
DROP POLICY IF EXISTS "Service role full access matchmaking" ON matchmaking_queue;
DROP POLICY IF EXISTS "Students view own queue" ON matchmaking_queue;
DROP POLICY IF EXISTS "Students view waiting players" ON matchmaking_queue;
DROP POLICY IF EXISTS "Students can join queue" ON matchmaking_queue;
DROP POLICY IF EXISTS "Students can update own" ON matchmaking_queue;
DROP POLICY IF EXISTS "Students can delete own" ON matchmaking_queue;

-- Service role tam erişim (API routes için)
CREATE POLICY "Service role full access matchmaking" ON matchmaking_queue
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Öğrenciler bekleyen oyuncuları görebilir (eşleştirme için)
CREATE POLICY "Students view waiting players" ON matchmaking_queue
  FOR SELECT
  USING (status = 'waiting');

-- Öğrenciler kuyruğa katılabilir
CREATE POLICY "Students can join queue" ON matchmaking_queue
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() AND sp.id = student_id
    )
  );

-- Öğrenciler kendi kaydını güncelleyebilir (iptal için)
CREATE POLICY "Students can update own" ON matchmaking_queue
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() AND sp.id = student_id
    )
  );

-- Öğrenciler kendi kaydını silebilir
CREATE POLICY "Students can delete own" ON matchmaking_queue
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() AND sp.id = student_id
    )
  );

-- 5. Otomatik temizlik fonksiyonu
CREATE OR REPLACE FUNCTION cleanup_expired_matchmaking()
RETURNS void AS $$
BEGIN
  -- Süresi dolmuş bekleyenleri expired yap
  UPDATE matchmaking_queue 
  SET status = 'expired'
  WHERE status = 'waiting' 
  AND expires_at < now();
  
  -- 10 dakikadan eski kayıtları sil
  DELETE FROM matchmaking_queue 
  WHERE created_at < now() - interval '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- 6. Eşleştirme yapıldığında düello oluştur
CREATE OR REPLACE FUNCTION create_duel_from_match(
  p_player1_id uuid,
  p_player2_id uuid,
  p_subject varchar(50) DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_duel_id uuid;
BEGIN
  -- Yeni düello oluştur
  INSERT INTO duels (
    challenger_id,
    opponent_id,
    subject,
    question_count,
    status,
    is_realtime
  ) VALUES (
    p_player1_id,
    p_player2_id,
    p_subject,
    5,
    'active',
    true
  ) RETURNING id INTO v_duel_id;
  
  -- Her iki oyuncunun kuyruk kaydını güncelle
  UPDATE matchmaking_queue
  SET status = 'matched',
      matched_with = CASE 
        WHEN student_id = p_player1_id THEN p_player2_id 
        ELSE p_player1_id 
      END,
      duel_id = v_duel_id
  WHERE student_id IN (p_player1_id, p_player2_id)
  AND status = 'waiting';
  
  RETURN v_duel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Realtime için tablo yayını
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'matchmaking_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE matchmaking_queue;
  END IF;
END $$;

COMMENT ON TABLE matchmaking_queue IS 'Rastgele düello eşleştirme kuyruğu';
COMMENT ON FUNCTION create_duel_from_match IS 'İki oyuncuyu eşleştirip düello oluşturur';

