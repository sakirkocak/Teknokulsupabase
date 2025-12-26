-- =====================================================
-- TYPESENSE SYNC TRIGGERS
-- =====================================================
-- Bu migration, Supabase'den Typesense'e otomatik
-- veri senkronizasyonu için trigger'lar oluşturur.
-- =====================================================

-- pg_net extension'ı aktifleştir (HTTP istekleri için)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =====================================================
-- 1. WEBHOOK URL VE SECRET SAKLA
-- =====================================================
-- Güvenli bir şekilde config'de sakla
DO $$
BEGIN
  -- Webhook config tablosu oluştur (yoksa)
  CREATE TABLE IF NOT EXISTS typesense_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  -- Webhook URL ve secret ekle/güncelle
  INSERT INTO typesense_config (key, value) 
  VALUES 
    ('webhook_url', 'https://teknokul.com/api/webhooks/typesense-sync'),
    ('webhook_secret', 'teknokul-typesense-webhook-2024')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
END $$;

-- =====================================================
-- 2. STUDENT POINTS SYNC TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION sync_student_points_to_typesense()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  webhook_secret TEXT;
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- Config'den URL ve secret al
  SELECT value INTO webhook_url FROM typesense_config WHERE key = 'webhook_url';
  SELECT value INTO webhook_secret FROM typesense_config WHERE key = 'webhook_secret';
  
  -- Payload oluştur
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', CASE 
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb
      ELSE row_to_json(NEW)::jsonb
    END,
    'old_record', CASE 
      WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb
      ELSE NULL
    END
  );
  
  -- HTTP POST isteği gönder
  SELECT net.http_post(
    url := webhook_url,
    body := payload::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    )::jsonb
  ) INTO request_id;
  
  -- Log kaydet (opsiyonel debug için)
  INSERT INTO typesense_sync_log (table_name, operation, record_id, status)
  VALUES (TG_TABLE_NAME, TG_OP, COALESCE(NEW.student_id, OLD.student_id)::text, 'sent');
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Hata durumunda log kaydet ama işlemi engelleme
  INSERT INTO typesense_sync_log (table_name, operation, record_id, status)
  VALUES (TG_TABLE_NAME, TG_OP, COALESCE(NEW.student_id, OLD.student_id)::text, 'error: ' || SQLERRM);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Student points trigger'ı oluştur
DROP TRIGGER IF EXISTS typesense_student_points_sync ON student_points;
CREATE TRIGGER typesense_student_points_sync
  AFTER INSERT OR UPDATE OR DELETE ON student_points
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_points_to_typesense();

-- =====================================================
-- 3. QUESTIONS SYNC TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION sync_questions_to_typesense()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  webhook_secret TEXT;
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- Config'den URL ve secret al
  SELECT value INTO webhook_url FROM typesense_config WHERE key = 'webhook_url';
  SELECT value INTO webhook_secret FROM typesense_config WHERE key = 'webhook_secret';
  
  -- Payload oluştur
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', CASE 
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb
      ELSE row_to_json(NEW)::jsonb
    END,
    'old_record', CASE 
      WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb
      ELSE NULL
    END
  );
  
  -- HTTP POST isteği gönder
  SELECT net.http_post(
    url := webhook_url,
    body := payload::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    )::jsonb
  ) INTO request_id;
  
  -- Log kaydet
  INSERT INTO typesense_sync_log (table_name, operation, record_id, status)
  VALUES (TG_TABLE_NAME, TG_OP, COALESCE(NEW.id, OLD.id)::text, 'sent');
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Hata durumunda log kaydet ama işlemi engelleme
  INSERT INTO typesense_sync_log (table_name, operation, record_id, status)
  VALUES (TG_TABLE_NAME, TG_OP, COALESCE(NEW.id, OLD.id)::text, 'error: ' || SQLERRM);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Questions trigger'ı oluştur
DROP TRIGGER IF EXISTS typesense_questions_sync ON questions;
CREATE TRIGGER typesense_questions_sync
  AFTER INSERT OR UPDATE OR DELETE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION sync_questions_to_typesense();

-- =====================================================
-- 4. WEBHOOK URL GÜNCELLEME FONKSİYONU
-- =====================================================
-- Production URL'i değiştirmek için kullanılabilir
CREATE OR REPLACE FUNCTION update_typesense_webhook_url(new_url TEXT)
RETURNS void AS $$
BEGIN
  UPDATE typesense_config SET value = new_url WHERE key = 'webhook_url';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. LOG TEMİZLEME FONKSİYONU
-- =====================================================
-- 7 günden eski logları temizlemek için manuel çağrılabilir
CREATE OR REPLACE FUNCTION cleanup_typesense_sync_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM typesense_sync_log WHERE synced_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- BİLGİ
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'TYPESENSE SYNC TRIGGERS OLUŞTURULDU!';
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'student_points tablosu için trigger: AKTIF';
  RAISE NOTICE 'questions tablosu için trigger: AKTIF';
  RAISE NOTICE 'Webhook URL: https://teknokul.com/api/webhooks/typesense-sync';
  RAISE NOTICE '====================================================';
END $$;

