-- =====================================================
-- GÜNLÜK GÖREVLERİ OTOMATİK GÜNCELLEME
-- Soru çözüldüğünde günlük görevler otomatik güncellensin
-- =====================================================

-- Fonksiyon: Soru çözüldüğünde günlük görevleri güncelle
CREATE OR REPLACE FUNCTION update_daily_challenges_on_question()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_today_questions INTEGER;
    v_today_correct INTEGER;
    v_today_math INTEGER;
    v_today_subjects TEXT[];
BEGIN
    -- Sadece soru kaynağından gelen kayıtları işle
    IF NEW.source != 'question' THEN
        RETURN NEW;
    END IF;

    -- Öğrencinin user_id'sini al
    SELECT sp.user_id INTO v_user_id
    FROM student_profiles sp
    WHERE sp.id = NEW.student_id;

    IF v_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Bugün çözülen toplam soru sayısı
    SELECT COUNT(*) INTO v_today_questions
    FROM point_history
    WHERE student_id = NEW.student_id
    AND source = 'question'
    AND created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';

    -- Bugün doğru çözülen soru sayısı
    SELECT COUNT(*) INTO v_today_correct
    FROM point_history
    WHERE student_id = NEW.student_id
    AND source = 'question'
    AND is_correct = true
    AND created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';

    -- Bugün çözülen matematik sorusu sayısı
    SELECT COUNT(*) INTO v_today_math
    FROM point_history
    WHERE student_id = NEW.student_id
    AND source = 'question'
    AND (subject_code = 'matematik' OR subject_code ILIKE '%mat%')
    AND created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';

    -- Bugün çözülen farklı dersler
    SELECT ARRAY_AGG(DISTINCT subject_code) INTO v_today_subjects
    FROM point_history
    WHERE student_id = NEW.student_id
    AND source = 'question'
    AND subject_code IS NOT NULL
    AND created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';

    -- 1. GÜNLÜK PRATİK (10 soru çöz)
    INSERT INTO challenge_progress (user_id, challenge_id, current_progress, is_completed, completed_at, updated_at)
    VALUES (
        v_user_id,
        'daily_practice',
        LEAST(v_today_questions, 10),
        v_today_questions >= 10,
        CASE WHEN v_today_questions >= 10 THEN NOW() ELSE NULL END,
        NOW()
    )
    ON CONFLICT (user_id, challenge_id)
    DO UPDATE SET 
        current_progress = LEAST(v_today_questions, 10),
        is_completed = v_today_questions >= 10,
        completed_at = CASE 
            WHEN v_today_questions >= 10 AND challenge_progress.completed_at IS NULL THEN NOW() 
            ELSE challenge_progress.completed_at 
        END,
        updated_at = NOW();

    -- 2. SERİNİ KORU (1 soru çöz)
    INSERT INTO challenge_progress (user_id, challenge_id, current_progress, is_completed, completed_at, updated_at)
    VALUES (
        v_user_id,
        'daily_streak',
        LEAST(v_today_questions, 1),
        v_today_questions >= 1,
        CASE WHEN v_today_questions >= 1 THEN NOW() ELSE NULL END,
        NOW()
    )
    ON CONFLICT (user_id, challenge_id)
    DO UPDATE SET 
        current_progress = LEAST(v_today_questions, 1),
        is_completed = v_today_questions >= 1,
        completed_at = CASE 
            WHEN v_today_questions >= 1 AND challenge_progress.completed_at IS NULL THEN NOW() 
            ELSE challenge_progress.completed_at 
        END,
        updated_at = NOW();

    -- 3. MATEMATİK ZAMANI (5 matematik sorusu)
    INSERT INTO challenge_progress (user_id, challenge_id, current_progress, is_completed, completed_at, updated_at)
    VALUES (
        v_user_id,
        'daily_math',
        LEAST(v_today_math, 5),
        v_today_math >= 5,
        CASE WHEN v_today_math >= 5 THEN NOW() ELSE NULL END,
        NOW()
    )
    ON CONFLICT (user_id, challenge_id)
    DO UPDATE SET 
        current_progress = LEAST(v_today_math, 5),
        is_completed = v_today_math >= 5,
        completed_at = CASE 
            WHEN v_today_math >= 5 AND challenge_progress.completed_at IS NULL THEN NOW() 
            ELSE challenge_progress.completed_at 
        END,
        updated_at = NOW();

    -- 4. KESKİN NİŞANCI (%80 başarı ile 5 soru)
    -- Sadece en az 5 soru çözüldüyse kontrol et
    IF v_today_questions >= 5 THEN
        DECLARE
            v_accuracy NUMERIC;
        BEGIN
            v_accuracy := (v_today_correct::NUMERIC / v_today_questions::NUMERIC) * 100;
            
            INSERT INTO challenge_progress (user_id, challenge_id, current_progress, is_completed, completed_at, updated_at)
            VALUES (
                v_user_id,
                'daily_accuracy',
                CASE WHEN v_accuracy >= 80 THEN LEAST(v_today_questions, 5) ELSE 0 END,
                v_accuracy >= 80 AND v_today_questions >= 5,
                CASE WHEN v_accuracy >= 80 AND v_today_questions >= 5 THEN NOW() ELSE NULL END,
                NOW()
            )
            ON CONFLICT (user_id, challenge_id)
            DO UPDATE SET 
                current_progress = CASE WHEN v_accuracy >= 80 THEN LEAST(v_today_questions, 5) ELSE 0 END,
                is_completed = v_accuracy >= 80 AND v_today_questions >= 5,
                completed_at = CASE 
                    WHEN v_accuracy >= 80 AND v_today_questions >= 5 AND challenge_progress.completed_at IS NULL THEN NOW() 
                    ELSE challenge_progress.completed_at 
                END,
                updated_at = NOW();
        END;
    END IF;

    -- 5. KAŞİF (Farklı dersten 3 soru)
    IF v_today_subjects IS NOT NULL THEN
        DECLARE
            v_subject_count INTEGER;
        BEGIN
            v_subject_count := array_length(v_today_subjects, 1);
            
            INSERT INTO challenge_progress (user_id, challenge_id, current_progress, is_completed, completed_at, updated_at)
            VALUES (
                v_user_id,
                'daily_explorer',
                LEAST(COALESCE(v_subject_count, 0), 3),
                COALESCE(v_subject_count, 0) >= 3,
                CASE WHEN COALESCE(v_subject_count, 0) >= 3 THEN NOW() ELSE NULL END,
                NOW()
            )
            ON CONFLICT (user_id, challenge_id)
            DO UPDATE SET 
                current_progress = LEAST(COALESCE(v_subject_count, 0), 3),
                is_completed = COALESCE(v_subject_count, 0) >= 3,
                completed_at = CASE 
                    WHEN COALESCE(v_subject_count, 0) >= 3 AND challenge_progress.completed_at IS NULL THEN NOW() 
                    ELSE challenge_progress.completed_at 
                END,
                updated_at = NOW();
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mevcut trigger varsa sil
DROP TRIGGER IF EXISTS trigger_update_daily_challenges ON point_history;

-- Trigger oluştur
CREATE TRIGGER trigger_update_daily_challenges
    AFTER INSERT ON point_history
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_challenges_on_question();

-- Yetki ver
GRANT EXECUTE ON FUNCTION update_daily_challenges_on_question TO authenticated;

