-- =====================================================
-- VIDEO QUEUE RPC: question_image_url + grade ekle
-- get_next_video_to_process fonksiyonunu genişletir
-- =====================================================

CREATE OR REPLACE FUNCTION get_next_video_to_process()
RETURNS TABLE(
    queue_id UUID,
    question_id UUID,
    question_text TEXT,
    question_image_url TEXT,
    options JSONB,
    correct_answer TEXT,
    explanation TEXT,
    topic_name TEXT,
    subject_name TEXT,
    grade INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH next_item AS (
        SELECT vgq.id, vgq.question_id
        FROM video_generation_queue vgq
        WHERE vgq.status = 'pending'
          AND vgq.retry_count < vgq.max_retries
        ORDER BY vgq.priority DESC, vgq.created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    UPDATE video_generation_queue
    SET status = 'processing', started_at = NOW()
    FROM next_item
    WHERE video_generation_queue.id = next_item.id
    RETURNING 
        video_generation_queue.id,
        video_generation_queue.question_id,
        (SELECT q.question_text FROM questions q WHERE q.id = video_generation_queue.question_id),
        (SELECT q.question_image_url FROM questions q WHERE q.id = video_generation_queue.question_id),
        (SELECT q.options FROM questions q WHERE q.id = video_generation_queue.question_id),
        (SELECT q.correct_answer FROM questions q WHERE q.id = video_generation_queue.question_id),
        (SELECT q.explanation FROM questions q WHERE q.id = video_generation_queue.question_id),
        (SELECT t.main_topic FROM topics t JOIN questions q ON q.topic_id = t.id WHERE q.id = video_generation_queue.question_id),
        (SELECT s.name FROM subjects s JOIN topics t ON t.subject_id = s.id JOIN questions q ON q.topic_id = t.id WHERE q.id = video_generation_queue.question_id),
        (SELECT t.grade FROM topics t JOIN questions q ON q.topic_id = t.id WHERE q.id = video_generation_queue.question_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

