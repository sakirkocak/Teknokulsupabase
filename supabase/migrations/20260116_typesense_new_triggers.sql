-- =====================================================
-- TYPESENSE SYNC TRİGGERLERI - YENİ TABLOLAR
-- student_topic_stats, schools, turkey_cities, turkey_districts
-- =====================================================

-- Webhook URL (Vercel production URL)
-- NOT: Bu URL'i production'da güncelleyin

-- =====================================================
-- 1. STUDENT_TOPIC_STATS TRİGGER
-- =====================================================
CREATE OR REPLACE FUNCTION sync_student_topic_stats_to_typesense()
RETURNS TRIGGER AS $$
BEGIN
    -- Webhook'a bildir
    PERFORM pg_notify('typesense_sync', json_build_object(
        'table', 'student_topic_stats',
        'type', TG_OP,
        'record', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END,
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    )::text);
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS typesense_student_topic_stats_sync ON student_topic_stats;
CREATE TRIGGER typesense_student_topic_stats_sync
    AFTER INSERT OR UPDATE OR DELETE ON student_topic_stats
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_topic_stats_to_typesense();

-- =====================================================
-- 2. SCHOOLS TRİGGER
-- =====================================================
CREATE OR REPLACE FUNCTION sync_schools_to_typesense()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('typesense_sync', json_build_object(
        'table', 'schools',
        'type', TG_OP,
        'record', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END,
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    )::text);
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS typesense_schools_sync ON schools;
CREATE TRIGGER typesense_schools_sync
    AFTER INSERT OR UPDATE OR DELETE ON schools
    FOR EACH ROW
    EXECUTE FUNCTION sync_schools_to_typesense();

-- =====================================================
-- 3. TURKEY_CITIES TRİGGER (locations koleksiyonuna)
-- =====================================================
CREATE OR REPLACE FUNCTION sync_cities_to_typesense()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('typesense_sync', json_build_object(
        'table', 'turkey_cities',
        'type', TG_OP,
        'record', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END,
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    )::text);
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS typesense_cities_sync ON turkey_cities;
CREATE TRIGGER typesense_cities_sync
    AFTER INSERT OR UPDATE OR DELETE ON turkey_cities
    FOR EACH ROW
    EXECUTE FUNCTION sync_cities_to_typesense();

-- =====================================================
-- 4. TURKEY_DISTRICTS TRİGGER (locations koleksiyonuna)
-- =====================================================
CREATE OR REPLACE FUNCTION sync_districts_to_typesense()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('typesense_sync', json_build_object(
        'table', 'turkey_districts',
        'type', TG_OP,
        'record', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END,
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    )::text);
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS typesense_districts_sync ON turkey_districts;
CREATE TRIGGER typesense_districts_sync
    AFTER INSERT OR UPDATE OR DELETE ON turkey_districts
    FOR EACH ROW
    EXECUTE FUNCTION sync_districts_to_typesense();

-- =====================================================
-- LOG TABLOSU GÜNCELLE (yeni tablolar için)
-- =====================================================
-- Mevcut typesense_sync_log tablosuna ekleme yapmaya gerek yok
-- Tablo tüm tabloları destekliyor

COMMENT ON FUNCTION sync_student_topic_stats_to_typesense IS 'Student topic stats değişikliklerini Typesense''e bildirir';
COMMENT ON FUNCTION sync_schools_to_typesense IS 'Okul değişikliklerini Typesense''e bildirir';
COMMENT ON FUNCTION sync_cities_to_typesense IS 'İl değişikliklerini Typesense locations koleksiyonuna bildirir';
COMMENT ON FUNCTION sync_districts_to_typesense IS 'İlçe değişikliklerini Typesense locations koleksiyonuna bildirir';

