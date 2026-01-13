-- Otomatik Hata Tespiti ve Performans İyileştirmeleri

-- 1. pg_trgm extension (Metin araması için)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Trigram indexler (Regex aramaları çok hızlandırır)
CREATE INDEX IF NOT EXISTS idx_questions_text_trgm ON questions USING GIN (question_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_questions_expl_trgm ON questions USING GIN (explanation gin_trgm_ops);

-- 3. Otomatik Hata Tespiti Trigger'ı
-- Yeni soru eklendiğinde veya güncellendiğinde otomatik kontrol yapar
CREATE OR REPLACE FUNCTION check_latex_on_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Sadece ilgili alanlar değiştiyse kontrol et
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (NEW.question_text <> OLD.question_text OR NEW.explanation <> OLD.explanation)) THEN
     
    -- sqrt hatası kontrolü
    IF NEW.question_text ~ '(?<!\\)sqrt\{' OR NEW.explanation ~ '(?<!\\)sqrt\{' THEN
      INSERT INTO latex_errors (question_id, error_type, field, error_sample)
      VALUES (NEW.id, 'sqrt_no_backslash', 'question_text', SUBSTRING(NEW.question_text FROM '(?<!\\)sqrt\{.{0,20}'))
      ON CONFLICT (question_id, error_type, field) 
      DO UPDATE SET detected_at = NOW(), fixed_at = NULL;
    END IF;

    -- frac hatası kontrolü
    IF NEW.question_text ~ '(?<!\\)frac\{' OR NEW.explanation ~ '(?<!\\)frac\{' THEN
      INSERT INTO latex_errors (question_id, error_type, field, error_sample)
      VALUES (NEW.id, 'frac_no_backslash', 'question_text', SUBSTRING(NEW.question_text FROM '(?<!\\)frac\{.{0,20}'))
      ON CONFLICT (question_id, error_type, field) 
      DO UPDATE SET detected_at = NOW(), fixed_at = NULL;
    END IF;
    
    -- times hatası kontrolü
    IF NEW.question_text ~ '\$[^$]*[^\\]times[^a-zA-Z]' OR NEW.explanation ~ '\$[^$]*[^\\]times[^a-zA-Z]' THEN
      INSERT INTO latex_errors (question_id, error_type, field, error_sample)
      VALUES (NEW.id, 'times_no_backslash', 'question_text', SUBSTRING(NEW.question_text FROM '\$[^$]*[^\\]times[^a-zA-Z].{0,10}'))
      ON CONFLICT (question_id, error_type, field) 
      DO UPDATE SET detected_at = NOW(), fixed_at = NULL;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı oluştur
DROP TRIGGER IF EXISTS trg_check_latex ON questions;
CREATE TRIGGER trg_check_latex
AFTER INSERT OR UPDATE ON questions
FOR EACH ROW EXECUTE FUNCTION check_latex_on_change();
