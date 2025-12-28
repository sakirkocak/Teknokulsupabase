-- ============================================
-- FAZ 4: GÜVENLİK SIKILAŞTIRMA (SECURITY HARDENING)
-- Tarih: 2025-12-28
-- ============================================

-- 1. Uzantıları (Extensions) Güvenli Şemaya Taşı
CREATE SCHEMA IF NOT EXISTS extensions;

-- pg_trgm taşı (varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        ALTER EXTENSION pg_trgm SET SCHEMA extensions;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_trgm taşınamadı: %', SQLERRM;
END $$;

-- pg_net taşı (varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        ALTER EXTENSION pg_net SET SCHEMA extensions;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_net taşınamadı: %', SQLERRM;
END $$;

-- 2. Tüm Fonksiyonların Search Path'ini Sabitle
DO $$ 
DECLARE 
    func_name text;
BEGIN 
    FOR func_name IN 
        SELECT format('%I.%I(%s)', n.nspname, p.proname, oidvectortypes(p.proargtypes))
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public'
    LOOP 
        BEGIN
            EXECUTE 'ALTER FUNCTION ' || func_name || ' SET search_path = public';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Fonksiyon güncellenemedi: % (%)', func_name, SQLERRM;
        END;
    END LOOP; 
END $$;

-- 3. RLS Kontrolleri
ALTER TABLE IF EXISTS public.typesense_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.typesense_config ENABLE ROW LEVEL SECURITY;

-- 4. Temizlik
DELETE FROM public.typesense_sync_log WHERE synced_at < NOW() - INTERVAL '1 day';
