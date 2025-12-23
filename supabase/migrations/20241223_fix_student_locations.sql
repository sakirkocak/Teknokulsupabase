-- =====================================================
-- ÖĞRENCİ KONUM VERİLERİNİ DÜZELT
-- Okulun il/ilçe bilgisiyle öğrenci verilerini eşitle
-- =====================================================

-- Mevcut tutarsız verileri düzelt
DO $$
DECLARE
    v_fixed INT := 0;
    v_student RECORD;
    v_school RECORD;
BEGIN
    -- Her öğrenciyi kontrol et
    FOR v_student IN 
        SELECT sp.id, sp.school_id, sp.city_id, sp.district_id
        FROM student_profiles sp
        WHERE sp.school_id IS NOT NULL
    LOOP
        -- Okulun bilgilerini al
        SELECT city_id, district_id INTO v_school
        FROM schools
        WHERE id = v_student.school_id;
        
        -- Tutarsızlık varsa düzelt
        IF v_school.city_id IS NOT NULL AND (v_student.city_id IS NULL OR v_student.city_id != v_school.city_id) THEN
            UPDATE student_profiles
            SET city_id = v_school.city_id,
                district_id = v_school.district_id
            WHERE id = v_student.id;
            
            v_fixed := v_fixed + 1;
        ELSIF v_school.district_id IS NOT NULL AND (v_student.district_id IS NULL OR v_student.district_id != v_school.district_id) THEN
            UPDATE student_profiles
            SET district_id = v_school.district_id
            WHERE id = v_student.id;
            
            v_fixed := v_fixed + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '% öğrencinin konum bilgisi düzeltildi', v_fixed;
END $$;

