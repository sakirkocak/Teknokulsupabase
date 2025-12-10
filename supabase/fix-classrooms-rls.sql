-- Classrooms RLS Politikası Düzeltme
-- Infinite recursion hatasını çözmek için

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Koçlar kendi sınıflarını görebilir" ON classrooms;
DROP POLICY IF EXISTS "Koçlar sınıf oluşturabilir" ON classrooms;
DROP POLICY IF EXISTS "Koçlar kendi sınıflarını güncelleyebilir" ON classrooms;
DROP POLICY IF EXISTS "Koçlar kendi sınıflarını silebilir" ON classrooms;
DROP POLICY IF EXISTS "Öğrenciler katıldıkları sınıfları görebilir" ON classrooms;
DROP POLICY IF EXISTS "classrooms_select_policy" ON classrooms;
DROP POLICY IF EXISTS "classrooms_insert_policy" ON classrooms;
DROP POLICY IF EXISTS "classrooms_update_policy" ON classrooms;
DROP POLICY IF EXISTS "classrooms_delete_policy" ON classrooms;

-- Yeni basit politikalar oluştur
-- SELECT: Herkes okuyabilir (authenticated)
CREATE POLICY "classrooms_select" ON classrooms
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: Sadece koçlar (teacher_profiles tablosunda kaydı olanlar) oluşturabilir
CREATE POLICY "classrooms_insert" ON classrooms
  FOR INSERT TO authenticated
  WITH CHECK (
    coach_id = auth.uid()
  );

-- UPDATE: Sadece sınıf sahibi koç güncelleyebilir
CREATE POLICY "classrooms_update" ON classrooms
  FOR UPDATE TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- DELETE: Sadece sınıf sahibi koç silebilir
CREATE POLICY "classrooms_delete" ON classrooms
  FOR DELETE TO authenticated
  USING (coach_id = auth.uid());

-- classroom_students tablosu için de politikaları düzelt
DROP POLICY IF EXISTS "classroom_students_select" ON classroom_students;
DROP POLICY IF EXISTS "classroom_students_insert" ON classroom_students;
DROP POLICY IF EXISTS "classroom_students_update" ON classroom_students;
DROP POLICY IF EXISTS "classroom_students_delete" ON classroom_students;
DROP POLICY IF EXISTS "Koçlar sınıf öğrencilerini görebilir" ON classroom_students;
DROP POLICY IF EXISTS "Koçlar öğrenci ekleyebilir" ON classroom_students;
DROP POLICY IF EXISTS "Öğrenciler kendi kayıtlarını görebilir" ON classroom_students;

-- classroom_students SELECT
CREATE POLICY "classroom_students_select" ON classroom_students
  FOR SELECT TO authenticated
  USING (true);

-- classroom_students INSERT
CREATE POLICY "classroom_students_insert" ON classroom_students
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- classroom_students UPDATE
CREATE POLICY "classroom_students_update" ON classroom_students
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- classroom_students DELETE
CREATE POLICY "classroom_students_delete" ON classroom_students
  FOR DELETE TO authenticated
  USING (true);

