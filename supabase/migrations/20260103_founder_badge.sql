-- =====================================================
-- KURUCU ÜYE ROZETİ
-- Beta döneminde 500+ soru çözen öncü kullanıcılara verilir
-- NOT: Bu migration badges tablosu varsa çalışır
-- =====================================================

DO $$
BEGIN
    -- badges tablosu var mı kontrol et
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges' AND table_schema = 'public') THEN
        
        -- 1. Kurucu Üye rozetini ekle
        INSERT INTO badges (
            name, 
            description, 
            icon, 
            category, 
            requirement_type, 
            requirement_value, 
            xp_reward
        ) VALUES (
            'Kurucu Üye',
            'Beta döneminde 500+ soru çözen öncü kullanıcı. Teknokul''un ilk kahramanlarından biri!',
            '🏆',
            'basari',
            'founder_member',
            500,
            1000
        ) ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            xp_reward = EXCLUDED.xp_reward;

        -- 2. Mevcut 500+ soru çözmüş kullanıcılara rozeti ver
        INSERT INTO user_badges (user_id, badge_id)
        SELECT 
            stpr.user_id,
            b.id
        FROM student_points sp
        JOIN student_profiles stpr ON sp.student_id = stpr.id
        JOIN badges b ON b.name = 'Kurucu Üye'
        WHERE sp.total_questions >= 500
        AND NOT EXISTS (
            SELECT 1 FROM user_badges ub 
            WHERE ub.user_id = stpr.user_id AND ub.badge_id = b.id
        );
        
        RAISE NOTICE 'Kurucu Üye rozeti başarıyla eklendi';
    ELSE
        RAISE NOTICE 'badges tablosu bulunamadı, Kurucu Üye rozeti atlandı';
    END IF;
END $$;

