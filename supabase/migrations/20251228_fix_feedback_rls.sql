-- Feedback RLS politikalarını düzelt
-- Anonim kullanıcılar dahil herkes feedback gönderebilmeli

-- Önce mevcut politikaları sil
DROP POLICY IF EXISTS "feedback_insert_any" ON feedback;
DROP POLICY IF EXISTS "feedback_select_own" ON feedback;
DROP POLICY IF EXISTS "feedback_update_admin" ON feedback;
DROP POLICY IF EXISTS "feedback_delete_admin" ON feedback;

-- Herkes feedback oluşturabilir (anonim dahil)
-- TO PUBLIC ile anon ve authenticated roller için izin ver
CREATE POLICY "feedback_insert_public" ON feedback
    FOR INSERT
    TO PUBLIC
    WITH CHECK (true);

-- Kayıtlı kullanıcılar kendi feedback'lerini görebilir, admin hepsini görebilir
-- Anonim kullanıcılar için null kontrolü ekle
CREATE POLICY "feedback_select_policy" ON feedback
    FOR SELECT
    TO PUBLIC
    USING (
        user_id IS NULL 
        OR user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Sadece admin güncelleyebilir
CREATE POLICY "feedback_update_admin_only" ON feedback
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Sadece admin silebilir
CREATE POLICY "feedback_delete_admin_only" ON feedback
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Anonim kullanıcıların insert yapabilmesi için anon role'e grant
GRANT INSERT ON feedback TO anon;
GRANT SELECT ON feedback TO anon;
GRANT INSERT ON feedback TO authenticated;
GRANT SELECT ON feedback TO authenticated;
GRANT UPDATE ON feedback TO authenticated;
GRANT DELETE ON feedback TO authenticated;

