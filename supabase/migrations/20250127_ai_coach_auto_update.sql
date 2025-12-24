-- =====================================================
-- AI KOÇ GÖREVLERİNİ OTOMATİK GÜNCELLEME
-- Soru çözüldüğünde AI Koç görevi otomatik ilerlesin
-- =====================================================

-- Fonksiyon: Soru çözüldüğünde AI Koç görevini güncelle
CREATE OR REPLACE FUNCTION update_ai_coach_task_on_question()
RETURNS TRIGGER AS $$
DECLARE
    v_task RECORD;
    v_new_count INTEGER;
    v_total_xp INTEGER;
BEGIN
    -- Sadece soru kaynağından gelen kayıtları işle
    IF NEW.source != 'question' THEN
        RETURN NEW;
    END IF;

    -- Bu öğrencinin aktif AI Koç görevlerini bul
    FOR v_task IN 
        SELECT * FROM ai_coach_tasks 
        WHERE student_id = NEW.student_id 
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
        -- Ders kodu eşleşiyorsa veya genel görevse (ders kodu yok)
        AND (subject_code IS NULL OR subject_code = NEW.subject_code)
    LOOP
        -- İlerlemeyi artır
        v_new_count := v_task.current_count + 1;
        
        -- Görev tamamlandı mı?
        IF v_new_count >= v_task.target_count THEN
            -- Görevi tamamla
            UPDATE ai_coach_tasks 
            SET current_count = v_new_count,
                status = 'completed',
                completed_at = NOW()
            WHERE id = v_task.id;
            
            -- XP ver
            v_total_xp := v_task.xp_reward;
            
            -- Bonus XP (doğruluk hedefi varsa ve doğru cevapsa)
            IF v_task.bonus_xp > 0 AND NEW.is_correct = true THEN
                v_total_xp := v_total_xp + v_task.bonus_xp;
            END IF;
            
            -- XP'yi point_history'e ekle (ai_task olarak)
            INSERT INTO point_history (student_id, points, source)
            VALUES (NEW.student_id, v_total_xp, 'ai_task');
            
            -- Student points güncelle
            UPDATE student_points 
            SET total_points = COALESCE(total_points, 0) + v_total_xp
            WHERE student_id = NEW.student_id;
            
            -- AI Coach stats güncelle
            INSERT INTO ai_coach_stats (student_id, tasks_completed, total_xp_earned, last_interaction)
            VALUES (NEW.student_id, 1, v_total_xp, NOW())
            ON CONFLICT (student_id) 
            DO UPDATE SET 
                tasks_completed = ai_coach_stats.tasks_completed + 1,
                total_xp_earned = ai_coach_stats.total_xp_earned + v_total_xp,
                last_interaction = NOW();
                
        ELSE
            -- Sadece ilerlemeyi güncelle
            UPDATE ai_coach_tasks 
            SET current_count = v_new_count
            WHERE id = v_task.id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mevcut trigger varsa sil
DROP TRIGGER IF EXISTS trigger_update_ai_coach_task ON point_history;

-- Trigger oluştur
CREATE TRIGGER trigger_update_ai_coach_task
    AFTER INSERT ON point_history
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_coach_task_on_question();

-- Yetki ver
GRANT EXECUTE ON FUNCTION update_ai_coach_task_on_question TO authenticated;

