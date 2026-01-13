-- Latex düzeltme sistemini genişletme: begin, end, text, left, right komutları

-- 1. Hata tarama fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION scan_latex_errors(limit_val INT DEFAULT 5000)
RETURNS INT AS $$
DECLARE
  found_errors INT := 0;
BEGIN
  -- Mevcut: sqrt hataları
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'sqrt_no_backslash', 'question_text', SUBSTRING(question_text FROM '(?<!\\)sqrt\{.{0,20}')
  FROM questions WHERE question_text ~ '(?<!\\)sqrt\{' LIMIT limit_val ON CONFLICT DO NOTHING;
  
  -- Yeni: begin hataları (örn: begin{cases})
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'begin_no_backslash', 'question_text', SUBSTRING(question_text FROM '(?<!\\)begin\{.{0,20}')
  FROM questions WHERE question_text ~ '(?<!\\)begin\{' LIMIT limit_val ON CONFLICT DO NOTHING;

  -- Yeni: end hataları (örn: end{cases})
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'end_no_backslash', 'question_text', SUBSTRING(question_text FROM '(?<!\\)end\{.{0,20}')
  FROM questions WHERE question_text ~ '(?<!\\)end\{' LIMIT limit_val ON CONFLICT DO NOTHING;

  -- Yeni: text hataları (örn: text{ cm})
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'text_no_backslash', 'question_text', SUBSTRING(question_text FROM '(?<!\\)text\{.{0,20}')
  FROM questions WHERE question_text ~ '(?<!\\)text\{' LIMIT limit_val ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS found_errors = ROW_COUNT;
  RETURN found_errors;
END;
$$ LANGUAGE plpgsql;

-- 2. Batch düzeltme fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION smart_fix_latex_batch(limit_val INT DEFAULT 1000, offset_val INT DEFAULT 0)
RETURNS JSON AS $$
DECLARE
  times_fixed INT := 0;
  sqrt_fixed INT := 0;
  frac_fixed INT := 0;
  env_fixed INT := 0;
  total_processed INT := 0;
  affected_rows INT;
BEGIN
  -- Batch için ID'leri seç
  CREATE TEMP TABLE batch_questions AS
  SELECT id FROM questions ORDER BY id LIMIT limit_val OFFSET offset_val;

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

  -- 4. Environment düzeltmeleri (begin, end, text, left, right)
  UPDATE questions q
  SET question_text = REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(question_text, 
            '(?<!\\)begin\{', '\\begin{', 'g'),
            '(?<!\\)end\{', '\\end{', 'g'),
            '(?<!\\)text\{', '\\text{', 'g'),
            '(?<!\\)left\{', '\\left{', 'g'),
            '(?<!\\)right\}', '\\right}', 'g')
  FROM batch_questions b
  WHERE q.id = b.id AND (
    q.question_text ~ '(?<!\\)begin\{' OR 
    q.question_text ~ '(?<!\\)end\{' OR 
    q.question_text ~ '(?<!\\)text\{'
  );
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  env_fixed := env_fixed + affected_rows;

  -- Explanation için de aynı düzeltmeler (Basitleştirilmiş tek update)
  UPDATE questions q
  SET explanation = REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(explanation,
                '(?<!\\)sqrt\{', '\\sqrt{', 'g'),
                '(?<!\\)frac\{', '\\frac{', 'g'),
                '(?<!\\)begin\{', '\\begin{', 'g'),
                '(?<!\\)end\{', '\\end{', 'g'),
                '(?<!\\)text\{', '\\text{', 'g'),
                '(?<!\\)left\{', '\\left{', 'g'),
                '(?<!\\)right\}', '\\right}', 'g')
  FROM batch_questions b
  WHERE q.id = b.id AND (
    q.explanation ~ '(?<!\\)(sqrt|frac|begin|end|text)\{'
  );

  DROP TABLE batch_questions;

  RETURN json_build_object(
    'processed', total_processed,
    'times_fixed', times_fixed,
    'sqrt_fixed', sqrt_fixed,
    'frac_fixed', frac_fixed,
    'env_fixed', env_fixed
  );
END;
$$ LANGUAGE plpgsql;
