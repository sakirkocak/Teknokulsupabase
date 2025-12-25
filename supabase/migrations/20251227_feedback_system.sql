-- Geri Bildirim (Feedback) Sistemi
-- Ziyaretçiler ve kullanıcılar için feedback tablosu ve admin bildirimi

-- Feedback kategorileri için enum (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_category') THEN
        CREATE TYPE feedback_category AS ENUM ('bug', 'feature', 'suggestion', 'other');
    END IF;
END $$;

-- Feedback durumları için enum (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_status') THEN
        CREATE TYPE feedback_status AS ENUM ('new', 'in_progress', 'resolved', 'closed');
    END IF;
END $$;

-- Feedback tablosu oluştur
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT,
    email TEXT,
    category feedback_category DEFAULT 'other',
    status feedback_status DEFAULT 'new',
    message TEXT NOT NULL,
    page_url TEXT,
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback tablosu için indexler
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- RLS'i etkinleştir
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları

-- Herkes feedback oluşturabilir (anonim dahil)
DROP POLICY IF EXISTS "feedback_insert_any" ON feedback;
CREATE POLICY "feedback_insert_any" ON feedback
    FOR INSERT
    WITH CHECK (true);

-- Kayıtlı kullanıcılar sadece kendi feedback'lerini görebilir
DROP POLICY IF EXISTS "feedback_select_own" ON feedback;
CREATE POLICY "feedback_select_own" ON feedback
    FOR SELECT
    USING (
        user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Sadece admin güncelleyebilir
DROP POLICY IF EXISTS "feedback_update_admin" ON feedback;
CREATE POLICY "feedback_update_admin" ON feedback
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Sadece admin silebilir
DROP POLICY IF EXISTS "feedback_delete_admin" ON feedback;
CREATE POLICY "feedback_delete_admin" ON feedback
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feedback_updated_at ON feedback;
CREATE TRIGGER feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();

-- Yeni feedback geldiğinde admin'lere bildirim gönderen trigger
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
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (
            admin_record.id,
            'Yeni Geri Bildirim',
            category_label || ': ' || LEFT(NEW.message, 50) || CASE WHEN LENGTH(NEW.message) > 50 THEN '...' ELSE '' END,
            'info',
            '/admin/geri-bildirimler'
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_feedback ON feedback;
CREATE TRIGGER on_new_feedback
    AFTER INSERT ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION notify_admins_on_new_feedback();

-- Yorum ekle
COMMENT ON TABLE feedback IS 'Kullanıcı ve ziyaretçi geri bildirimleri';
COMMENT ON COLUMN feedback.user_id IS 'Kayıtlı kullanıcı ID (anonim için null)';
COMMENT ON COLUMN feedback.category IS 'Geri bildirim kategorisi: bug, feature, suggestion, other';
COMMENT ON COLUMN feedback.status IS 'Durum: new, in_progress, resolved, closed';
COMMENT ON COLUMN feedback.page_url IS 'Geri bildirimin gönderildiği sayfa URL';
COMMENT ON COLUMN feedback.admin_note IS 'Admin tarafından eklenen özel not';

