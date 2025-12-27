-- =====================================================
-- DÜELLO SİSTEMİ RLS POLİCİES
-- 10K+ kullanıcı için güvenlik ve performans
-- =====================================================

-- =====================================================
-- 1. DUELS TABLOSU RLS
-- =====================================================

-- RLS'yi etkinleştir
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;

-- Mevcut policies'leri temizle
DROP POLICY IF EXISTS "Players can view own duels" ON duels;
DROP POLICY IF EXISTS "Players can create duels" ON duels;
DROP POLICY IF EXISTS "Players can update own duels" ON duels;
DROP POLICY IF EXISTS "Players can delete own duels" ON duels;
DROP POLICY IF EXISTS "Service role full access duels" ON duels;

-- Service role tam erişim (API routes için)
CREATE POLICY "Service role full access duels" ON duels
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Oyuncular kendi düellolarını görebilir
CREATE POLICY "Players can view own duels" ON duels
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() 
      AND (sp.id = duels.challenger_id OR sp.id = duels.opponent_id)
    )
  );

-- Oyuncular düello oluşturabilir (challenger olarak)
CREATE POLICY "Players can create duels" ON duels
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() 
      AND sp.id = challenger_id
    )
  );

-- Oyuncular kendi düellolarını güncelleyebilir
CREATE POLICY "Players can update own duels" ON duels
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() 
      AND (sp.id = duels.challenger_id OR sp.id = duels.opponent_id)
    )
  );

-- Oyuncular kendi düellolarını silebilir
CREATE POLICY "Players can delete own duels" ON duels
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() 
      AND (sp.id = duels.challenger_id OR sp.id = duels.opponent_id)
    )
  );

-- =====================================================
-- 2. DUEL_ANSWERS TABLOSU RLS
-- =====================================================

-- RLS'yi etkinleştir (zaten etkin olabilir)
ALTER TABLE duel_answers ENABLE ROW LEVEL SECURITY;

-- Mevcut policies'leri temizle
DROP POLICY IF EXISTS "Players can insert answers" ON duel_answers;
DROP POLICY IF EXISTS "Players can view duel answers" ON duel_answers;
DROP POLICY IF EXISTS "Service role full access duel_answers" ON duel_answers;
DROP POLICY IF EXISTS "Players can view their duel answers" ON duel_answers;
DROP POLICY IF EXISTS "Players can insert their answers" ON duel_answers;

-- Service role tam erişim
CREATE POLICY "Service role full access duel_answers" ON duel_answers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Oyuncular kendi cevaplarını ekleyebilir (student_id kolonu kullanılıyor)
CREATE POLICY "Players can insert answers" ON duel_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() 
      AND sp.id = student_id
    )
  );

-- Oyuncular düellodaki cevapları görebilir
CREATE POLICY "Players can view duel answers" ON duel_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM duels d 
      JOIN student_profiles sp ON sp.user_id = auth.uid()
      WHERE d.id = duel_answers.duel_id 
      AND (sp.id = d.challenger_id OR sp.id = d.opponent_id)
    )
  );

-- =====================================================
-- 3. PERFORMANS İNDEXLERİ
-- =====================================================

-- Düello sorguları için index
CREATE INDEX IF NOT EXISTS idx_duels_challenger ON duels(challenger_id);
CREATE INDEX IF NOT EXISTS idx_duels_opponent ON duels(opponent_id);
CREATE INDEX IF NOT EXISTS idx_duels_status ON duels(status);
CREATE INDEX IF NOT EXISTS idx_duels_created ON duels(created_at DESC);

-- Düello cevapları için index
CREATE INDEX IF NOT EXISTS idx_duel_answers_duel ON duel_answers(duel_id);
CREATE INDEX IF NOT EXISTS idx_duel_answers_student ON duel_answers(student_id);

-- Composite index (sık kullanılan sorgu)
CREATE INDEX IF NOT EXISTS idx_duels_player_status ON duels(challenger_id, status);
CREATE INDEX IF NOT EXISTS idx_duels_opponent_status ON duels(opponent_id, status);

-- =====================================================
-- 4. REALTIME YAYIN AYARLARI
-- =====================================================

-- Duels tablosu için realtime yayın
ALTER PUBLICATION supabase_realtime ADD TABLE duels;

-- duel_answers için realtime (opsiyonel, broadcast tercih edilir)
-- ALTER PUBLICATION supabase_realtime ADD TABLE duel_answers;

-- =====================================================
-- 5. RATE LIMITING FUNCTION (Spam Koruması)
-- =====================================================

-- Günlük düello limiti kontrolü
CREATE OR REPLACE FUNCTION check_daily_duel_limit()
RETURNS TRIGGER AS $$
DECLARE
  daily_count INTEGER;
  max_duels INTEGER := 50; -- Günlük maksimum düello
BEGIN
  SELECT COUNT(*) INTO daily_count
  FROM duels
  WHERE challenger_id = NEW.challenger_id
  AND created_at > NOW() - INTERVAL '24 hours';
  
  IF daily_count >= max_duels THEN
    RAISE EXCEPTION 'Günlük düello limitine ulaştınız (%). Yarın tekrar deneyin.', max_duels;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
DROP TRIGGER IF EXISTS enforce_daily_duel_limit ON duels;
CREATE TRIGGER enforce_daily_duel_limit
  BEFORE INSERT ON duels
  FOR EACH ROW
  EXECUTE FUNCTION check_daily_duel_limit();

-- =====================================================
-- 6. OTOMATİK TEMİZLİK (Eski Düellolar)
-- =====================================================

-- 7 günden eski pending düelloları sil
CREATE OR REPLACE FUNCTION cleanup_old_duels()
RETURNS void AS $$
BEGIN
  DELETE FROM duels 
  WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '7 days';
  
  -- 30 günden eski tamamlanmış düelloların detaylı verilerini temizle
  UPDATE duels 
  SET questions = '[]', correct_answers = '[]'
  WHERE status IN ('completed', 'abandoned')
  AND created_at < NOW() - INTERVAL '30 days'
  AND questions != '[]';
END;
$$ LANGUAGE plpgsql;

-- Not: Bu fonksiyon Supabase cron job ile çağrılabilir
-- SELECT cron.schedule('cleanup-old-duels', '0 3 * * *', 'SELECT cleanup_old_duels()');

