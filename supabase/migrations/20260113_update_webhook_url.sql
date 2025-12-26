-- Webhook URL'ini www.teknokul.com.tr olarak güncelle
UPDATE typesense_config 
SET value = 'https://www.teknokul.com.tr/api/webhooks/typesense-sync' 
WHERE key = 'webhook_url';

DO $$
BEGIN
  RAISE NOTICE '✅ Webhook URL güncellendi: https://www.teknokul.com.tr/api/webhooks/typesense-sync';
END $$;

