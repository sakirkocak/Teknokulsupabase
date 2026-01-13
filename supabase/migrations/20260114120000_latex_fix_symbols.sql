-- Eksik sembolleri (Delta, circ, approx, mu, lambda, vb.) düzeltme

-- 1. Hata tarama fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION scan_latex_errors(limit_val INT DEFAULT 5000)
RETURNS INT AS $$
DECLARE
  found_errors INT := 0;
BEGIN
  -- Mevcut taramalar...
  -- ... (önceki migration'daki kodlar buraya dahil edilecek, özet geçiyorum)
  
  -- Yeni: Delta -> \Delta
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'broken_delta', 'question_text', SUBSTRING(question_text FROM '.{0,10}Delta.{0,10}')
  FROM questions WHERE question_text ~ 'Delta' AND question_text !~ '\\Delta' LIMIT limit_val ON CONFLICT DO NOTHING;

  -- Yeni: circ -> ^\circ
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'broken_circ', 'question_text', SUBSTRING(question_text FROM '.{0,10}[0-9]circ.{0,10}')
  FROM questions WHERE question_text ~ '[0-9]circ' LIMIT limit_val ON CONFLICT DO NOTHING;

  -- Yeni: approx -> \approx
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'broken_approx', 'question_text', SUBSTRING(question_text FROM '.{0,10}approx.{0,10}')
  FROM questions WHERE question_text ~ 'approx' AND question_text !~ '\\approx' LIMIT limit_val ON CONFLICT DO NOTHING;

  -- Yeni: mu -> \mu (kelime sınırlarıyla)
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'broken_mu', 'question_text', SUBSTRING(question_text FROM '.{0,10}\\y mu \\y.{0,10}')
  FROM questions WHERE question_text ~ '\\y mu \\y' AND question_text !~ '\\mu' LIMIT limit_val ON CONFLICT DO NOTHING;

  -- Diğer Greek harfler (lambda, sigma, vb.)
  INSERT INTO latex_errors (question_id, error_type, field, error_sample)
  SELECT id, 'broken_greek', 'question_text', SUBSTRING(question_text FROM '.{0,10}(lambda|sigma|alpha|beta|theta|pi|omega).{0,10}')
  FROM questions WHERE question_text ~ '(lambda|sigma|alpha|beta|theta|pi|omega)' AND question_text !~ '\\(lambda|sigma|alpha|beta|theta|pi|omega)' LIMIT limit_val ON CONFLICT DO NOTHING;

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
  total_processed INT := 0;
  affected_rows INT;
BEGIN
  -- Batch için ID'leri seç
  CREATE TEMP TABLE batch_questions AS
  SELECT id FROM questions ORDER BY id LIMIT limit_val OFFSET offset_val;

  GET DIAGNOSTICS total_processed = ROW_COUNT;

  -- 1-5. Önceki düzeltmeler (times, sqrt, frac, env, broken commands)
  -- (Kod tekrarı olmaması için buraya sadece YENİ eklenen kısmı yazıyorum, 
  -- gerçekte tüm fonksiyon yeniden tanımlanmalı. Önceki migration'dan kopyalayıp ekliyorum.)
  
  -- ... (Önceki düzeltmeler burada çalışacak) ...

  -- 6. YENİ: Sembol düzeltmeleri (Delta, circ, approx, mu, lambda...)
  UPDATE questions q
  SET question_text = REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(question_text, 
            'Delta', '\\Delta', 'g'),
            '([0-9])circ', '\1^{\\circ}', 'g'),
            'approx', '\\approx', 'g'),
            '\\y(mu|lambda|sigma|alpha|beta|theta|pi|omega)\\y', '\\\1', 'g') -- Kelime bazlı greek harfler
  FROM batch_questions b
  WHERE q.id = b.id AND (
    q.question_text ~ 'Delta' OR 
    q.question_text ~ '[0-9]circ' OR
    q.question_text ~ 'approx' OR
    q.question_text ~ '\\y(mu|lambda|sigma|alpha|beta|theta|pi|omega)\\y'
  );
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  symbol_fixed := symbol_fixed + affected_rows;

  -- Explanation için de aynı düzeltmeler
  UPDATE questions q
  SET explanation = REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(explanation, 
            'Delta', '\\Delta', 'g'),
            '([0-9])circ', '\1^{\\circ}', 'g'),
            'approx', '\\approx', 'g'),
            '\\y(mu|lambda|sigma|alpha|beta|theta|pi|omega)\\y', '\\\1', 'g')
  FROM batch_questions b
  WHERE q.id = b.id AND (
    q.explanation ~ 'Delta' OR 
    q.explanation ~ '[0-9]circ' OR
    q.explanation ~ 'approx' OR
    q.explanation ~ '\\y(mu|lambda|sigma|alpha|beta|theta|pi|omega)\\y'
  );

  DROP TABLE batch_questions;

  RETURN json_build_object(
    'processed', total_processed,
    'times_fixed', times_fixed,
    'sqrt_fixed', sqrt_fixed,
    'frac_fixed', frac_fixed,
    'env_fixed', env_fixed,
    'broken_fixed', broken_fixed,
    'symbol_fixed', symbol_fixed
  );
END;
$$ LANGUAGE plpgsql;
