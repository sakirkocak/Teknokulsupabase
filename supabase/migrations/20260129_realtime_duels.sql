-- ============================================
-- CANLI DÜELLO SİSTEMİ - VERİTABANI GÜNCELLEMELERİ
-- ============================================

-- 1. Mevcut duels tablosuna yeni alanlar ekle
ALTER TABLE duels ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';
ALTER TABLE duels ADD COLUMN IF NOT EXISTS question_started_at timestamptz;
ALTER TABLE duels ADD COLUMN IF NOT EXISTS time_per_question int DEFAULT 30;
ALTER TABLE duels ADD COLUMN IF NOT EXISTS is_realtime boolean DEFAULT false;
ALTER TABLE duels ADD COLUMN IF NOT EXISTS game_mode varchar(20) DEFAULT 'classic'; -- classic, realtime, ghost

-- 2. Düello cevapları tablosu
CREATE TABLE IF NOT EXISTS duel_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id uuid REFERENCES duels(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
  question_index int NOT NULL,
  question_id uuid, -- Opsiyonel, soru referansı
  answer varchar(1), -- A, B, C, D veya NULL (süre doldu)
  is_correct boolean DEFAULT false,
  answered_at timestamptz DEFAULT now(),
  time_taken_ms int, -- Cevaplama süresi (milisaniye)
  points_earned int DEFAULT 0, -- Kazanılan puan
  streak_bonus int DEFAULT 0, -- Kombo bonusu
  created_at timestamptz DEFAULT now(),
  
  -- Her oyuncu her soruda sadece bir cevap verebilir
  UNIQUE(duel_id, student_id, question_index)
);

-- 3. Index'ler
CREATE INDEX IF NOT EXISTS idx_duel_answers_duel_id ON duel_answers(duel_id);
CREATE INDEX IF NOT EXISTS idx_duel_answers_student_id ON duel_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_duels_is_realtime ON duels(is_realtime) WHERE is_realtime = true;
CREATE INDEX IF NOT EXISTS idx_duels_game_mode ON duels(game_mode);

-- 4. RLS (Row Level Security) politikaları
ALTER TABLE duel_answers ENABLE ROW LEVEL SECURITY;

-- Mevcut policy'leri sil (varsa)
DROP POLICY IF EXISTS "Players can view their duel answers" ON duel_answers;
DROP POLICY IF EXISTS "Players can insert their answers" ON duel_answers;

-- Oyuncular kendi düellolarının cevaplarını görebilir
CREATE POLICY "Players can view their duel answers" ON duel_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM duels d
      JOIN student_profiles sp ON (sp.id = d.challenger_id OR sp.id = d.opponent_id)
      WHERE d.id = duel_answers.duel_id
      AND sp.user_id = auth.uid()
    )
  );

-- Oyuncular kendi cevaplarını ekleyebilir
CREATE POLICY "Players can insert their answers" ON duel_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.id = duel_answers.student_id
      AND sp.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM duels d
      JOIN student_profiles sp ON (sp.id = d.challenger_id OR sp.id = d.opponent_id)
      WHERE d.id = duel_answers.duel_id
      AND d.status = 'active'
      AND sp.user_id = auth.uid()
    )
  );

-- 5. Hayalet kayıtları tablosu (Plan 3 için hazırlık)
CREATE TABLE IF NOT EXISTS ghost_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES student_profiles(id) ON DELETE SET NULL,
  student_name varchar(100) NOT NULL, -- Anonim için
  grade int NOT NULL,
  subject varchar(50),
  questions jsonb NOT NULL DEFAULT '[]', -- Soru ID'leri
  answers jsonb NOT NULL DEFAULT '[]', -- [{question_index, answer, time_ms, is_correct}]
  total_score int DEFAULT 0,
  total_time_ms int DEFAULT 0,
  difficulty_avg float DEFAULT 0, -- Ortalama zorluk (matchmaking için)
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ghost_records_grade ON ghost_records(grade);
CREATE INDEX IF NOT EXISTS idx_ghost_records_subject ON ghost_records(subject);
CREATE INDEX IF NOT EXISTS idx_ghost_records_score ON ghost_records(total_score);

-- 6. Düello tamamlandığında otomatik hayalet kaydı oluştur (trigger)
CREATE OR REPLACE FUNCTION create_ghost_record_on_duel_complete()
RETURNS TRIGGER AS $$
DECLARE
  challenger_name text;
  opponent_name text;
  challenger_answers jsonb;
  opponent_answers jsonb;
BEGIN
  -- Sadece realtime düellolar için hayalet kaydı oluştur
  IF NEW.status = 'completed' AND NEW.is_realtime = true AND OLD.status != 'completed' THEN
    -- Challenger bilgilerini al
    SELECT p.full_name INTO challenger_name
    FROM student_profiles sp
    JOIN profiles p ON sp.user_id = p.id
    WHERE sp.id = NEW.challenger_id;
    
    -- Challenger cevaplarını al
    SELECT jsonb_agg(
      jsonb_build_object(
        'question_index', da.question_index,
        'answer', da.answer,
        'time_ms', da.time_taken_ms,
        'is_correct', da.is_correct
      ) ORDER BY da.question_index
    ) INTO challenger_answers
    FROM duel_answers da
    WHERE da.duel_id = NEW.id AND da.student_id = NEW.challenger_id;
    
    -- Challenger için hayalet kaydı
    IF challenger_answers IS NOT NULL THEN
      INSERT INTO ghost_records (student_id, student_name, grade, subject, questions, answers, total_score)
      VALUES (
        NEW.challenger_id,
        COALESCE(challenger_name, 'Anonim'),
        COALESCE((SELECT grade FROM student_profiles WHERE id = NEW.challenger_id), 8),
        NEW.subject,
        NEW.questions,
        challenger_answers,
        NEW.challenger_score
      );
    END IF;
    
    -- Opponent bilgilerini al
    SELECT p.full_name INTO opponent_name
    FROM student_profiles sp
    JOIN profiles p ON sp.user_id = p.id
    WHERE sp.id = NEW.opponent_id;
    
    -- Opponent cevaplarını al
    SELECT jsonb_agg(
      jsonb_build_object(
        'question_index', da.question_index,
        'answer', da.answer,
        'time_ms', da.time_taken_ms,
        'is_correct', da.is_correct
      ) ORDER BY da.question_index
    ) INTO opponent_answers
    FROM duel_answers da
    WHERE da.duel_id = NEW.id AND da.student_id = NEW.opponent_id;
    
    -- Opponent için hayalet kaydı
    IF opponent_answers IS NOT NULL THEN
      INSERT INTO ghost_records (student_id, student_name, grade, subject, questions, answers, total_score)
      VALUES (
        NEW.opponent_id,
        COALESCE(opponent_name, 'Anonim'),
        COALESCE((SELECT grade FROM student_profiles WHERE id = NEW.opponent_id), 8),
        NEW.subject,
        NEW.questions,
        opponent_answers,
        NEW.opponent_score
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
DROP TRIGGER IF EXISTS on_duel_complete_create_ghost ON duels;
CREATE TRIGGER on_duel_complete_create_ghost
  AFTER UPDATE ON duels
  FOR EACH ROW
  EXECUTE FUNCTION create_ghost_record_on_duel_complete();

-- 7. Realtime için Supabase broadcast'i etkinleştir
-- (Bu Supabase Dashboard'dan yapılmalı - realtime.messages tablosu için)

COMMENT ON TABLE duel_answers IS 'Canlı düello sırasında verilen cevapları saklar';
COMMENT ON TABLE ghost_records IS 'Tamamlanmış düellolardan oluşturulan hayalet kayıtları (Ghost Match için)';

