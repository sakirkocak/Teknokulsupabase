DROP POLICY IF EXISTS "questions_select_all" ON questions;
CREATE POLICY "questions_select_all" ON questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "topics_select_all" ON topics;
CREATE POLICY "topics_select_all" ON topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "subjects_select_all" ON subjects;
CREATE POLICY "subjects_select_all" ON subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "grade_subjects_select_all" ON grade_subjects;
CREATE POLICY "grade_subjects_select_all" ON grade_subjects FOR SELECT USING (true);
