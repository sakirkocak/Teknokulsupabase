-- Feedback trigger fonksiyonunu düzelt v2
-- 'link' sütunu yerine 'data' JSON sütununu kullan

CREATE OR REPLACE FUNCTION notify_admins_on_new_feedback()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
    category_label TEXT;
BEGIN
    -- Kategori etiketini belirle
    category_label := CASE NEW.category
        WHEN 'bug' THEN 'Hata Bildirimi'
        WHEN 'feature' THEN 'Özellik İsteği'
        WHEN 'suggestion' THEN 'Öneri'
        ELSE 'Diğer'
    END;

    -- Tüm admin'lere bildirim gönder
    FOR admin_record IN 
        SELECT id FROM profiles WHERE role = 'admin'
    LOOP
        INSERT INTO notifications (user_id, title, body, type, data)
        VALUES (
            admin_record.id,
            'Yeni Geri Bildirim',
            category_label || ': ' || LEFT(NEW.message, 50) || CASE WHEN LENGTH(NEW.message) > 50 THEN '...' ELSE '' END,
            'info',
            jsonb_build_object('link', '/admin/geri-bildirimler')
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

