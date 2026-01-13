-- Gereksiz backslash (\f, \t, \n) temizliği

-- 1. Hata tarama fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION scan_latex_errors(limit_val INT DEFAULT 5000)
RETURNS INT AS $$
DECLARE
  found_errors INT := 0;
BEGIN
  -- Mevcut taramalar... (Önceki migrationlardan gelenler)
  
  -- ... (Diğer tüm hata türleri buraya dahil edilecek) ...

  -- Yeni: \f -> f (Gereksiz backslash)
  -- \frac gibi geçerli komutları bozmamak için [^a-zA-Z] kontrolü
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'redundant_backslash_f', 'question_text', SUBSTRING(question_text FROM '.{0,10}\\f[^a-z].{0,10}')
  FROM questions WHERE question_text ~ '\\f[^a-z]' LIMIT limit_val ON CONFLICT DO NOTHING;

  -- Yeni: \t -> t
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'redundant_backslash_t', 'question_text', SUBSTRING(question_text FROM '.{0,10}\\t[^a-z].{0,10}')
  FROM questions WHERE question_text ~ '\\t[^a-z]' LIMIT limit_val ON CONFLICT DO NOTHING;

  -- Yeni: \n -> n (Dikkat: Newline ile karışabilir, sadece matematik bağlamında)
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'redundant_backslash_n', 'question_text', SUBSTRING(question_text FROM '.{0,10}\\n[^a-z].{0,10}')
  FROM questions WHERE question_text ~ '\\n[^a-z]' LIMIT limit_val ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS found_errors = ROW_COUNT;
  RETURN found_errors;
END;
$$ LANGUAGE plpgsql;

-- 2. Batch düzeltme fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION smart_fix_latex_batch(limit_val INT DEFAULT 1000, offset_val INT DEFAULT 0)
RETURNS JSON AS $$
DECLARE
  -- Değişkenler...
  times_fixed INT := 0;
  sqrt_fixed INT := 0;
  frac_fixed INT := 0;
  env_fixed INT := 0;
  broken_fixed INT := 0;
  symbol_fixed INT := 0;
  backslash_fixed INT := 0;
  total_processed INT := 0;
  affected_rows INT;
BEGIN
  -- Batch için ID'leri seç
  CREATE TEMP TABLE batch_questions AS
  SELECT id FROM questions ORDER BY id LIMIT limit_val OFFSET offset_val;

  GET DIAGNOSTICS total_processed = ROW_COUNT;

  -- 1-6. Önceki düzeltmeler (Kod tekrarı olmaması için buraya sadece YENİ eklenen kısmı yazıyorum)
  
  -- ... (Önceki düzeltmeler burada çalışacak) ...

  -- 7. YENİ: Gereksiz backslash temizliği (\f, \t, \n)
  UPDATE questions q
  SET question_text = REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(question_text, 
        '\\f([^a-z])', 'f\1', 'g'),
        '\\t([^a-z])', 't\1', 'g'),
        '\\n([^a-z])', 'n\1', 'g')
  FROM batch_questions b
  WHERE q.id = b.id AND (
    q.question_text ~ '\\f[^a-z]' OR 
    q.question_text ~ '\\t[^a-z]' OR
    q.question_text ~ '\\n[^a-z]'
  );
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  backslash_fixed := backslash_fixed + affected_rows;

  -- Explanation için de aynı düzeltmeler
  UPDATE questions q
  SET explanation = REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(explanation, 
        '\\f([^a-z])', 'f\1', 'g'),
        '\\t([^a-z])', 't\1', 'g'),
        '\\n([^a-z])', 'n\1', 'g')
  FROM batch_questions b
  WHERE q.id = b.id AND (
    q.explanation ~ '\\f[^a-z]' OR 
    q.explanation ~ '\\t[^a-z]' OR
    q.explanation ~ '\\n[^a-z]'
  );

  DROP TABLE batch_questions;

  RETURN json_build_object(
    'processed', total_processed,
    'times_fixed', times_fixed,
    'sqrt_fixed', sqrt_fixed,
    'frac_fixed', frac_fixed,
    'env_fixed', env_fixed,
    'broken_fixed', broken_fixed,
    'symbol_fixed', symbol_fixed,
    'backslash_fixed', backslash_fixed
  );
END;
$$ LANGUAGE plpgsql;
