-- =====================================================
-- LİDERLİK TABLOSU FONKSİYONLARI - DÜZELTME
-- Schools tablosu district_id üzerinden city_id'ye erişir
-- =====================================================

-- 1. OKUL LİDERLİĞİ FONKSİYONU - DÜZELTME
CREATE OR REPLACE FUNCTION get_leaderboard_by_school(
    p_school_id UUID,
    p_grade_filter INT DEFAULT NULL,
    p_limit INT DEFAULT 100
)
RETURNS TABLE(
    student_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    grade INT,
    school_id UUID,
    school_name TEXT,
    city_name TEXT,
    district_name TEXT,
    total_points INT,
    total_questions INT,
    total_correct INT,
    total_wrong INT,
    max_streak INT,
    success_rate NUMERIC,
    rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id as student_id,
        p.full_name,
        p.avatar_url,
        sp.grade,
        sp.school_id,
        s.name as school_name,
        tc.name as city_name,
        td.name as district_name,
        spt.total_points,
        spt.total_questions,
        spt.total_correct,
        spt.total_wrong,
        spt.max_streak,
        ROUND(CASE WHEN spt.total_questions > 0 THEN (spt.total_correct::DECIMAL / spt.total_questions) * 100 ELSE 0 END, 1) as success_rate,
        ROW_NUMBER() OVER (ORDER BY spt.total_points DESC) as rank
    FROM student_profiles sp
    INNER JOIN profiles p ON sp.user_id = p.id
    INNER JOIN student_points spt ON sp.id = spt.student_id
    LEFT JOIN schools s ON sp.school_id = s.id
    LEFT JOIN turkey_districts td ON s.district_id = td.id
    LEFT JOIN turkey_cities tc ON td.city_id = tc.id
    WHERE sp.school_id = p_school_id
      AND spt.total_questions > 0
      AND (p_grade_filter IS NULL OR sp.grade = p_grade_filter)
    ORDER BY spt.total_points DESC
    LIMIT p_limit;
END;
$$;

-- 2. İLÇE LİDERLİĞİ FONKSİYONU - DÜZELTME
CREATE OR REPLACE FUNCTION get_leaderboard_by_district(
    p_district_id UUID,
    p_grade_filter INT DEFAULT NULL,
    p_limit INT DEFAULT 100
)
RETURNS TABLE(
    student_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    grade INT,
    school_id UUID,
    school_name TEXT,
    city_name TEXT,
    district_name TEXT,
    total_points INT,
    total_questions INT,
    total_correct INT,
    total_wrong INT,
    max_streak INT,
    success_rate NUMERIC,
    rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id as student_id,
        p.full_name,
        p.avatar_url,
        sp.grade,
        sp.school_id,
        s.name as school_name,
        tc.name as city_name,
        td.name as district_name,
        spt.total_points,
        spt.total_questions,
        spt.total_correct,
        spt.total_wrong,
        spt.max_streak,
        ROUND(CASE WHEN spt.total_questions > 0 THEN (spt.total_correct::DECIMAL / spt.total_questions) * 100 ELSE 0 END, 1) as success_rate,
        ROW_NUMBER() OVER (ORDER BY spt.total_points DESC) as rank
    FROM student_profiles sp
    INNER JOIN profiles p ON sp.user_id = p.id
    INNER JOIN student_points spt ON sp.id = spt.student_id
    LEFT JOIN schools s ON sp.school_id = s.id
    LEFT JOIN turkey_districts td ON s.district_id = td.id
    LEFT JOIN turkey_cities tc ON td.city_id = tc.id
    WHERE sp.district_id = p_district_id
      AND spt.total_questions > 0
      AND (p_grade_filter IS NULL OR sp.grade = p_grade_filter)
    ORDER BY spt.total_points DESC
    LIMIT p_limit;
END;
$$;

-- 3. İL LİDERLİĞİ FONKSİYONU - DÜZELTME
CREATE OR REPLACE FUNCTION get_leaderboard_by_city(
    p_city_id UUID,
    p_grade_filter INT DEFAULT NULL,
    p_limit INT DEFAULT 100
)
RETURNS TABLE(
    student_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    grade INT,
    school_id UUID,
    school_name TEXT,
    city_name TEXT,
    district_name TEXT,
    total_points INT,
    total_questions INT,
    total_correct INT,
    total_wrong INT,
    max_streak INT,
    success_rate NUMERIC,
    rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id as student_id,
        p.full_name,
        p.avatar_url,
        sp.grade,
        sp.school_id,
        s.name as school_name,
        tc.name as city_name,
        td.name as district_name,
        spt.total_points,
        spt.total_questions,
        spt.total_correct,
        spt.total_wrong,
        spt.max_streak,
        ROUND(CASE WHEN spt.total_questions > 0 THEN (spt.total_correct::DECIMAL / spt.total_questions) * 100 ELSE 0 END, 1) as success_rate,
        ROW_NUMBER() OVER (ORDER BY spt.total_points DESC) as rank
    FROM student_profiles sp
    INNER JOIN profiles p ON sp.user_id = p.id
    INNER JOIN student_points spt ON sp.id = spt.student_id
    LEFT JOIN schools s ON sp.school_id = s.id
    LEFT JOIN turkey_districts td ON s.district_id = td.id
    LEFT JOIN turkey_cities tc ON td.city_id = tc.id
    WHERE sp.city_id = p_city_id
      AND spt.total_questions > 0
      AND (p_grade_filter IS NULL OR sp.grade = p_grade_filter)
    ORDER BY spt.total_points DESC
    LIMIT p_limit;
END;
$$;

-- 4. TÜRKİYE LİDERLİĞİ FONKSİYONU - DÜZELTME
CREATE OR REPLACE FUNCTION get_leaderboard_turkey(
    p_grade_filter INT DEFAULT NULL,
    p_limit INT DEFAULT 100
)
RETURNS TABLE(
    student_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    grade INT,
    school_id UUID,
    school_name TEXT,
    city_name TEXT,
    district_name TEXT,
    total_points INT,
    total_questions INT,
    total_correct INT,
    total_wrong INT,
    max_streak INT,
    success_rate NUMERIC,
    rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id as student_id,
        p.full_name,
        p.avatar_url,
        sp.grade,
        sp.school_id,
        s.name as school_name,
        tc.name as city_name,
        td.name as district_name,
        spt.total_points,
        spt.total_questions,
        spt.total_correct,
        spt.total_wrong,
        spt.max_streak,
        ROUND(CASE WHEN spt.total_questions > 0 THEN (spt.total_correct::DECIMAL / spt.total_questions) * 100 ELSE 0 END, 1) as success_rate,
        ROW_NUMBER() OVER (ORDER BY spt.total_points DESC) as rank
    FROM student_profiles sp
    INNER JOIN profiles p ON sp.user_id = p.id
    INNER JOIN student_points spt ON sp.id = spt.student_id
    LEFT JOIN schools s ON sp.school_id = s.id
    LEFT JOIN turkey_districts td ON s.district_id = td.id
    LEFT JOIN turkey_cities tc ON td.city_id = tc.id
    WHERE spt.total_questions > 0
      AND (p_grade_filter IS NULL OR sp.grade = p_grade_filter)
    ORDER BY spt.total_points DESC
    LIMIT p_limit;
END;
$$;

-- 5. SINIF LİDERLİĞİ FONKSİYONU - DÜZELTME
CREATE OR REPLACE FUNCTION get_leaderboard_by_classroom(
    p_school_id UUID,
    p_grade INT,
    p_limit INT DEFAULT 100
)
RETURNS TABLE(
    student_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    grade INT,
    school_id UUID,
    school_name TEXT,
    total_points INT,
    total_questions INT,
    total_correct INT,
    total_wrong INT,
    max_streak INT,
    success_rate NUMERIC,
    rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id as student_id,
        p.full_name,
        p.avatar_url,
        sp.grade,
        sp.school_id,
        s.name as school_name,
        spt.total_points,
        spt.total_questions,
        spt.total_correct,
        spt.total_wrong,
        spt.max_streak,
        ROUND(CASE WHEN spt.total_questions > 0 THEN (spt.total_correct::DECIMAL / spt.total_questions) * 100 ELSE 0 END, 1) as success_rate,
        ROW_NUMBER() OVER (ORDER BY spt.total_points DESC) as rank
    FROM student_profiles sp
    INNER JOIN profiles p ON sp.user_id = p.id
    INNER JOIN student_points spt ON sp.id = spt.student_id
    LEFT JOIN schools s ON sp.school_id = s.id
    WHERE sp.school_id = p_school_id
      AND sp.grade = p_grade
      AND spt.total_questions > 0
    ORDER BY spt.total_points DESC
    LIMIT p_limit;
END;
$$;

-- 6. ÖĞRENCİ PROFİLİ TUTARLILIK TRİGGER'I - DÜZELTME
-- Okul seçildiğinde il ve ilçe otomatik güncellenir
CREATE OR REPLACE FUNCTION sync_student_location_from_school()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_school_info RECORD;
BEGIN
    -- Okul ID değiştiyse veya yeni eklendiyse
    IF NEW.school_id IS NOT NULL AND (OLD.school_id IS NULL OR NEW.school_id != OLD.school_id) THEN
        -- Okulun ilçe ve il bilgilerini al (schools -> districts -> cities)
        SELECT 
            s.district_id,
            d.city_id
        INTO v_school_info
        FROM schools s
        JOIN turkey_districts d ON s.district_id = d.id
        WHERE s.id = NEW.school_id;
        
        -- Öğrencinin il ve ilçe bilgilerini okulunkiyle eşitle
        IF v_school_info.city_id IS NOT NULL THEN
            NEW.city_id := v_school_info.city_id;
        END IF;
        
        IF v_school_info.district_id IS NOT NULL THEN
            NEW.district_id := v_school_info.district_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger'ı oluştur
DROP TRIGGER IF EXISTS trigger_sync_student_location ON student_profiles;
CREATE TRIGGER trigger_sync_student_location
    BEFORE INSERT OR UPDATE ON student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_location_from_school();

-- 7. MEVCUT VERİLERİ DÜZELTME FONKSİYONU - DÜZELTME
CREATE OR REPLACE FUNCTION fix_student_location_data()
RETURNS TABLE(
    fixed_count INT,
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        -- Okulun bilgilerini al
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
    
    RETURN QUERY SELECT v_fixed, format('%s öğrencinin konum bilgisi düzeltildi', v_fixed);
END;
$$;

-- 8. TUTARSIZ VERİLERİ TESPİT ETME FONKSİYONU - DÜZELTME
CREATE OR REPLACE FUNCTION get_inconsistent_student_locations()
RETURNS TABLE(
    student_id UUID,
    student_name TEXT,
    student_city_id UUID,
    student_district_id UUID,
    school_id UUID,
    school_name TEXT,
    school_city_id UUID,
    school_district_id UUID,
    issue TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id as student_id,
        p.full_name as student_name,
        sp.city_id as student_city_id,
        sp.district_id as student_district_id,
        sp.school_id,
        s.name as school_name,
        d.city_id as school_city_id,
        s.district_id as school_district_id,
        CASE 
            WHEN sp.city_id IS NULL AND d.city_id IS NOT NULL THEN 'Öğrencinin ili eksik'
            WHEN sp.city_id != d.city_id THEN 'İl uyuşmazlığı'
            WHEN sp.district_id IS NULL AND s.district_id IS NOT NULL THEN 'Öğrencinin ilçesi eksik'
            WHEN sp.district_id != s.district_id THEN 'İlçe uyuşmazlığı'
            ELSE 'Bilinmeyen sorun'
        END as issue
    FROM student_profiles sp
    INNER JOIN profiles p ON sp.user_id = p.id
    LEFT JOIN schools s ON sp.school_id = s.id
    LEFT JOIN turkey_districts d ON s.district_id = d.id
    WHERE sp.school_id IS NOT NULL
      AND (
          (sp.city_id IS NULL AND d.city_id IS NOT NULL)
          OR (sp.city_id IS NOT NULL AND d.city_id IS NOT NULL AND sp.city_id != d.city_id)
          OR (sp.district_id IS NULL AND s.district_id IS NOT NULL)
          OR (sp.district_id IS NOT NULL AND s.district_id IS NOT NULL AND sp.district_id != s.district_id)
      );
END;
$$;

