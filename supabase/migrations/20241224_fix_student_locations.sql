-- =====================================================
-- ÖĞRENCİ KONUM VERİLERİNİ DÜZELT
-- Okulun il/ilçe bilgisiyle öğrenci verilerini eşitle
-- Schools tablosu district_id üzerinden city_id'ye erişir
-- =====================================================

-- Mevcut tutarsız verileri düzelt
DO $$
DECLARE
    v_fixed INT := 0;
    v_student RECORD;
    v_school_info RECORD;
BEGIN
    -- Her öğrenciyi kontrol et
    FOR v_student IN 
        SELECT sp.id, sp.school_id, sp.city_id, sp.district_id
        FROM student_profiles sp
        WHERE sp.school_id IS NOT NULL
    LOOP
        -- Okulun ilçe ve il bilgilerini al (schools -> districts -> cities)
        SELECT 
            s.district_id,
            d.city_id
        INTO v_school_info
        FROM schools s
        JOIN turkey_districts d ON s.district_id = d.id
        WHERE s.id = v_student.school_id;
        
        -- Tutarsızlık varsa düzelt
        IF v_school_info.city_id IS NOT NULL AND (v_student.city_id IS NULL OR v_student.city_id != v_school_info.city_id) THEN
            UPDATE student_profiles
            SET city_id = v_school_info.city_id,
                district_id = v_school_info.district_id
            WHERE id = v_student.id;
            
            v_fixed := v_fixed + 1;
        ELSIF v_school_info.district_id IS NOT NULL AND (v_student.district_id IS NULL OR v_student.district_id != v_school_info.district_id) THEN
            UPDATE student_profiles
            SET district_id = v_school_info.district_id
            WHERE id = v_student.id;
            
            v_fixed := v_fixed + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '% öğrencinin konum bilgisi düzeltildi', v_fixed;
END $$;
