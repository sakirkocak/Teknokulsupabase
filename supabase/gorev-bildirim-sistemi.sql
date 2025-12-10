-- =====================================================
-- GÖREV VE BİLDİRİM SİSTEMİ GÜNCELLEMESİ
-- =====================================================

-- 1. Tasks tablosuna ekran görüntüsü alanı ekle
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 2. Notifications tablosuna body alanı ekle (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'body') THEN
        ALTER TABLE notifications ADD COLUMN body TEXT;
    END IF;
END $$;

-- 3. Notifications INSERT policy ekle (herkes kendi bildirimi için insert yapabilir)
DROP POLICY IF EXISTS "Bildirimler oluşturulabilir" ON notifications;
CREATE POLICY "Bildirimler oluşturulabilir"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- 4. Storage bucket for task screenshots (eğer yoksa)
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-screenshots', 'task-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage policy for task screenshots
DROP POLICY IF EXISTS "Task screenshots public read" ON storage.objects;
CREATE POLICY "Task screenshots public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-screenshots');

DROP POLICY IF EXISTS "Users can upload task screenshots" ON storage.objects;
CREATE POLICY "Users can upload task screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-screenshots' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own task screenshots" ON storage.objects;
CREATE POLICY "Users can update own task screenshots"
ON storage.objects FOR UPDATE
USING (bucket_id = 'task-screenshots' AND auth.uid() IS NOT NULL);

-- 6. Task geçmişi için activity_logs tablosuna task_id ekle
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id);

-- =====================================================
-- BU SQL'İ SUPABASE SQL EDITOR'DA ÇALIŞTIRIN
-- =====================================================

