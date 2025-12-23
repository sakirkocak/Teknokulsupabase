-- Notifications tablosu RLS düzeltmesi
-- Öğrencilerin admin'lere bildirim göndermesine izin ver

-- Mevcut insert policy'yi kaldır
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "Bildirimler oluşturulabilir" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;

-- Yeni insert policy - herkes bildirim oluşturabilir
CREATE POLICY "notifications_insert_any" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Select policy - sadece kendi bildirimlerini görebilir
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select" ON notifications;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Update policy - sadece kendi bildirimlerini güncelleyebilir
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

