-- Bozuk LaTeX komutlarını (ightarrow, ext, rac, imes) düzeltme

-- 1. Hata tarama fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION scan_latex_errors(limit_val INT DEFAULT 5000)
RETURNS INT AS $$
DECLARE
  found_errors INT := 0;
BEGIN
  -- Mevcut: sqrt, begin, end, text hataları (Önceki migrationlardan)
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'sqrt_no_backslash', 'question_text', SUBSTRING(question_text FROM '(?<!\\)sqrt\{.{0,20}')
  FROM questions WHERE question_text ~ '(?<!\\)sqrt\{' LIMIT limit_val ON CONFLICT DO NOTHING;
  
  -- Yeni: ightarrow -> rightarrow
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'broken_rightarrow', 'question_text', SUBSTRING(question_text FROM '.{0,10}ightarrow.{0,10}')
  FROM questions WHERE question_text ~ 'ightarrow' AND question_text !~ '\\rightarrow' LIMIT limit_val ON CONFLICT DO NOTHING;

  -- Yeni: ext -> text (sadece kelime olarak ext geçiyorsa ve önünde \ yoksa)
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'broken_text', 'question_text', SUBSTRING(question_text FROM '.{0,10}[0-9] ext.{0,10}')
  FROM questions WHERE question_text ~ '[0-9] ext' LIMIT limit_val ON CONFLICT DO NOTHING;

  -- Yeni: rac -> frac
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'broken_frac', 'question_text', SUBSTRING(question_text FROM '.{0,10}rac.{0,10}')
  FROM questions WHERE question_text ~ 'rac[\{\(0-9]' AND question_text !~ 'frac' LIMIT limit_val ON CONFLICT DO NOTHING;

  -- Yeni: imes -> times
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'broken_times', 'question_text', SUBSTRING(question_text FROM '.{0,10}imes.{0,10}')
  FROM questions WHERE question_text ~ 'imes' AND question_text !~ 'times' AND question_text !~ '[a-z]imes' LIMIT limit_val ON CONFLICT DO NOTHING;

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
  broken_fixed INT := 0;
  total_processed INT := 0;
  affected_rows INT;
BEGIN
  -- Batch için ID'leri seç
  CREATE TEMP TABLE batch_questions AS
  SELECT id FROM questions ORDER BY id LIMIT limit_val OFFSET offset_val;

  GET DIAGNOSTICS total_processed = ROW_COUNT;

  -- 1. times düzeltmesi (Mevcut)
  UPDATE questions q
  SET question_text = REGEXP_REPLACE(question_text, '(\$[^$]*[^\\])times([^a-zA-Z])', '\1\\times\2', 'g')
  FROM batch_questions b
  WHERE q.id = b.id AND q.question_text ~ '\$[^$]*[^\\]times[^a-zA-Z]';
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  times_fixed := times_fixed + affected_rows;

  -- 2. sqrt düzeltmesi (Mevcut)
  UPDATE questions q
  SET question_text = REGEXP_REPLACE(question_text, '(?<!\\)sqrt\{', '\\sqrt{', 'g')
  FROM batch_questions b
  WHERE q.id = b.id AND q.question_text ~ '(?<!\\)sqrt\{';
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  sqrt_fixed := sqrt_fixed + affected_rows;

  -- 3. frac düzeltmesi (Mevcut)
  UPDATE questions q
  SET question_text = REGEXP_REPLACE(question_text, '(?<!\\)frac\{', '\\frac{', 'g')
  FROM batch_questions b
  WHERE q.id = b.id AND q.question_text ~ '(?<!\\)frac\{';
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  frac_fixed := frac_fixed + affected_rows;

  -- 4. Environment düzeltmeleri (Mevcut)
  UPDATE questions q
  SET question_text = REGEXP_REPLACE(
          REGEXP_REPLACE(question_text, '(?<!\\)begin\{', '\\begin{', 'g'),
          '(?<!\\)end\{', '\\end{', 'g')
  FROM batch_questions b
  WHERE q.id = b.id AND (q.question_text ~ '(?<!\\)begin\{' OR q.question_text ~ '(?<!\\)end\{');
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  env_fixed := env_fixed + affected_rows;

  -- 5. YENİ: Bozuk komut düzeltmeleri (ightarrow, ext, rac, imes)
  -- Bu düzeltmeleri güvenli hale getirmek için çok dikkatli regex kullanıyoruz
  UPDATE questions q
  SET question_text = REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(question_text, 
          'ightarrow', '\\rightarrow', 'g'),
          '([0-9])\s*ext', '\1 \\text', 'g'),
          '([a-z0-9])rac([\{\(0-9])', '\1\\frac\2', 'g'),
          '([0-9])imes([0-9])', '\1\\times\2', 'g')
  FROM batch_questions b
  WHERE q.id = b.id AND (
    q.question_text ~ 'ightarrow' OR 
    q.question_text ~ '[0-9] ext' OR
    q.question_text ~ '[a-z0-9]rac[\{\(0-9]' OR
    q.question_text ~ '[0-9]imes[0-9]'
  );
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  broken_fixed := broken_fixed + affected_rows;

  -- Explanation için de aynı düzeltmeler (Tek seferde tüm yeni düzeltmeler)
  UPDATE questions q
  SET explanation = REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(explanation, 
          'ightarrow', '\\rightarrow', 'g'),
          '([0-9])\s*ext', '\1 \\text', 'g'),
          '([a-z0-9])rac([\{\(0-9])', '\1\\frac\2', 'g'),
          '([0-9])imes([0-9])', '\1\\times\2', 'g')
  FROM batch_questions b
  WHERE q.id = b.id AND (
    q.explanation ~ 'ightarrow' OR 
    q.explanation ~ '[0-9] ext' OR
    q.explanation ~ '[a-z0-9]rac[\{\(0-9]' OR
    q.explanation ~ '[0-9]imes[0-9]'
  );

  DROP TABLE batch_questions;

  RETURN json_build_object(
    'processed', total_processed,
    'times_fixed', times_fixed,
    'sqrt_fixed', sqrt_fixed,
    'frac_fixed', frac_fixed,
    'env_fixed', env_fixed,
    'broken_fixed', broken_fixed
  );
END;
$$ LANGUAGE plpgsql;
