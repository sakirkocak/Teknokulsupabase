-- =====================================================
-- SORU ÇÖZÜM SAYISI DENORMALİZASYONU
-- Her soruda COUNT(*) yapmak yerine, solve_count kolonunda tutulur
-- =====================================================

-- 1. solve_count kolonu ekle
ALTER TABLE questions ADD COLUMN IF NOT EXISTS solve_count INTEGER DEFAULT 0;

-- 2. Mevcut çözüm sayılarını hesapla ve güncelle
UPDATE questions q
SET solve_count = COALESCE(
    (SELECT COUNT(*) FROM point_history ph WHERE ph.question_id = q.id),
    0
);

-- 3. Trigger fonksiyonu - point_history'e INSERT yapıldığında çalışır
CREATE OR REPLACE FUNCTION increment_question_solve_count()
RETURNS TRIGGER AS $$
BEGIN
    -- question_id varsa solve_count'u artır
    IF NEW.question_id IS NOT NULL THEN
        UPDATE questions 
        SET solve_count = COALESCE(solve_count, 0) + 1 
        WHERE id = NEW.question_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger oluştur
DROP TRIGGER IF EXISTS trg_increment_solve_count ON point_history;
CREATE TRIGGER trg_increment_solve_count
AFTER INSERT ON point_history
FOR EACH ROW
EXECUTE FUNCTION increment_question_solve_count();

-- 5. Index ekle (sık çözülen soruları bulmak için)
CREATE INDEX IF NOT EXISTS idx_questions_solve_count ON questions(solve_count DESC);

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION increment_question_solve_count() TO authenticated;

