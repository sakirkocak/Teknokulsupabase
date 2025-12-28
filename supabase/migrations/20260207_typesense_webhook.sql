-- ============================================
-- TYPESENSE OTOMATİK SENKRONİZASYON WEBHOOK
-- questions tablosuna yapılan değişiklikleri
-- otomatik olarak Typesense'e gönderir
-- ============================================

-- pg_net extension'ı aktif et (HTTP istekleri için)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Webhook fonksiyonu oluştur
CREATE OR REPLACE FUNCTION public.sync_question_to_typesense()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_url TEXT := 'https://www.teknokul.com.tr/api/webhooks/typesense-sync';
  webhook_secret TEXT := 'teknokul-typesense-webhook-2024';
  payload JSONB;
  question_record JSONB;
BEGIN
  -- Payload oluştur
  IF TG_OP = 'DELETE' THEN
    question_record := to_jsonb(OLD);
    payload := jsonb_build_object(
      'type', 'DELETE',
      'table', 'questions',
      'schema', 'public',
      'record', question_record,
      'old_record', question_record
    );
  ELSIF TG_OP = 'UPDATE' THEN
    payload := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'questions',
      'schema', 'public',
      'record', to_jsonb(NEW),
      'old_record', to_jsonb(OLD)
    );
  ELSE -- INSERT
    payload := jsonb_build_object(
      'type', 'INSERT',
      'table', 'questions',
      'schema', 'public',
      'record', to_jsonb(NEW),
      'old_record', NULL
    );
  END IF;

  -- HTTP POST isteği gönder (async - blocking değil)
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    ),
    body := payload
  );

  -- Trigger sonucu döndür
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Mevcut trigger varsa sil
DROP TRIGGER IF EXISTS typesense_sync_trigger ON public.questions;

-- Yeni trigger oluştur
CREATE TRIGGER typesense_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.sync_question_to_typesense();

-- Bilgi mesajı
DO $$
BEGIN
  RAISE NOTICE '✅ Typesense webhook trigger başarıyla oluşturuldu!';
  RAISE NOTICE '📡 Her soru ekleme/güncelleme/silme işlemi otomatik olarak Typesense''e gönderilecek.';
END $$;
