-- ============================================
-- DÜELLO LOBİSİ - Oyuncuların Birbirini Görebildiği Sistem
-- ============================================

-- 1. Duel Lobby Tablosu
CREATE TABLE IF NOT EXISTS duel_lobby (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  grade int NOT NULL,
  total_points int DEFAULT 0,
  preferred_subject varchar(50),          -- null = Karışık, herhangi bir ders
  status varchar(20) DEFAULT 'available', -- available, busy (istek göndermiş/almış), in_duel
  joined_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now()
);

-- 2. Indexler (performans için)
CREATE INDEX IF NOT EXISTS idx_lobby_grade ON duel_lobby(grade);
CREATE INDEX IF NOT EXISTS idx_lobby_status ON duel_lobby(status);
CREATE INDEX IF NOT EXISTS idx_lobby_last_seen ON duel_lobby(last_seen);
CREATE INDEX IF NOT EXISTS idx_lobby_subject ON duel_lobby(preferred_subject);

-- 3. RLS Policies
ALTER TABLE duel_lobby ENABLE ROW LEVEL SECURITY;

-- Mevcut policies temizle (varsa)
DROP POLICY IF EXISTS "Anyone can view lobby" ON duel_lobby;
DROP POLICY IF EXISTS "Users manage own entry" ON duel_lobby;
DROP POLICY IF EXISTS "Service role full access lobby" ON duel_lobby;

-- Service role tam erişim (API routes için)
CREATE POLICY "Service role full access lobby" ON duel_lobby
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Herkes lobiyi görebilir (available olanları)
CREATE POLICY "Anyone can view lobby" ON duel_lobby
  FOR SELECT
  USING (true);

-- Kullanıcılar kendi kaydını yönetebilir
CREATE POLICY "Users can insert own" ON duel_lobby
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() AND sp.id = student_id
    )
  );

CREATE POLICY "Users can update own" ON duel_lobby
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() AND sp.id = student_id
    )
  );

CREATE POLICY "Users can delete own" ON duel_lobby
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() AND sp.id = student_id
    )
  );

-- 4. Otomatik temizlik fonksiyonu (5 dakika aktif olmayan çıksın)
CREATE OR REPLACE FUNCTION cleanup_inactive_lobby()
RETURNS void AS $$
BEGIN
  DELETE FROM duel_lobby 
  WHERE last_seen < now() - interval '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- 5. Last seen güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_lobby_last_seen(p_student_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE duel_lobby
  SET last_seen = now()
  WHERE student_id = p_student_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Lobiden düello oluşturma fonksiyonu (atomik)
CREATE OR REPLACE FUNCTION create_duel_from_lobby(
  p_challenger_id uuid,
  p_opponent_id uuid,
  p_subject varchar(50) DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_duel_id uuid;
BEGIN
  -- Her iki oyuncunun da lobide olduğunu kontrol et
  IF NOT EXISTS (SELECT 1 FROM duel_lobby WHERE student_id = p_challenger_id) THEN
    RAISE EXCEPTION 'Challenger is not in lobby';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM duel_lobby WHERE student_id = p_opponent_id) THEN
    RAISE EXCEPTION 'Opponent is not in lobby';
  END IF;
  
  -- Yeni düello oluştur
  INSERT INTO duels (
    challenger_id,
    opponent_id,
    subject,
    question_count,
    status,
    is_realtime
  ) VALUES (
    p_challenger_id,
    p_opponent_id,
    p_subject,
    5,
    'pending',
    true
  ) RETURNING id INTO v_duel_id;
  
  -- Her iki oyuncuyu lobiden çıkar
  DELETE FROM duel_lobby WHERE student_id IN (p_challenger_id, p_opponent_id);
  
  RETURN v_duel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Realtime için tablo yayını
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'duel_lobby'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE duel_lobby;
  END IF;
END $$;

COMMENT ON TABLE duel_lobby IS 'Düello lobisi - aktif oyuncuların birbirini gördüğü alan';
COMMENT ON FUNCTION create_duel_from_lobby IS 'Lobideki iki oyuncudan düello oluşturur ve lobiden çıkarır';
