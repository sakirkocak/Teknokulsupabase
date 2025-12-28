-- ============================================
-- 100K KULLANICI İÇİN PERFORMANS OPTİMİZASYONU
-- Tarih: 2025-12-28
-- ============================================

-- ============================================
-- 1. DUPLICATE INDEX'LERİ SİL (Write Performance +30%)
-- ============================================

-- questions tablosu duplicate indexler
DROP INDEX IF EXISTS idx_questions_topic_hash;
DROP INDEX IF EXISTS idx_questions_topic_difficulty;

-- duel_answers tablosu duplicate indexler
DROP INDEX IF EXISTS idx_duel_answers_duel;
DROP INDEX IF EXISTS idx_duel_answers_student;

-- point_history tablosu duplicate index
DROP INDEX IF EXISTS idx_point_history_recent;

-- ============================================
-- 2. KRİTİK EKSİK INDEX'LERİ EKLE
-- ============================================

-- questions.is_active için partial index (en sık kullanılan filtre)
CREATE INDEX IF NOT EXISTS idx_questions_active 
ON questions(is_active) WHERE is_active = true;

-- questions için composite partial index (topic + active)
CREATE INDEX IF NOT EXISTS idx_questions_active_topic 
ON questions(topic_id) WHERE is_active = true;

-- questions için grade bazlı hızlı erişim
CREATE INDEX IF NOT EXISTS idx_questions_grade_active
ON questions(topic_id, is_active)
INCLUDE (id, question_text, difficulty)
WHERE is_active = true;

-- ============================================
-- 3. TYPESENSE_SYNC_LOG TEMİZLE (28MB Kurtarır)
-- ============================================

-- 7 günden eski sync loglarını sil
DELETE FROM typesense_sync_log 
WHERE synced_at < NOW() - INTERVAL '7 days';

-- ============================================
-- 4. TABLO İSTATİSTİKLERİNİ GÜNCELLE
-- ============================================

-- En çok sorgulanan tabloların istatistiklerini güncelle
ANALYZE questions;
ANALYZE topics;
ANALYZE subjects;
ANALYZE user_answers;
ANALYZE point_history;
ANALYZE student_points;
ANALYZE student_profiles;
ANALYZE duels;
ANALYZE duel_lobby;

-- ============================================
-- 5. EK OPTİMİZASYONLAR
-- ============================================

-- student_points için covering index (leaderboard sorguları için)
CREATE INDEX IF NOT EXISTS idx_student_points_leaderboard_v2
ON student_points(total_points DESC, student_id)
INCLUDE (total_questions, total_correct, current_streak);

-- point_history için BRIN index (tarih bazlı sorgular için daha verimli)
-- Zaten var ama kontrol edelim
CREATE INDEX IF NOT EXISTS idx_point_history_created_brin
ON point_history USING BRIN(created_at);

-- duels için status + created_at composite
CREATE INDEX IF NOT EXISTS idx_duels_status_created
ON duels(status, created_at DESC);

-- ============================================
-- NOT: VACUUM FULL migration içinde çalıştırılamaz
-- Ayrı olarak çalıştırılmalı
-- ============================================
