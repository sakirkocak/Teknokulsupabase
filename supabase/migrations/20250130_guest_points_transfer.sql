-- =====================================================
-- MİSAFİR PUAN TRANSFER SİSTEMİ
-- Kayıt olan misafir kullanıcıların puanlarını takip etmek için
-- =====================================================

-- guest_sessions tablosuna transfer bilgisi ekle
ALTER TABLE guest_sessions 
ADD COLUMN IF NOT EXISTS transferred_to_user UUID REFERENCES auth.users(id);

COMMENT ON COLUMN guest_sessions.transferred_to_user IS 'Puanların transfer edildiği kayıtlı kullanıcı';

-- İndeks ekle (transfer olmayan session'ları bulmak için)
CREATE INDEX IF NOT EXISTS idx_guest_sessions_not_transferred 
ON guest_sessions(session_token) 
WHERE transferred_to_user IS NULL;

