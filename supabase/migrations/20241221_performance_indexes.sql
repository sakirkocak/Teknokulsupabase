-- =====================================================
-- PERFORMANS INDEX'LERİ
-- 100K+ kullanıcı için optimize edilmiş
-- =====================================================

-- =====================================================
-- 1. STUDENT_POINTS - Liderlik Tablosu Sorguları
-- =====================================================

-- Genel liderlik sıralaması için
CREATE INDEX IF NOT EXISTS idx_student_points_total_desc 
ON student_points(total_points DESC);

-- Sınıf bazlı liderlik için
CREATE INDEX IF NOT EXISTS idx_student_points_grade_total 
ON student_points(total_points DESC) 
INCLUDE (student_id, total_questions, total_correct);

-- Son aktivite bazlı sorgular için
CREATE INDEX IF NOT EXISTS idx_student_points_last_activity 
ON student_points(last_activity_at DESC);

-- Streak sorguları için
CREATE INDEX IF NOT EXISTS idx_student_points_streak 
ON student_points(current_streak DESC);

-- =====================================================
-- 2. STUDENT_SUBJECT_POINTS - Ders Bazlı Liderlik
-- =====================================================

-- Ders bazlı liderlik sıralaması
CREATE INDEX IF NOT EXISTS idx_subject_points_subject_points 
ON student_subject_points(subject_id, points DESC);

-- Öğrenci bazlı ders puanları
CREATE INDEX IF NOT EXISTS idx_subject_points_student 
ON student_subject_points(student_id);

-- =====================================================
-- 3. QUESTIONS - Soru Sorguları
-- =====================================================

-- Konu ve zorluk bazlı soru çekme
CREATE INDEX IF NOT EXISTS idx_questions_topic_difficulty 
ON questions(topic_id, difficulty);

-- Oluşturulma tarihine göre (admin paneli için)
CREATE INDEX IF NOT EXISTS idx_questions_created 
ON questions(created_at DESC);

-- Aktif sorular için
CREATE INDEX IF NOT EXISTS idx_questions_active 
ON questions(is_active) 
WHERE is_active = true;

-- =====================================================
-- 4. TOPICS - Konu Sorguları
-- =====================================================

-- Sınıf ve ders bazlı konu çekme
CREATE INDEX IF NOT EXISTS idx_topics_grade_subject 
ON topics(grade, subject_id);

-- Ana konu bazlı gruplama
CREATE INDEX IF NOT EXISTS idx_topics_main_topic 
ON topics(subject_id, main_topic);

-- =====================================================
-- 5. PROFILES - Kullanıcı Sorguları
-- =====================================================

-- Rol bazlı kullanıcı listesi
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role);

-- E-posta ile arama
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- =====================================================
-- 6. STUDENT_PROFILES - Öğrenci Sorguları
-- =====================================================

-- Sınıf bazlı öğrenci listesi
CREATE INDEX IF NOT EXISTS idx_student_profiles_grade 
ON student_profiles(grade);

-- Şehir bazlı
CREATE INDEX IF NOT EXISTS idx_student_profiles_city 
ON student_profiles(city);

-- İlçe bazlı
CREATE INDEX IF NOT EXISTS idx_student_profiles_district 
ON student_profiles(district);

-- Okul bazlı
CREATE INDEX IF NOT EXISTS idx_student_profiles_school 
ON student_profiles(school_id);

-- Kompozit index (liderlik filtreleri için)
CREATE INDEX IF NOT EXISTS idx_student_profiles_location 
ON student_profiles(city, district, school_id, grade);

-- =====================================================
-- 7. XP_HISTORY - XP Geçmişi (En kritik tablo)
-- =====================================================

-- Kullanıcı bazlı XP geçmişi
CREATE INDEX IF NOT EXISTS idx_xp_history_user_date 
ON xp_history(user_id, created_at DESC);

-- Tarih bazlı temizlik için
CREATE INDEX IF NOT EXISTS idx_xp_history_created 
ON xp_history(created_at);

-- =====================================================
-- 8. CHALLENGE_PROGRESS - Günlük Görevler
-- =====================================================

-- Kullanıcı ve görev bazlı
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user 
ON challenge_progress(user_id, challenge_id);

-- Tamamlanma durumu
CREATE INDEX IF NOT EXISTS idx_challenge_progress_completed 
ON challenge_progress(is_completed, completed_at DESC);

-- =====================================================
-- 9. USER_BADGES - Rozetler
-- =====================================================

-- Kullanıcı rozetleri
CREATE INDEX IF NOT EXISTS idx_user_badges_user 
ON user_badges(user_id);

-- Rozet bazlı (kaç kişi kazandı)
CREATE INDEX IF NOT EXISTS idx_user_badges_badge 
ON user_badges(badge_id);

-- =====================================================
-- 10. QUESTION_REPORTS - Soru Bildirimleri
-- =====================================================

-- Durum bazlı (admin paneli için)
CREATE INDEX IF NOT EXISTS idx_question_reports_status 
ON question_reports(status, created_at DESC);

-- Soru bazlı
CREATE INDEX IF NOT EXISTS idx_question_reports_question 
ON question_reports(question_id);

-- =====================================================
-- 11. DUELS - Düello Sorguları
-- =====================================================

-- Kullanıcı düelloları
CREATE INDEX IF NOT EXISTS idx_duels_challenger 
ON duels(challenger_id, status);

CREATE INDEX IF NOT EXISTS idx_duels_opponent 
ON duels(opponent_id, status);

-- Aktif düellolar
CREATE INDEX IF NOT EXISTS idx_duels_status 
ON duels(status, created_at DESC);

-- =====================================================
-- 12. SCHOOLS - Okul Sorguları
-- =====================================================

-- Şehir ve ilçe bazlı okul listesi
CREATE INDEX IF NOT EXISTS idx_schools_location 
ON schools(city, district);

-- =====================================================
-- ANALYZE - İstatistikleri Güncelle
-- =====================================================

-- Tüm tabloların istatistiklerini güncelle
ANALYZE student_points;
ANALYZE student_subject_points;
ANALYZE questions;
ANALYZE topics;
ANALYZE profiles;
ANALYZE student_profiles;
ANALYZE xp_history;
ANALYZE challenge_progress;
ANALYZE user_badges;
ANALYZE question_reports;
ANALYZE duels;
ANALYZE schools;

-- =====================================================
-- NOT: Bu index'ler sorgu performansını artırır ancak
-- yazma işlemlerini biraz yavaşlatabilir. 
-- 100K+ kullanıcı için bu trade-off kabul edilebilir.
-- =====================================================

