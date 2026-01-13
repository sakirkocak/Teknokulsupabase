-- Latex düzeltme sistemi için gerekli tablolar ve fonksiyonlar

-- 1. Hata takip tablosu
CREATE TABLE IF NOT EXISTS latex_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL, -- 'sqrt', 'frac', 'times', 'greek', 'unicode'
  error_sample TEXT,
  field TEXT NOT NULL, -- 'question_text', 'explanation', 'options'
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  fixed_at TIMESTAMPTZ,
  UNIQUE(question_id, error_type, field)
);

CREATE INDEX IF NOT EXISTS idx_latex_errors_unfixed ON latex_errors(error_type) WHERE fixed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_latex_errors_question_id ON latex_errors(question_id);

-- 2. Batch düzeltme fonksiyonu (Timeout sorununu aşmak için)
CREATE OR REPLACE FUNCTION fix_latex_batch(batch_size INT DEFAULT 1000)
RETURNS JSON AS $$
DECLARE
  fixed_count INT := 0;
  processed_ids UUID[];
BEGIN
  -- 1. sqrt düzeltmesi: [sayı/harf]sqrt{ -> [sayı/harf]\sqrt{
  WITH updated AS (
    UPDATE questions 
    SET question_text = REGEXP_REPLACE(question_text, '(?<!\\)sqrt\{', '\\sqrt{', 'g')
    WHERE id IN (
      SELECT id FROM questions 
      WHERE question_text ~ '(?<!\\)sqrt\{'
      LIMIT batch_size
    )
    RETURNING id
  )
  SELECT array_agg(id) INTO processed_ids FROM updated;
  
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  
  -- Explanation için sqrt
  UPDATE questions 
  SET explanation = REGEXP_REPLACE(explanation, '(?<!\\)sqrt\{', '\\sqrt{', 'g')
  WHERE explanation ~ '(?<!\\)sqrt\{'
  AND id IN (SELECT id FROM questions LIMIT batch_size); -- Basit limit, gerçek batching uygulama tarafında id bazlı olacak

  -- Bu fonksiyonu basit tutuyoruz, asıl karmaşık mantığı 'smart_fix_latex' zaten yapıyor.
  -- Ancak smart_fix_latex tüm tabloyu taradığı için timeout yiyor.
  -- Batch mantığını smart_fix_latex'e entegre edelim.
  
  RETURN json_build_object('fixed', fixed_count, 'processed_ids', processed_ids);
END;
$$ LANGUAGE plpgsql;

-- 3. Akıllı düzeltme fonksiyonunun Batch destekli versiyonu
CREATE OR REPLACE FUNCTION smart_fix_latex_batch(limit_val INT DEFAULT 1000, offset_val INT DEFAULT 0)
RETURNS JSON AS $$
DECLARE
  times_fixed INT := 0;
  sqrt_fixed INT := 0;
  frac_fixed INT := 0;
  total_processed INT := 0;
  affected_rows INT;
BEGIN
  -- Batch için ID'leri seç
  CREATE TEMP TABLE batch_questions AS
  SELECT id FROM questions 
  ORDER BY id
  LIMIT limit_val OFFSET offset_val;

  GET DIAGNOSTICS total_processed = ROW_COUNT;

  -- 1. times düzeltmesi
  UPDATE questions q
  SET question_text = REGEXP_REPLACE(question_text, '(\$[^$]*[^\\])times([^a-zA-Z])', '\1\\times\2', 'g')
  FROM batch_questions b
  WHERE q.id = b.id AND q.question_text ~ '\$[^$]*[^\\]times[^a-zA-Z]';
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  times_fixed := times_fixed + affected_rows;

  -- 2. sqrt düzeltmesi
  UPDATE questions q
  SET question_text = REGEXP_REPLACE(question_text, '(?<!\\)sqrt\{', '\\sqrt{', 'g')
  FROM batch_questions b
  WHERE q.id = b.id AND q.question_text ~ '(?<!\\)sqrt\{';
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  sqrt_fixed := sqrt_fixed + affected_rows;

  -- 3. frac düzeltmesi
  UPDATE questions q
  SET question_text = REGEXP_REPLACE(question_text, '(?<!\\)frac\{', '\\frac{', 'g')
  FROM batch_questions b
  WHERE q.id = b.id AND q.question_text ~ '(?<!\\)frac\{';
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  frac_fixed := frac_fixed + affected_rows;

  -- Geçici tabloyu temizle
  DROP TABLE batch_questions;

  RETURN json_build_object(
    'processed', total_processed,
    'times_fixed', times_fixed,
    'sqrt_fixed', sqrt_fixed,
    'frac_fixed', frac_fixed
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Hata tarama fonksiyonu (latex_errors tablosunu doldurur)
CREATE OR REPLACE FUNCTION scan_latex_errors(limit_val INT DEFAULT 5000)
RETURNS INT AS $$
DECLARE
  found_errors INT := 0;
BEGIN
  -- Soru metnindeki sqrt hataları
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT 
    id, 
    'sqrt_no_backslash', 
    'question_text',
    SUBSTRING(question_text FROM '(?<!\\)sqrt\{.{0,20}')
  FROM questions
  WHERE question_text ~ '(?<!\\)sqrt\{'
  LIMIT limit_val
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS found_errors = ROW_COUNT;
  
  RETURN found_errors;
END;
$$ LANGUAGE plpgsql;
