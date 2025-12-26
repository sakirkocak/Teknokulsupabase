-- Log tablosu oluştur (yoksa)
CREATE TABLE IF NOT EXISTS typesense_sync_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id TEXT,
  status TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabloya index ekle
CREATE INDEX IF NOT EXISTS idx_typesense_sync_log_synced_at ON typesense_sync_log(synced_at);

DO $$
BEGIN
  RAISE NOTICE '✅ typesense_sync_log tablosu hazır!';
END $$;

